import { getAdminAccountStatistics } from "@wuliuqi/domain";
import { handleError, ok } from "@/lib/api-response";
import { requireAdminSession } from "@/lib/session";

export async function GET() {
  try {
    await requireAdminSession();
    const statistics = await getAdminAccountStatistics();

    return ok(statistics);
  } catch (error) {
    return handleError(error, "获取账号统计失败");
  }
}
