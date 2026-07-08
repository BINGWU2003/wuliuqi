import {
  createAdminEmailPostfix,
  listAdminEmailPostfixes,
} from "@wuliuqi/domain";
import { emailPostfixCreateSchema } from "@wuliuqi/validators";
import { type NextRequest } from "next/server";
import { handleError, ok } from "@/lib/api-response";
import { requireAdminSession } from "@/lib/session";

export async function GET() {
  try {
    await requireAdminSession();
    const postfixes = await listAdminEmailPostfixes();

    return ok(postfixes);
  } catch (error) {
    return handleError(error, "获取邮箱后缀失败");
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminSession();
    const input = emailPostfixCreateSchema.parse(await request.json());
    const postfix = await createAdminEmailPostfix(input);

    return ok(postfix, { status: 201 });
  } catch (error) {
    return handleError(error, "创建邮箱后缀失败");
  }
}
