import {
  deleteKnowledgeArticle,
  getKnowledgeArticleById,
  updateKnowledgeArticle,
} from "@wuliuqi/rag-db";
import { knowledgeArticleUpdateSchema } from "@wuliuqi/validators";
import { type NextRequest } from "next/server";
import { fail, handleError, ok } from "@/lib/api-response";
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
    const article = await getKnowledgeArticleById(id);

    if (!article) {
      return fail("NOT_FOUND", "文章不存在", 404);
    }

    return ok(article);
  } catch (error) {
    return handleError(error, "获取文章失败");
  }
}

export async function PATCH(
  request: NextRequest,
  segmentData: { params: Params },
) {
  try {
    await requireAdminSession();
    const { id } = await segmentData.params;
    const input = knowledgeArticleUpdateSchema.parse(await request.json());
    const article = await updateKnowledgeArticle(id, input);

    if (article.status === "published") {
      await indexKnowledgeSourceAfterSave("article", article.id);
    }

    return ok(article);
  } catch (error) {
    return handleError(error, "更新文章失败");
  }
}

export async function DELETE(
  _request: NextRequest,
  segmentData: { params: Params },
) {
  try {
    await requireAdminSession();
    const { id } = await segmentData.params;

    await deleteKnowledgeArticle(id);

    return ok({ deleted: true });
  } catch (error) {
    return handleError(error, "删除文章失败");
  }
}
