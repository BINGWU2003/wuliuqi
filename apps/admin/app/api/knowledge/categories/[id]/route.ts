import {
  deleteKnowledgeCategory,
  getKnowledgeCategoryBindingCounts,
} from "@wuliuqi/rag-db";
import { type NextRequest } from "next/server";
import { fail, handleError, ok } from "@/lib/api-response";
import { requireAdminSession } from "@/lib/session";

export const runtime = "nodejs";

type Params = Promise<{ id: string }>;

function bindingMessage(counts: { articles: number; faqs: number }) {
  return `该分类下还有 ${counts.articles} 篇文章、${counts.faqs} 个 FAQ，请先迁移到其他分类或改为未分类后再删除`;
}

export async function DELETE(
  _request: NextRequest,
  segmentData: { params: Params },
) {
  try {
    await requireAdminSession();
    const { id } = await segmentData.params;
    const counts = await getKnowledgeCategoryBindingCounts(id);

    if (counts.articles > 0 || counts.faqs > 0) {
      return fail("CATEGORY_IN_USE", bindingMessage(counts), 409);
    }

    await deleteKnowledgeCategory(id);

    return ok({ deleted: true });
  } catch (error) {
    return handleError(error, "删除知识分类失败");
  }
}
