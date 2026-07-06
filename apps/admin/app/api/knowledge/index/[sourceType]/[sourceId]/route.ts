import { indexKnowledgeSource } from "@wuliuqi/rag";
import { sourceIndexSchema } from "@wuliuqi/validators";
import { type NextRequest } from "next/server";
import { handleError, ok } from "@/lib/api-response";
import { requireAdminSession } from "@/lib/session";

export const runtime = "nodejs";

type Params = Promise<{ sourceType: string; sourceId: string }>;

export async function POST(
  _request: NextRequest,
  segmentData: { params: Params },
) {
  try {
    await requireAdminSession();
    const params = sourceIndexSchema.parse(await segmentData.params);
    const result = await indexKnowledgeSource(params.sourceType, params.sourceId);

    return ok(result);
  } catch (error) {
    return handleError(error, "重建索引失败");
  }
}
