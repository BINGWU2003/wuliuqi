import {
  createAdminAccount,
  listAdminAccounts,
} from "@wuliuqi/domain";
import {
  adminAccountCreateSchema,
  adminAccountListQuerySchema,
} from "@wuliuqi/validators";
import { type NextRequest } from "next/server";
import { handleError, ok } from "../../../lib/api-response";
import { requireAdminSession } from "../../../lib/session";

export async function GET(request: NextRequest) {
  try {
    await requireAdminSession();
    const query = adminAccountListQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    );
    const result = await listAdminAccounts(query);

    return ok(result);
  } catch (error) {
    return handleError(error, "获取账号列表失败");
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminSession();
    const input = adminAccountCreateSchema.parse(await request.json());
    const account = await createAdminAccount(input);

    return ok(account, { status: 201 });
  } catch (error) {
    return handleError(error, "创建账号失败");
  }
}
