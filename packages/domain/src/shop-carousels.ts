import type { Carousel } from "@wuliuqi/types";
import { prisma } from "@wuliuqi/db";
import { serializeCarousel } from "./serializers";

export async function getCarouselByName(
  name: string,
): Promise<Carousel | null> {
  const carousel = await prisma.carousel.findUnique({
    where: { name },
  });

  return carousel ? serializeCarousel(carousel) : null;
}
