import { getShopAccountById } from "@wuliuqi/domain";
import { type NextRequest } from "next/server";
import { fail, ok } from "@/lib/api-response";

type Params = Promise<{ id: string }>;

export async function GET(_request: NextRequest, segmentData: { params: Params }) {
  try {
    const { id: rawId } = await segmentData.params;
    const id = Number(rawId);

    if (!Number.isSafeInteger(id) || id < 1) {
      return fail("BAD_REQUEST", "无效的账号ID", 400);
    }

    const account = await getShopAccountById(id);

    if (!account) {
      return fail("NOT_FOUND", "CODM账号未找到", 404);
    }

    return ok(account);
  } catch (error) {
    console.error("获取账号详情失败:", error);
    return fail("INTERNAL_ERROR", "获取账号详情失败", 500);
  }
}
