import { createFaqItem, listFaqItems } from "@wuliuqi/rag-db";
import { faqItemCreateSchema } from "@wuliuqi/validators";
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
    const faqs = await listFaqItems(id);

    return ok(faqs);
  } catch (error) {
    return handleError(error, "获取 FAQ 失败");
  }
}

export async function POST(
  request: NextRequest,
  segmentData: { params: Params },
) {
  try {
    await requireAdminSession();
    const { id } = await segmentData.params;
    const input = faqItemCreateSchema.parse(await request.json());
    const faq = await createFaqItem({ ...input, knowledgeBaseId: id });

    if (faq.status === "published") {
      await indexKnowledgeSourceAfterSave("faq", faq.id);
    }

    return ok(faq, { status: 201 });
  } catch (error) {
    return handleError(error, "创建 FAQ 失败");
  }
}
