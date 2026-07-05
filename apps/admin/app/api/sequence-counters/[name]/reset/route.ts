import { resetSequenceCounter } from "@wuliuqi/domain";
import { sequenceCounterResetSchema } from "@wuliuqi/validators";
import { type NextRequest } from "next/server";
import { fail, handleError, ok } from "@/lib/api-response";
import { requireAdminSession } from "@/lib/session";

type Params = Promise<{ name: string }>;

export async function POST(
  request: NextRequest,
  segmentData: { params: Params },
) {
  try {
    await requireAdminSession();
    const { name } = await segmentData.params;

    if (!name.trim()) {
      return fail("BAD_REQUEST", "计数器名称不能为空", 400);
    }

    const { value } = sequenceCounterResetSchema.parse(await request.json());
    const counter = await resetSequenceCounter(name, value);

    return ok(counter);
  } catch (error) {
    return handleError(error, "重置计数器失败");
  }
}
