import { createAdminEmail, listAdminEmails } from "@wuliuqi/domain";
import {
  adminEmailCreateSchema,
  adminEmailListQuerySchema,
} from "@wuliuqi/validators";
import { type NextRequest } from "next/server";
import { handleError, ok } from "../../../lib/api-response";
import { requireAdminSession } from "../../../lib/session";

export async function GET(request: NextRequest) {
  try {
    await requireAdminSession();
    const query = adminEmailListQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams),
    );
    const result = await listAdminEmails(query);

    return ok(result);
  } catch (error) {
    return handleError(error, "获取邮箱列表失败");
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminSession();
    const input = adminEmailCreateSchema.parse(await request.json());
    const email = await createAdminEmail(input);

    return ok(email, { status: 201 });
  } catch (error) {
    return handleError(error, "创建邮箱失败");
  }
}
