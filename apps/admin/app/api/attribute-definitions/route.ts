import {
  createAdminGameAttributeDefinition,
  listAdminGameAttributeDefinitions,
} from "@wuliuqi/domain";
import { gameAttributeDefinitionCreateSchema } from "@wuliuqi/validators";
import { type NextRequest } from "next/server";
import { handleError, ok } from "@/lib/api-response";
import { requireAdminSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    await requireAdminSession();
    const gameKey = request.nextUrl.searchParams.get("game_key") ?? "codm";
    const definitions = await listAdminGameAttributeDefinitions(gameKey);

    return ok(definitions);
  } catch (error) {
    return handleError(error, "获取属性配置失败");
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminSession();
    const input = gameAttributeDefinitionCreateSchema.parse(
      await request.json(),
    );
    const definition = await createAdminGameAttributeDefinition(input);

    return ok(definition, { status: 201 });
  } catch (error) {
    return handleError(error, "创建属性配置失败");
  }
}
