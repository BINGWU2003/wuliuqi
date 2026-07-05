import { updateAdminAccountStatus } from "@wuliuqi/domain";
import { accountStatusSchema } from "@wuliuqi/validators";
import { type NextRequest } from "next/server";
import { fail, handleError, ok, parseId } from "../../../../../lib/api-response";
import { requireAdminSession } from "../../../../../lib/session";

type Params = Promise<{ id: string }>;

export async function PATCH(
  request: NextRequest,
  segmentData: { params: Params },
) {
  try {
    await requireAdminSession();
    const { id: rawId } = await segmentData.params;
    const id = parseId(rawId);

    if (!id) {
      return fail("BAD_REQUEST", "无效的账号ID", 400);
    }

    const { status } = accountStatusSchema.parse(await request.json());
    const account = await updateAdminAccountStatus(id, status);

    return ok(account);
  } catch (error) {
    return handleError(error, "更新账号状态失败");
  }
}
