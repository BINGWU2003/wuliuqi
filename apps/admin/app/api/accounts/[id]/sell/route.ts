import { sellAdminAccount } from "@wuliuqi/domain";
import { adminAccountSellSchema } from "@wuliuqi/validators";
import { type NextRequest } from "next/server";
import { fail, handleError, ok, parseId } from "@/lib/api-response";
import { requireAdminSession } from "@/lib/session";

type Params = Promise<{ id: string }>;

export async function POST(
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

    const input = adminAccountSellSchema.parse(await request.json());
    const account = await sellAdminAccount(
      id,
      input,
      request.nextUrl.searchParams.get("game_key") ?? undefined,
    );

    return ok(account);
  } catch (error) {
    return handleError(error, "出售账号失败");
  }
}
