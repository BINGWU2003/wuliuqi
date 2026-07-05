import {
  deleteAdminEmail,
  getAdminEmailById,
  updateAdminEmail,
} from "@wuliuqi/domain";
import { adminEmailUpdateSchema } from "@wuliuqi/validators";
import { type NextRequest } from "next/server";
import { fail, handleError, ok, parseId } from "../../../../lib/api-response";
import { requireAdminSession } from "../../../../lib/session";

type Params = Promise<{ id: string }>;

export async function GET(
  _request: NextRequest,
  segmentData: { params: Params },
) {
  try {
    await requireAdminSession();
    const { id: rawId } = await segmentData.params;
    const id = parseId(rawId);

    if (!id) {
      return fail("BAD_REQUEST", "无效的邮箱ID", 400);
    }

    const email = await getAdminEmailById(id);

    if (!email) {
      return fail("NOT_FOUND", "CODM邮箱未找到", 404);
    }

    return ok(email);
  } catch (error) {
    return handleError(error, "获取邮箱详情失败");
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
      return fail("BAD_REQUEST", "无效的邮箱ID", 400);
    }

    const input = adminEmailUpdateSchema.parse(await request.json());
    const email = await updateAdminEmail(id, input);

    return ok(email);
  } catch (error) {
    return handleError(error, "更新邮箱失败");
  }
}

export async function DELETE(
  _request: NextRequest,
  segmentData: { params: Params },
) {
  try {
    await requireAdminSession();
    const { id: rawId } = await segmentData.params;
    const id = parseId(rawId);

    if (!id) {
      return fail("BAD_REQUEST", "无效的邮箱ID", 400);
    }

    await deleteAdminEmail(id);

    return ok({ deleted: true });
  } catch (error) {
    return handleError(error, "删除邮箱失败");
  }
}
