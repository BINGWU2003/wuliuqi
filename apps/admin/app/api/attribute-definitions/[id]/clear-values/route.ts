import { clearAdminGameAttributeDefinitionValues } from "@wuliuqi/domain";
import { type NextRequest } from "next/server";
import { fail, handleError, ok, parseId } from "@/lib/api-response";
import { requireAdminSession } from "@/lib/session";

type Params = Promise<{ id: string }>;

export async function POST(
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

    const result = await clearAdminGameAttributeDefinitionValues(id);

    return ok(result);
  } catch (error) {
    return handleError(error, "清空属性值失败");
  }
}
