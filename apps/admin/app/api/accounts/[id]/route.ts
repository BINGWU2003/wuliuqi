import {
  deleteAdminAccount,
  getAdminAccountById,
  updateAdminAccount,
} from "@wuliuqi/domain";
import { adminAccountUpdateSchema } from "@wuliuqi/validators";
import { type NextRequest } from "next/server";
import { fail, handleError, ok, parseId } from "@/lib/api-response";
import { requireAdminSession } from "@/lib/session";

type Params = Promise<{ id: string }>;

export async function GET(
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

    const account = await getAdminAccountById(
      id,
      request.nextUrl.searchParams.get("game_key") ?? undefined,
    );

    if (!account) {
      return fail("NOT_FOUND", "账号未找到", 404);
    }

    return ok(account);
  } catch (error) {
    return handleError(error, "获取账号详情失败");
  }
}

export async function PATCH(
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

    const input = adminAccountUpdateSchema.parse(await request.json());
    const account = await updateAdminAccount(
      id,
      input,
      request.nextUrl.searchParams.get("game_key") ?? undefined,
    );

    return ok(account);
  } catch (error) {
    return handleError(error, "更新账号失败");
  }
}

export async function DELETE(
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

    await deleteAdminAccount(
      id,
      request.nextUrl.searchParams.get("game_key") ?? undefined,
    );

    return ok({ deleted: true });
  } catch (error) {
    return handleError(error, "删除账号失败");
  }
}
