import {
  createKnowledgeArticle,
  listKnowledgeArticles,
} from "@wuliuqi/rag-db";
import { KNOWLEDGE_SOURCE_TYPE, KNOWLEDGE_STATUS } from "@wuliuqi/types";
import { knowledgeArticleCreateSchema } from "@wuliuqi/validators";
import { type NextRequest } from "next/server";
import { handleError, ok } from "@/lib/api-response";
import { indexKnowledgeSourceAfterSave } from "@/lib/knowledge-indexing";
import { requireAdminSession } from "@/lib/session";

export const runtime = "nodejs";

type Params = Promise<{ id: string }>;

export async function GET(
  _request: NextRequest,
  segmentData: { params: Params },
) {
  try {
    await requireAdminSession();
    const { id } = await segmentData.params;
    const articles = await listKnowledgeArticles(id);

    return ok(articles);
  } catch (error) {
    return handleError(error, "获取知识文章失败");
  }
}

export async function POST(
  request: NextRequest,
  segmentData: { params: Params },
) {
  try {
    await requireAdminSession();
    const { id } = await segmentData.params;
    const input = knowledgeArticleCreateSchema.parse(await request.json());
    const article = await createKnowledgeArticle({
      ...input,
      knowledgeBaseId: id,
    });

    if (article.status === KNOWLEDGE_STATUS.published) {
      await indexKnowledgeSourceAfterSave(
        KNOWLEDGE_SOURCE_TYPE.article,
        article.id,
      );
    }

    return ok(article, { status: 201 });
  } catch (error) {
    return handleError(error, "创建知识文章失败");
  }
}
