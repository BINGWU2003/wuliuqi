import { getNextSequenceCounterValue } from "@wuliuqi/domain";
import { type NextRequest } from "next/server";
import { fail, handleError, ok } from "../../../../../lib/api-response";
import { requireAdminSession } from "../../../../../lib/session";

type Params = Promise<{ name: string }>;

export async function POST(
  _request: NextRequest,
  segmentData: { params: Params },
) {
  try {
    await requireAdminSession();
    const { name } = await segmentData.params;

    if (!name.trim()) {
      return fail("BAD_REQUEST", "计数器名称不能为空", 400);
    }

    const result = await getNextSequenceCounterValue(name);

    return ok(result);
  } catch (error) {
    return handleError(error, "获取下一个序号值失败");
  }
}
