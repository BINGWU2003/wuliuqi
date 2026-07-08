import { getAdminAccountStatistics } from "@wuliuqi/domain";
import { type NextRequest } from "next/server";
import { handleError, ok } from "@/lib/api-response";
import { requireAdminSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    await requireAdminSession();
    const statistics = await getAdminAccountStatistics(
      request.nextUrl.searchParams.get("game_key") ?? undefined,
    );

    return ok(statistics);
  } catch (error) {
    return handleError(error, "获取账号统计失败");
  }
}
