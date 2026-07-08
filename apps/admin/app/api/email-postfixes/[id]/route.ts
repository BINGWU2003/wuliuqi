import {
  deleteAdminEmailPostfix,
  updateAdminEmailPostfix,
} from "@wuliuqi/domain";
import { emailPostfixUpdateSchema } from "@wuliuqi/validators";
import { type NextRequest } from "next/server";
import { fail, handleError, ok, parseId } from "@/lib/api-response";
import { requireAdminSession } from "@/lib/session";

type Params = Promise<{ id: string }>;

export async function PATCH(
  request: NextRequest,
  segmentData: { params: Params },
) {
  try {
    await requireAdminSession();
    const { id: rawId } = await segmentData.params;
    const id = parseId(rawId);

    if (!id) {
      return fail("BAD_REQUEST", "无效的邮箱后缀ID", 400);
    }

    const input = emailPostfixUpdateSchema.parse(await request.json());
    const postfix = await updateAdminEmailPostfix(id, input);

    return ok(postfix);
  } catch (error) {
    return handleError(error, "更新邮箱后缀失败");
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
      return fail("BAD_REQUEST", "无效的邮箱后缀ID", 400);
    }

    await deleteAdminEmailPostfix(id);

    return ok({ deleted: true });
  } catch (error) {
    return handleError(error, "删除邮箱后缀失败");
  }
}
