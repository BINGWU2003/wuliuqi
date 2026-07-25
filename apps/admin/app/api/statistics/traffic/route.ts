import { type NextRequest } from "next/server";
import { handleError, ok } from "@/lib/api-response";
import {
  getAdminTrafficStatistics,
  parseTrafficGameFilter,
  parseTrafficRange,
} from "@/lib/posthog-analytics";
import { requireAdminSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    await requireAdminSession();
    const range = parseTrafficRange(request.nextUrl.searchParams.get("range"));
    const gameKey = parseTrafficGameFilter(
      request.nextUrl.searchParams.get("game_key"),
    );
    const statistics = await getAdminTrafficStatistics(range, gameKey);

    return ok(statistics);
  } catch (error) {
    return handleError(error, "获取流量统计失败");
  }
}
