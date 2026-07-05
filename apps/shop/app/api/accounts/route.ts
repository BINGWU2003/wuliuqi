import { listShopAccounts } from "@wuliuqi/domain";
import { accountListQuerySchema } from "@wuliuqi/validators";
import { type NextRequest } from "next/server";
import { ZodError } from "zod";
import { fail, ok } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const rawQuery = Object.fromEntries(request.nextUrl.searchParams);
    const query = accountListQuerySchema.parse({
      ...rawQuery,
      status: rawQuery.status ?? "1",
    });
    const result = await listShopAccounts(query);

    return ok(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return fail("BAD_REQUEST", error.issues[0]?.message ?? "请求参数无效", 400);
    }

    console.error("获取账号列表失败:", error);
    return fail("INTERNAL_ERROR", "获取账号列表失败", 500);
  }
}
