import {
  getKnowledgeBaseById,
  updateKnowledgeBase,
} from "@wuliuqi/rag-db";
import { knowledgeBaseUpdateSchema } from "@wuliuqi/validators";
import { type NextRequest } from "next/server";
import { fail, handleError, ok } from "@/lib/api-response";
import { requireAdminSession } from "@/lib/session";

type Params = Promise<{ id: string }>;

export async function GET(
  _request: NextRequest,
  segmentData: { params: Params },
) {
  try {
    await requireAdminSession();
    const { id } = await segmentData.params;
    const base = await getKnowledgeBaseById(id);

    if (!base) {
      return fail("NOT_FOUND", "知识库不存在", 404);
    }

    return ok(base);
  } catch (error) {
    return handleError(error, "获取知识库失败");
  }
}

export async function PATCH(
  request: NextRequest,
  segmentData: { params: Params },
) {
  try {
    await requireAdminSession();
    const { id } = await segmentData.params;
    const input = knowledgeBaseUpdateSchema.parse(await request.json());
    const base = await updateKnowledgeBase(id, input);

    return ok(base);
  } catch (error) {
    return handleError(error, "更新知识库失败");
  }
}
