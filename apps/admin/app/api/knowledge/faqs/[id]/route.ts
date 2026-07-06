import {
  deleteFaqItem,
  getFaqItemById,
  updateFaqItem,
} from "@wuliuqi/rag-db";
import { faqItemUpdateSchema } from "@wuliuqi/validators";
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
    const faq = await getFaqItemById(id);

    if (!faq) {
      return fail("NOT_FOUND", "FAQ 不存在", 404);
    }

    return ok(faq);
  } catch (error) {
    return handleError(error, "获取 FAQ 失败");
  }
}

export async function PATCH(
  request: NextRequest,
  segmentData: { params: Params },
) {
  try {
    await requireAdminSession();
    const { id } = await segmentData.params;
    const input = faqItemUpdateSchema.parse(await request.json());
    const faq = await updateFaqItem(id, input);

    if (faq.status === "published") {
      await indexKnowledgeSourceAfterSave("faq", faq.id);
    }

    return ok(faq);
  } catch (error) {
    return handleError(error, "更新 FAQ 失败");
  }
}

export async function DELETE(
  _request: NextRequest,
  segmentData: { params: Params },
) {
  try {
    await requireAdminSession();
    const { id } = await segmentData.params;

    await deleteFaqItem(id);

    return ok({ deleted: true });
  } catch (error) {
    return handleError(error, "删除 FAQ 失败");
  }
}
