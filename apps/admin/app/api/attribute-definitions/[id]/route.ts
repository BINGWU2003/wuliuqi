import {
  deleteAdminGameAttributeDefinition,
  updateAdminGameAttributeDefinition,
} from "@wuliuqi/domain";
import { gameAttributeDefinitionUpdateSchema } from "@wuliuqi/validators";
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
      return fail("BAD_REQUEST", "无效的属性配置ID", 400);
    }

    const input = gameAttributeDefinitionUpdateSchema.parse(
      await request.json(),
    );
    const definition = await updateAdminGameAttributeDefinition(id, input);

    return ok(definition);
  } catch (error) {
    return handleError(error, "更新属性配置失败");
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
      return fail("BAD_REQUEST", "无效的属性配置ID", 400);
    }

    const definition = await deleteAdminGameAttributeDefinition(id);

    return ok(definition);
  } catch (error) {
    return handleError(error, "删除属性配置失败");
  }
}
