import { listShopHomeAccounts } from "@wuliuqi/domain";
import { shopHomeAccountListQuerySchema } from "@wuliuqi/validators";
import { type NextRequest } from "next/server";
import { ZodError } from "zod";
import { fail, ok } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const query = shopHomeAccountListQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    );
    const result = await listShopHomeAccounts(query);

    return ok(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return fail("BAD_REQUEST", error.issues[0]?.message ?? "请求参数无效", 400);
    }

    console.error("获取首页账号流失败:", error);
    return fail("INTERNAL_ERROR", "获取首页账号流失败", 500);
  }
}
