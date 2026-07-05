import { getCarouselByName, updateCarouselByName } from "@wuliuqi/domain";
import { carouselUpdateSchema } from "@wuliuqi/validators";
import { type NextRequest } from "next/server";
import { fail, handleError, ok } from "../../../../lib/api-response";
import { requireAdminSession } from "../../../../lib/session";

type Params = Promise<{ name: string }>;

export async function GET(
  _request: NextRequest,
  segmentData: { params: Params },
) {
  try {
    await requireAdminSession();
    const { name } = await segmentData.params;

    if (!name.trim()) {
      return fail("BAD_REQUEST", "轮播图名称为必填项", 400);
    }

    const carousel = await getCarouselByName(name);

    if (!carousel) {
      return fail("NOT_FOUND", "轮播图配置未找到", 404);
    }

    return ok(carousel);
  } catch (error) {
    return handleError(error, "获取轮播图失败");
  }
}

export async function PATCH(
  request: NextRequest,
  segmentData: { params: Params },
) {
  try {
    await requireAdminSession();
    const { name } = await segmentData.params;

    if (!name.trim()) {
      return fail("BAD_REQUEST", "轮播图名称为必填项", 400);
    }

    const input = carouselUpdateSchema.parse(await request.json());
    const carousel = await updateCarouselByName(name, input);

    return ok(carousel);
  } catch (error) {
    return handleError(error, "更新轮播图失败");
  }
}
