import { handleError, ok } from "../../../../lib/api-response";
import { requireAdminSession } from "../../../../lib/session";

export async function GET() {
  try {
    const user = await requireAdminSession();

    return ok(user);
  } catch (error) {
    return handleError(error, "获取当前用户失败");
  }
}
