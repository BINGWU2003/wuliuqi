import { updateAdminEmailBindStatus } from "@wuliuqi/domain";
import { emailBindStatusSchema } from "@wuliuqi/validators";
import { type NextRequest } from "next/server";
import { fail, handleError, ok, parseId } from "@/lib/api-response";
import { requireAdminSession } from "@/lib/session";

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
      return fail("BAD_REQUEST", "无效的邮箱ID", 400);
    }

    const { bindStatus } = emailBindStatusSchema.parse(await request.json());
    const email = await updateAdminEmailBindStatus(
      id,
      bindStatus,
      request.nextUrl.searchParams.get("game_key") ?? undefined,
    );

    return ok(email);
  } catch (error) {
    return handleError(error, "更新邮箱绑定状态失败");
  }
}
