import { getCarouselByName } from "@wuliuqi/domain";
import { type NextRequest } from "next/server";
import { fail, ok } from "@/lib/api-response";

type Params = Promise<{ name: string }>;

export async function GET(_request: NextRequest, segmentData: { params: Params }) {
  try {
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
    console.error("获取轮播图失败:", error);
    return fail("INTERNAL_ERROR", "获取轮播图失败", 500);
  }
}
