import { z } from "zod";
import { optionalString } from "./common.js";

export const carouselItemSchema = z.object({
  sortOrder: z.coerce.number().int().min(0),
  url: z.string().trim().min(1, "图片地址为必填项"),
  linkUrl: optionalString,
});

export const carouselUpdateSchema = z.object({
  items: z.array(carouselItemSchema).min(1, "请至少保留一张轮播图").max(6),
});

export type CarouselUpdateInput = z.infer<typeof carouselUpdateSchema>;
