import { createGoogle } from "@ai-sdk/google";
import {
  addRagMessage,
  createRagConversation,
  findExactFaq,
  getIndexableSource,
  getKnowledgeBaseBySlug,
  replaceSourceChunks,
  searchChunksByEmbedding,
  searchPublishedKnowledge,
  setSourceIndexStatus,
} from "@wuliuqi/rag-db";
import {
  CHAT_ROLE,
  KNOWLEDGE_INDEX_STATUS,
  KNOWLEDGE_SOURCE_TYPE,
  KNOWLEDGE_STATUS,
} from "@wuliuqi/types";
import type {
  ChatMessageInput,
  FaqItem,
  KnowledgeArticle,
  KnowledgeChunk,
  KnowledgeSourceType,
  RagMessageSource,
} from "@wuliuqi/types";
import { streamText } from "ai";

type ModelProvider = {
  streamAnswer: (input: {
    system: string;
    prompt: string;
    abortSignal?: AbortSignal;
  }) => Response;
  embedTexts: (texts: string[]) => Promise<number[][]>;
};

const DEFAULT_CHUNK_SIZE = 900;
const DEFAULT_CHUNK_OVERLAP = 120;
const DEFAULT_TOP_K = 6;
const DEFAULT_MIN_SCORE = 0.72;

export class RagError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status = 400,
  ) {
    super(message);
    this.name = "RagError";
  }
}

export async function indexKnowledgeSource(
  sourceType: KnowledgeSourceType,
  sourceId: string,
): Promise<{ indexed: boolean; chunks: number }> {
  await setSourceIndexStatus(
    sourceType,
    sourceId,
    KNOWLEDGE_INDEX_STATUS.indexing,
  );

  try {
    const source = await getIndexableSource(sourceType, sourceId);

    if (!source) {
      throw new RagError("NOT_FOUND", "索引内容不存在", 404);
    }

    if (source.status !== KNOWLEDGE_STATUS.published) {
      await replaceSourceChunks(sourceType, sourceId, []);
      await setSourceIndexStatus(
        sourceType,
        sourceId,
        KNOWLEDGE_INDEX_STATUS.indexed,
      );
      return { indexed: false, chunks: 0 };
    }

    const texts =
      sourceType === KNOWLEDGE_SOURCE_TYPE.article
        ? buildArticleChunks(source as KnowledgeArticle)
        : [faqToIndexText(source as FaqItem)];

    const embeddings = await getModelProvider().embedTexts(texts);
    const chunks = texts.map((content, index) => ({
      knowledgeBaseId: source.knowledgeBaseId,
      sourceType,
      sourceId: source.id,
      title:
        sourceType === KNOWLEDGE_SOURCE_TYPE.article
          ? (source as KnowledgeArticle).title
          : (source as FaqItem).question,
      content,
      embedding: embeddings[index] ?? [],
      metadata: sourceMetadata(sourceType, source),
    }));

    await replaceSourceChunks(sourceType, sourceId, chunks);
    await setSourceIndexStatus(
      sourceType,
      sourceId,
      KNOWLEDGE_INDEX_STATUS.indexed,
    );

    return { indexed: true, chunks: chunks.length };
  } catch (error) {
    await setSourceIndexStatus(
      sourceType,
      sourceId,
      KNOWLEDGE_INDEX_STATUS.failed,
      error instanceof Error ? error.message : "索引失败",
    );
    throw error;
  }
}

export async function createChatStreamResponse(input: {
  kbSlug: string;
  messages: ChatMessageInput[];
  abortSignal?: AbortSignal;
}): Promise<Response> {
  const question = latestUserMessage(input.messages);

  if (!question) {
    return textStreamResponse("请先输入你的问题。");
  }

  const base = await getKnowledgeBaseBySlug(input.kbSlug);

  if (!base) {
    return textStreamResponse("当前帮助中心不可访问，请稍后再试。");
  }

  const conversationId = await createRagConversation(
    base.id,
    question.slice(0, 80),
  ).catch(() => undefined);

  if (conversationId) {
    await addRagMessage({
      conversationId,
      role: CHAT_ROLE.user,
      content: question,
    }).catch(() => undefined);
  }

  if (needsHumanSupport(question)) {
    return textStreamResponse(humanFallback(), conversationId);
  }

  const exactFaq = await findExactFaq(input.kbSlug, question);

  if (exactFaq) {
    const answer = `${exactFaq.answer}\n\n来源：[${exactFaq.question}](/kb/${input.kbSlug}#faq-${exactFaq.id})`;
    return textStreamResponse(answer, conversationId, [
      {
        title: exactFaq.question,
        href: `/kb/${input.kbSlug}#faq-${exactFaq.id}`,
        sourceType: KNOWLEDGE_SOURCE_TYPE.faq,
        sourceId: exactFaq.id,
      },
    ]);
  }

  const [embedding] = await getModelProvider().embedTexts([question]);
  const chunks = embedding
    ? await searchChunksByEmbedding({
        knowledgeBaseSlug: input.kbSlug,
        embedding,
        topK: DEFAULT_TOP_K,
        minScore: DEFAULT_MIN_SCORE,
      })
    : [];

  if (chunks.length === 0) {
    const related = await searchPublishedKnowledge({
      knowledgeBaseSlug: input.kbSlug,
      query: question,
      limit: 3,
    }).catch(() => []);
    const suffix =
      related.length > 0
        ? `\n\n你也可以先看这些内容：\n${related
            .map((item) => `- [${item.title}](${item.href})`)
            .join("\n")}`
        : "";

    return textStreamResponse(`${noKnowledgeFallback()}${suffix}`, conversationId);
  }

  const sources = chunksToSources(input.kbSlug, chunks);
  const result = getModelProvider().streamAnswer({
    system: supportSystemPrompt(),
    prompt: buildAnswerPrompt(question, chunks, sources),
    abortSignal: input.abortSignal,
  });

  return result;
}

export function getModelProvider(): ModelProvider {
  const provider = process.env.RAG_MODEL_PROVIDER ?? "gemini";

  if (provider !== "gemini") {
    throw new RagError("UNSUPPORTED_MODEL_PROVIDER", `暂不支持模型供应商 ${provider}`, 500);
  }

  return geminiProvider();
}

function geminiProvider(): ModelProvider {
  return {
    streamAnswer(input) {
      const apiKey = requireEnv("GEMINI_API_KEY");
      const google = createGoogle({ apiKey });
      const result = streamText({
        model: google(process.env.GEMINI_CHAT_MODEL ?? "gemini-3.5-flash"),
        system: input.system,
        prompt: input.prompt,
        abortSignal: input.abortSignal,
      });

      return result.toTextStreamResponse();
    },
    async embedTexts(texts) {
      const results: number[][] = [];

      for (const text of texts) {
        results.push(await embedGeminiText(text));
      }

      return results;
    },
  };
}

async function embedGeminiText(text: string): Promise<number[]> {
  const apiKey = requireEnv("GEMINI_API_KEY");
  const model = process.env.GEMINI_EMBEDDING_MODEL ?? "gemini-embedding-2";
  const dimensions = Number(process.env.GEMINI_EMBEDDING_DIMENSIONS ?? 768);
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: {
        parts: [{ text }],
      },
      embedContentConfig: {
        outputDimensionality: dimensions,
      },
    }),
  });

  if (!response.ok) {
    throw new RagError(
      "GEMINI_EMBEDDING_FAILED",
      `Gemini embedding 失败：${response.status}`,
      502,
    );
  }

  const payload = (await response.json()) as {
    embedding?: { values?: number[]; value?: number[] };
    embeddings?: Array<{ values?: number[]; value?: number[] }>;
  };
  const values =
    payload.embedding?.values ??
    payload.embedding?.value ??
    payload.embeddings?.[0]?.values ??
    payload.embeddings?.[0]?.value;

  if (!values || values.length === 0) {
    throw new RagError("BAD_GEMINI_EMBEDDING", "Gemini 未返回有效向量", 502);
  }

  return values;
}

function buildArticleChunks(article: KnowledgeArticle): string[] {
  const normalized = `${article.title}\n\n${article.excerpt ?? ""}\n\n${article.content}`
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (normalized.length <= DEFAULT_CHUNK_SIZE) {
    return [normalized];
  }

  const chunks: string[] = [];
  let offset = 0;

  while (offset < normalized.length) {
    const end = Math.min(offset + DEFAULT_CHUNK_SIZE, normalized.length);
    chunks.push(normalized.slice(offset, end));

    if (end >= normalized.length) {
      break;
    }

    offset = Math.max(end - DEFAULT_CHUNK_OVERLAP, offset + 1);
  }

  return chunks;
}

function faqToIndexText(faq: FaqItem) {
  const aliases = faq.aliases.length > 0 ? `\n相似问法：${faq.aliases.join("、")}` : "";

  return `问题：${faq.question}${aliases}\n回答：${faq.answer}`;
}

function sourceMetadata(
  sourceType: KnowledgeSourceType,
  source: KnowledgeArticle | FaqItem,
): Record<string, unknown> {
  if (sourceType === KNOWLEDGE_SOURCE_TYPE.article) {
    const article = source as KnowledgeArticle;
    return {
      slug: article.slug,
      excerpt: article.excerpt,
      tags: article.tags,
    };
  }

  const faq = source as FaqItem;
  return {
    aliases: faq.aliases,
    tags: faq.tags,
  };
}

function latestUserMessage(messages: ChatMessageInput[]) {
  return [...messages]
    .reverse()
    .find((message) => message.role === CHAT_ROLE.user)
    ?.content.trim();
}

function needsHumanSupport(question: string) {
  return /订单|付款|支付|退款|纠纷|投诉|隐私|密码|验证码|库存|价格|砍价|找回/.test(
    question,
  );
}

function humanFallback() {
  return "这个问题可能涉及订单、支付、库存、账号隐私或售后争议，需要人工确认后再处理。请联系人工客服，并提供必要的订单或账号信息。";
}

function noKnowledgeFallback() {
  return "我在当前帮助中心里没有找到足够明确的依据，先不乱回答。建议联系人工客服确认，避免影响账号使用或售后处理。";
}

function supportSystemPrompt() {
  return [
    "你是五六七手游店的买家帮助中心 AI 助手。",
    "只允许基于提供的帮助中心资料回答。",
    "回答要简短、清楚、偏客服话术。",
    "如果资料不足，明确说无法确认并引导联系人工客服。",
    "涉及订单、付款、退款、账号隐私、库存、价格、售后争议时，不要自行处理，必须引导人工。",
    "回答末尾保留资料来源链接。",
  ].join("\n");
}

function buildAnswerPrompt(
  question: string,
  chunks: KnowledgeChunk[],
  sources: RagMessageSource[],
) {
  const context = chunks
    .map(
      (chunk, index) =>
        `资料 ${index + 1}：${chunk.title}\n${chunk.content}\n来源：${sources[index]?.href ?? ""}`,
    )
    .join("\n\n---\n\n");

  return `买家问题：${question}\n\n可用资料：\n${context}\n\n请基于资料回答，并在末尾列出“来源”。`;
}

function chunksToSources(
  kbSlug: string,
  chunks: KnowledgeChunk[],
): RagMessageSource[] {
  const seen = new Set<string>();
  const sources: RagMessageSource[] = [];

  for (const chunk of chunks) {
    const href =
      chunk.sourceType === KNOWLEDGE_SOURCE_TYPE.article
        ? `/kb/${kbSlug}/docs/${String(chunk.metadata.slug ?? "")}`
        : `/kb/${kbSlug}#faq-${chunk.sourceId}`;
    const key = `${chunk.sourceType}:${chunk.sourceId}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    sources.push({
      title: chunk.title,
      href,
      sourceType: chunk.sourceType,
      sourceId: chunk.sourceId,
      score: chunk.score,
    });
  }

  return sources;
}

function textStreamResponse(
  text: string,
  conversationId?: string,
  sources: RagMessageSource[] = [],
) {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(text));
      controller.close();
    },
  });

  if (conversationId) {
    void addRagMessage({
      conversationId,
      role: CHAT_ROLE.assistant,
      content: text,
      sources,
    }).catch(() => undefined);
  }

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}

function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new RagError("MODEL_CONFIG_ERROR", `缺少 ${name}`, 500);
  }

  return value;
}
