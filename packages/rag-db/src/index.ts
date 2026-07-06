import type {
  FaqItem,
  KnowledgeArticle,
  KnowledgeBase,
  KnowledgeCategory,
  KnowledgeChunk,
  KnowledgeSearchResult,
  RagMessageSource,
} from "@wuliuqi/types";
import postgres from "postgres";

type SqlClient = postgres.Sql<Record<string, unknown>>;
type KnowledgeStatus = "draft" | "published" | "archived";
type IndexStatus = "pending" | "indexing" | "indexed" | "failed";
type SourceType = "article" | "faq";

type BaseInput = {
  name: string;
  slug: string;
  description?: string;
  visibility?: "public" | "private";
  status?: KnowledgeStatus;
};

type CategoryInput = {
  knowledgeBaseId: string;
  name: string;
  slug: string;
  description?: string;
  sortOrder?: number;
};

type ArticleInput = {
  knowledgeBaseId: string;
  categoryId?: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  status?: KnowledgeStatus;
  tags?: string[];
  sortOrder?: number;
};

type FaqInput = {
  knowledgeBaseId: string;
  categoryId?: string;
  question: string;
  answer: string;
  aliases?: string[];
  status?: KnowledgeStatus;
  tags?: string[];
  sortOrder?: number;
};

type ChunkInput = {
  knowledgeBaseId: string;
  sourceType: SourceType;
  sourceId: string;
  title: string;
  content: string;
  embedding: number[];
  metadata: Record<string, unknown>;
};

let client: SqlClient | undefined;

export class RagDbError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status = 400,
  ) {
    super(message);
    this.name = "RagDbError";
  }
}

export function getRagSql() {
  const databaseUrl = process.env.RAG_DATABASE_URL;

  if (!databaseUrl) {
    throw new RagDbError("RAG_DB_CONFIG_ERROR", "缺少 RAG_DATABASE_URL", 500);
  }

  client ??= postgres(databaseUrl, {
    max: Number(process.env.RAG_DB_POOL_SIZE ?? 5),
    prepare: false,
  });

  return client;
}

export async function listKnowledgeBases(): Promise<KnowledgeBase[]> {
  const rows = await getRagSql()`
    SELECT *
    FROM knowledge_bases
    ORDER BY updated_at DESC
  `;

  return rows.map(serializeBase);
}

export async function getKnowledgeBaseById(
  id: string,
): Promise<KnowledgeBase | null> {
  const [row] = await getRagSql()`
    SELECT *
    FROM knowledge_bases
    WHERE id = ${id}
  `;

  return row ? serializeBase(row) : null;
}

export async function getKnowledgeBaseBySlug(
  slug: string,
): Promise<KnowledgeBase | null> {
  const [row] = await getRagSql()`
    SELECT *
    FROM knowledge_bases
    WHERE slug = ${slug}
      AND status = 'published'
      AND visibility = 'public'
  `;

  return row ? serializeBase(row) : null;
}

export async function createKnowledgeBase(
  input: BaseInput,
): Promise<KnowledgeBase> {
  const [row] = await getRagSql()`
    INSERT INTO knowledge_bases (name, slug, description, visibility, status)
    VALUES (
      ${input.name},
      ${input.slug},
      ${input.description ?? null},
      ${input.visibility ?? "public"},
      ${input.status ?? "published"}
    )
    RETURNING *
  `;

  return serializeBase(assertRow(row, "创建知识库失败"));
}

export async function updateKnowledgeBase(
  id: string,
  input: Partial<BaseInput>,
): Promise<KnowledgeBase> {
  const existing = await getKnowledgeBaseById(id);

  if (!existing) {
    throw new RagDbError("NOT_FOUND", "知识库不存在", 404);
  }

  const [row] = await getRagSql()`
    UPDATE knowledge_bases
    SET name = ${input.name ?? existing.name},
        slug = ${input.slug ?? existing.slug},
        description = ${input.description ?? existing.description ?? null},
        visibility = ${input.visibility ?? existing.visibility},
        status = ${input.status ?? existing.status}
    WHERE id = ${id}
    RETURNING *
  `;

  return serializeBase(assertRow(row, "更新知识库失败"));
}

export async function listKnowledgeCategories(
  knowledgeBaseId: string,
): Promise<KnowledgeCategory[]> {
  const rows = await getRagSql()`
    SELECT *
    FROM knowledge_categories
    WHERE knowledge_base_id = ${knowledgeBaseId}
    ORDER BY sort_order ASC, created_at ASC
  `;

  return rows.map(serializeCategory);
}

export async function createKnowledgeCategory(
  input: CategoryInput,
): Promise<KnowledgeCategory> {
  const [row] = await getRagSql()`
    INSERT INTO knowledge_categories (
      knowledge_base_id,
      name,
      slug,
      description,
      sort_order
    )
    VALUES (
      ${input.knowledgeBaseId},
      ${input.name},
      ${input.slug},
      ${input.description ?? null},
      ${input.sortOrder ?? 0}
    )
    RETURNING *
  `;

  return serializeCategory(assertRow(row, "创建分类失败"));
}

export async function updateKnowledgeCategory(
  id: string,
  input: Partial<Omit<CategoryInput, "knowledgeBaseId">>,
): Promise<KnowledgeCategory> {
  const existing = await getCategoryById(id);

  if (!existing) {
    throw new RagDbError("NOT_FOUND", "分类不存在", 404);
  }

  const [row] = await getRagSql()`
    UPDATE knowledge_categories
    SET name = ${input.name ?? existing.name},
        slug = ${input.slug ?? existing.slug},
        description = ${input.description ?? existing.description ?? null},
        sort_order = ${input.sortOrder ?? existing.sortOrder}
    WHERE id = ${id}
    RETURNING *
  `;

  return serializeCategory(assertRow(row, "更新分类失败"));
}

export async function deleteKnowledgeCategory(id: string): Promise<void> {
  await getRagSql()`
    DELETE FROM knowledge_categories
    WHERE id = ${id}
  `;
}

export async function listKnowledgeArticles(
  knowledgeBaseId: string,
): Promise<KnowledgeArticle[]> {
  const rows = await getRagSql()`
    SELECT *
    FROM knowledge_articles
    WHERE knowledge_base_id = ${knowledgeBaseId}
    ORDER BY sort_order ASC, updated_at DESC
  `;

  return rows.map(serializeArticle);
}

export async function listPublishedArticlesByCategory(
  knowledgeBaseSlug: string,
  categorySlug: string,
): Promise<KnowledgeArticle[]> {
  const rows = await getRagSql()`
    SELECT a.*
    FROM knowledge_articles a
    INNER JOIN knowledge_bases b ON b.id = a.knowledge_base_id
    INNER JOIN knowledge_categories c ON c.id = a.category_id
    WHERE b.slug = ${knowledgeBaseSlug}
      AND b.status = 'published'
      AND b.visibility = 'public'
      AND c.slug = ${categorySlug}
      AND a.status = 'published'
    ORDER BY a.sort_order ASC, a.updated_at DESC
  `;

  return rows.map(serializeArticle);
}

export async function getKnowledgeArticleById(
  id: string,
): Promise<KnowledgeArticle | null> {
  const [row] = await getRagSql()`
    SELECT *
    FROM knowledge_articles
    WHERE id = ${id}
  `;

  return row ? serializeArticle(row) : null;
}

export async function getPublishedArticleBySlug(
  knowledgeBaseSlug: string,
  articleSlug: string,
): Promise<KnowledgeArticle | null> {
  const [row] = await getRagSql()`
    SELECT a.*
    FROM knowledge_articles a
    INNER JOIN knowledge_bases b ON b.id = a.knowledge_base_id
    WHERE b.slug = ${knowledgeBaseSlug}
      AND b.status = 'published'
      AND b.visibility = 'public'
      AND a.slug = ${articleSlug}
      AND a.status = 'published'
  `;

  return row ? serializeArticle(row) : null;
}

export async function createKnowledgeArticle(
  input: ArticleInput,
): Promise<KnowledgeArticle> {
  const status = input.status ?? "draft";
  const [row] = await getRagSql()`
    INSERT INTO knowledge_articles (
      knowledge_base_id,
      category_id,
      title,
      slug,
      excerpt,
      content,
      status,
      index_status,
      tags,
      sort_order,
      published_at
    )
    VALUES (
      ${input.knowledgeBaseId},
      ${input.categoryId ?? null},
      ${input.title},
      ${input.slug},
      ${input.excerpt ?? null},
      ${input.content},
      ${status},
      'pending',
      ${JSON.stringify(input.tags ?? [])}::jsonb,
      ${input.sortOrder ?? 0},
      ${status === "published" ? new Date() : null}
    )
    RETURNING *
  `;

  return serializeArticle(assertRow(row, "创建文章失败"));
}

export async function updateKnowledgeArticle(
  id: string,
  input: Partial<Omit<ArticleInput, "knowledgeBaseId">>,
): Promise<KnowledgeArticle> {
  const existing = await getKnowledgeArticleById(id);

  if (!existing) {
    throw new RagDbError("NOT_FOUND", "文章不存在", 404);
  }

  const nextStatus = input.status ?? existing.status;
  const [row] = await getRagSql()`
    UPDATE knowledge_articles
    SET category_id = ${input.categoryId ?? existing.categoryId ?? null},
        title = ${input.title ?? existing.title},
        slug = ${input.slug ?? existing.slug},
        excerpt = ${input.excerpt ?? existing.excerpt ?? null},
        content = ${input.content ?? existing.content},
        status = ${nextStatus},
        index_status = 'pending',
        index_error = null,
        tags = ${JSON.stringify(input.tags ?? existing.tags)}::jsonb,
        sort_order = ${input.sortOrder ?? existing.sortOrder},
        published_at = CASE
          WHEN ${nextStatus} = 'published' AND published_at IS NULL THEN now()
          WHEN ${nextStatus} <> 'published' THEN NULL
          ELSE published_at
        END
    WHERE id = ${id}
    RETURNING *
  `;

  return serializeArticle(assertRow(row, "更新文章失败"));
}

export async function deleteKnowledgeArticle(id: string): Promise<void> {
  await getRagSql()`
    DELETE FROM knowledge_articles
    WHERE id = ${id}
  `;
}

export async function listFaqItems(knowledgeBaseId: string): Promise<FaqItem[]> {
  const rows = await getRagSql()`
    SELECT *
    FROM faq_items
    WHERE knowledge_base_id = ${knowledgeBaseId}
    ORDER BY sort_order ASC, updated_at DESC
  `;

  return rows.map(serializeFaq);
}

export async function createFaqItem(input: FaqInput): Promise<FaqItem> {
  const status = input.status ?? "draft";
  const [row] = await getRagSql()`
    INSERT INTO faq_items (
      knowledge_base_id,
      category_id,
      question,
      answer,
      aliases,
      status,
      index_status,
      tags,
      sort_order,
      published_at
    )
    VALUES (
      ${input.knowledgeBaseId},
      ${input.categoryId ?? null},
      ${input.question},
      ${input.answer},
      ${JSON.stringify(input.aliases ?? [])}::jsonb,
      ${status},
      'pending',
      ${JSON.stringify(input.tags ?? [])}::jsonb,
      ${input.sortOrder ?? 0},
      ${status === "published" ? new Date() : null}
    )
    RETURNING *
  `;

  return serializeFaq(assertRow(row, "创建 FAQ 失败"));
}

export async function updateFaqItem(
  id: string,
  input: Partial<Omit<FaqInput, "knowledgeBaseId">>,
): Promise<FaqItem> {
  const existing = await getFaqItemById(id);

  if (!existing) {
    throw new RagDbError("NOT_FOUND", "FAQ 不存在", 404);
  }

  const nextStatus = input.status ?? existing.status;
  const [row] = await getRagSql()`
    UPDATE faq_items
    SET category_id = ${input.categoryId ?? existing.categoryId ?? null},
        question = ${input.question ?? existing.question},
        answer = ${input.answer ?? existing.answer},
        aliases = ${JSON.stringify(input.aliases ?? existing.aliases)}::jsonb,
        status = ${nextStatus},
        index_status = 'pending',
        index_error = null,
        tags = ${JSON.stringify(input.tags ?? existing.tags)}::jsonb,
        sort_order = ${input.sortOrder ?? existing.sortOrder},
        published_at = CASE
          WHEN ${nextStatus} = 'published' AND published_at IS NULL THEN now()
          WHEN ${nextStatus} <> 'published' THEN NULL
          ELSE published_at
        END
    WHERE id = ${id}
    RETURNING *
  `;

  return serializeFaq(assertRow(row, "更新 FAQ 失败"));
}

export async function deleteFaqItem(id: string): Promise<void> {
  await getRagSql()`
    DELETE FROM faq_items
    WHERE id = ${id}
  `;
}

export async function getFaqItemById(id: string): Promise<FaqItem | null> {
  const [row] = await getRagSql()`
    SELECT *
    FROM faq_items
    WHERE id = ${id}
  `;

  return row ? serializeFaq(row) : null;
}

export async function getIndexableSource(
  sourceType: SourceType,
  sourceId: string,
): Promise<KnowledgeArticle | FaqItem | null> {
  return sourceType === "article"
    ? getKnowledgeArticleById(sourceId)
    : getFaqItemById(sourceId);
}

export async function setSourceIndexStatus(
  sourceType: SourceType,
  sourceId: string,
  status: IndexStatus,
  error?: string,
): Promise<void> {
  const sql = getRagSql();

  if (sourceType === "article") {
    await sql`
      UPDATE knowledge_articles
      SET index_status = ${status}, index_error = ${error ?? null}
      WHERE id = ${sourceId}
    `;
    return;
  }

  await sql`
    UPDATE faq_items
    SET index_status = ${status}, index_error = ${error ?? null}
    WHERE id = ${sourceId}
  `;
}

export async function replaceSourceChunks(
  sourceType: SourceType,
  sourceId: string,
  chunks: ChunkInput[],
): Promise<void> {
  const sql = getRagSql();

  await sql.begin(async (tx) => {
    await tx`
      DELETE FROM knowledge_chunks
      WHERE source_type = ${sourceType}
        AND source_id = ${sourceId}
    `;

    for (const chunk of chunks) {
      await tx`
        INSERT INTO knowledge_chunks (
          knowledge_base_id,
          source_type,
          source_id,
          title,
          content,
          embedding,
          metadata
        )
        VALUES (
          ${chunk.knowledgeBaseId},
          ${chunk.sourceType},
          ${chunk.sourceId},
          ${chunk.title},
          ${chunk.content},
          ${formatVector(chunk.embedding)}::extensions.vector,
          ${JSON.stringify(chunk.metadata)}::jsonb
        )
      `;
    }
  });
}

export async function findExactFaq(
  knowledgeBaseSlug: string,
  question: string,
): Promise<FaqItem | null> {
  const normalized = question.trim().toLowerCase();

  if (!normalized) {
    return null;
  }

  const [row] = await getRagSql()`
    SELECT f.*
    FROM faq_items f
    INNER JOIN knowledge_bases b ON b.id = f.knowledge_base_id
    WHERE b.slug = ${knowledgeBaseSlug}
      AND b.status = 'published'
      AND b.visibility = 'public'
      AND f.status = 'published'
      AND (
        lower(f.question) = ${normalized}
        OR EXISTS (
          SELECT 1
          FROM jsonb_array_elements_text(
            CASE
              WHEN jsonb_typeof(f.aliases) = 'array' THEN f.aliases
              ELSE '[]'::jsonb
            END
          ) alias
          WHERE lower(alias) = ${normalized}
        )
        OR (
          jsonb_typeof(f.aliases) = 'string'
          AND lower(f.aliases #>> '{}') = ${normalized}
        )
      )
    ORDER BY f.sort_order ASC, f.updated_at DESC
    LIMIT 1
  `;

  return row ? serializeFaq(row) : null;
}

export async function searchChunksByEmbedding(input: {
  knowledgeBaseSlug: string;
  embedding: number[];
  topK?: number;
  minScore?: number;
}): Promise<KnowledgeChunk[]> {
  const vector = formatVector(input.embedding);
  const rows = await getRagSql()`
    SELECT
      c.*,
      1 - (c.embedding <=> ${vector}::extensions.vector) AS score
    FROM knowledge_chunks c
    INNER JOIN knowledge_bases b ON b.id = c.knowledge_base_id
    WHERE b.slug = ${input.knowledgeBaseSlug}
      AND b.status = 'published'
      AND b.visibility = 'public'
      AND 1 - (c.embedding <=> ${vector}::extensions.vector) >= ${input.minScore ?? 0}
    ORDER BY c.embedding <=> ${vector}::extensions.vector
    LIMIT ${input.topK ?? 6}
  `;

  return rows.map(serializeChunk);
}

export async function searchPublishedKnowledge(input: {
  knowledgeBaseSlug: string;
  query: string;
  limit?: number;
}): Promise<KnowledgeSearchResult[]> {
  const keyword = `%${input.query.trim()}%`;
  const limit = input.limit ?? 8;

  if (input.query.trim().length === 0) {
    return [];
  }

  const articleRows = await getRagSql()`
    SELECT a.id, a.title, a.excerpt, a.slug, 'article' AS type, c.name AS category_name
    FROM knowledge_articles a
    INNER JOIN knowledge_bases b ON b.id = a.knowledge_base_id
    LEFT JOIN knowledge_categories c ON c.id = a.category_id
    WHERE b.slug = ${input.knowledgeBaseSlug}
      AND b.status = 'published'
      AND b.visibility = 'public'
      AND a.status = 'published'
      AND (a.title ILIKE ${keyword} OR a.excerpt ILIKE ${keyword} OR a.content ILIKE ${keyword})
    ORDER BY a.sort_order ASC, a.updated_at DESC
    LIMIT ${limit}
  `;

  const faqRows = await getRagSql()`
    SELECT
      f.id,
      f.question AS title,
      f.answer AS excerpt,
      NULL AS slug,
      'faq' AS type,
      c.name AS category_name,
      c.slug AS category_slug
    FROM faq_items f
    INNER JOIN knowledge_bases b ON b.id = f.knowledge_base_id
    LEFT JOIN knowledge_categories c ON c.id = f.category_id
    WHERE b.slug = ${input.knowledgeBaseSlug}
      AND b.status = 'published'
      AND b.visibility = 'public'
      AND f.status = 'published'
      AND (f.question ILIKE ${keyword} OR f.answer ILIKE ${keyword})
    ORDER BY f.sort_order ASC, f.updated_at DESC
    LIMIT ${limit}
  `;

  return [...faqRows, ...articleRows].slice(0, limit).map((row) => ({
    id: stringValue(row.id),
    title: stringValue(row.title),
    excerpt: nullableString(row.excerpt),
    type: row.type === "faq" ? "faq" : "article",
    categoryName: nullableString(row.category_name),
    href:
      row.type === "faq"
        ? faqHref(input.knowledgeBaseSlug, row)
        : `/kb/${input.knowledgeBaseSlug}/docs/${stringValue(row.slug)}`,
  }));
}

function faqHref(knowledgeBaseSlug: string, row: postgres.Row): string {
  const faqAnchor = `faq-${stringValue(row.id)}`;
  const categorySlug = nullableString(row.category_slug);

  if (categorySlug) {
    return `/kb/${knowledgeBaseSlug}/categories/${categorySlug}#${faqAnchor}`;
  }

  return `/kb/${knowledgeBaseSlug}#${faqAnchor}`;
}

export async function createRagConversation(
  knowledgeBaseId: string,
  title?: string,
): Promise<string> {
  const [row] = await getRagSql()`
    INSERT INTO rag_conversations (knowledge_base_id, title)
    VALUES (${knowledgeBaseId}, ${title ?? null})
    RETURNING id
  `;

  return stringValue(assertRow(row, "创建问答会话失败").id);
}

export async function addRagMessage(input: {
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  sources?: RagMessageSource[];
}): Promise<void> {
  await getRagSql()`
    INSERT INTO rag_messages (conversation_id, role, content, sources)
    VALUES (
      ${input.conversationId},
      ${input.role},
      ${input.content},
      ${JSON.stringify(input.sources ?? [])}::jsonb
    )
  `;
}

async function getCategoryById(id: string): Promise<KnowledgeCategory | null> {
  const [row] = await getRagSql()`
    SELECT *
    FROM knowledge_categories
    WHERE id = ${id}
  `;

  return row ? serializeCategory(row) : null;
}

function assertRow<T>(row: T | undefined, message: string): T {
  if (!row) {
    throw new RagDbError("RAG_DB_WRITE_FAILED", message, 500);
  }

  return row;
}

function serializeBase(row: postgres.Row): KnowledgeBase {
  return {
    id: stringValue(row.id),
    slug: stringValue(row.slug),
    name: stringValue(row.name),
    description: nullableString(row.description),
    visibility: row.visibility === "private" ? "private" : "public",
    status: knowledgeStatus(row.status),
    createdAt: dateString(row.created_at),
    updatedAt: dateString(row.updated_at),
  };
}

function serializeCategory(row: postgres.Row): KnowledgeCategory {
  return {
    id: stringValue(row.id),
    knowledgeBaseId: stringValue(row.knowledge_base_id),
    name: stringValue(row.name),
    slug: stringValue(row.slug),
    description: nullableString(row.description),
    sortOrder: numberValue(row.sort_order),
    createdAt: dateString(row.created_at),
    updatedAt: dateString(row.updated_at),
  };
}

function serializeArticle(row: postgres.Row): KnowledgeArticle {
  return {
    id: stringValue(row.id),
    knowledgeBaseId: stringValue(row.knowledge_base_id),
    categoryId: nullableString(row.category_id),
    title: stringValue(row.title),
    slug: stringValue(row.slug),
    excerpt: nullableString(row.excerpt),
    content: stringValue(row.content),
    status: knowledgeStatus(row.status),
    indexStatus: indexStatus(row.index_status),
    indexError: nullableString(row.index_error),
    tags: stringArray(row.tags),
    sortOrder: numberValue(row.sort_order),
    publishedAt: nullableDateString(row.published_at),
    createdAt: dateString(row.created_at),
    updatedAt: dateString(row.updated_at),
  };
}

function serializeFaq(row: postgres.Row): FaqItem {
  return {
    id: stringValue(row.id),
    knowledgeBaseId: stringValue(row.knowledge_base_id),
    categoryId: nullableString(row.category_id),
    question: stringValue(row.question),
    answer: stringValue(row.answer),
    aliases: stringArray(row.aliases),
    status: knowledgeStatus(row.status),
    indexStatus: indexStatus(row.index_status),
    indexError: nullableString(row.index_error),
    tags: stringArray(row.tags),
    sortOrder: numberValue(row.sort_order),
    publishedAt: nullableDateString(row.published_at),
    createdAt: dateString(row.created_at),
    updatedAt: dateString(row.updated_at),
  };
}

function serializeChunk(row: postgres.Row): KnowledgeChunk {
  return {
    id: stringValue(row.id),
    knowledgeBaseId: stringValue(row.knowledge_base_id),
    sourceType: row.source_type === "faq" ? "faq" : "article",
    sourceId: stringValue(row.source_id),
    title: stringValue(row.title),
    content: stringValue(row.content),
    score: Number(row.score ?? 0),
    metadata: recordValue(row.metadata),
    createdAt: dateString(row.created_at),
  };
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : String(value ?? "");
}

function nullableString(value: unknown): string | undefined {
  return value === null || value === undefined ? undefined : stringValue(value);
}

function numberValue(value: unknown): number {
  return typeof value === "number" ? value : Number(value ?? 0);
}

function dateString(value: unknown): string {
  return value instanceof Date ? value.toISOString() : stringValue(value);
}

function nullableDateString(value: unknown): string | undefined {
  return value === null || value === undefined ? undefined : dateString(value);
}

function stringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  return [];
}

function recordValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function knowledgeStatus(value: unknown): KnowledgeStatus {
  return value === "draft" || value === "archived" ? value : "published";
}

function indexStatus(value: unknown): IndexStatus {
  if (value === "indexing" || value === "indexed" || value === "failed") {
    return value;
  }

  return "pending";
}

function formatVector(values: number[]) {
  if (values.length === 0) {
    throw new RagDbError("BAD_EMBEDDING", "向量不能为空", 400);
  }

  return `[${values.map((value) => Number(value).toFixed(8)).join(",")}]`;
}
