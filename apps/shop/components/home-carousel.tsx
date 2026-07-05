"use client";

import type { CarouselItem } from "@wuliuqi/types";
import { Badge } from "@wuliuqi/ui/components/badge";
import { cn } from "@wuliuqi/ui/lib/utils";
import Image from "next/image";
import { useEffect, useState } from "react";
import { fetchCarousel } from "../lib/client-api";
import { ImageLightbox } from "./image-lightbox";

const CAROUSEL_NAME = "home_ads";

export function HomeCarousel() {
  const [items, setItems] = useState<CarouselItem[]>([]);
  const [active, setActive] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    fetchCarousel(CAROUSEL_NAME)
      .then((carousel) => setItems(carousel.items))
      .catch(() => setItems([]));
  }, []);

  useEffect(() => {
    if (items.length < 2) {
      return;
    }

    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % items.length);
    }, 3000);

    return () => window.clearInterval(timer);
  }, [items.length]);

  if (items.length === 0) {
    return null;
  }

  const current = items[active] ?? items[0];

  if (!current) {
    return null;
  }

  return (
    <>
      <button
        className="relative mx-auto aspect-[16/6] min-h-[150px] w-full max-w-6xl overflow-hidden rounded-md border border-border bg-card shadow-xs"
        type="button"
        onClick={() => setPreviewOpen(true)}
      >
        <Image
          fill
          priority
          className="object-cover"
          sizes="(min-width: 920px) 920px, 100vw"
          src={current.url}
          alt="首页轮播图"
          unoptimized
        />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/55 to-transparent p-3">
          <div className="text-left">
            <Badge className="rounded-sm bg-white text-black hover:bg-white">
              Featured
            </Badge>
            <div className="mt-2 text-sm font-semibold text-white sm:text-base">
              CODM 账号精选上新
            </div>
          </div>
          <div className="flex gap-1.5">
          {items.map((item, index) => (
            <span
              key={`${item.url}-${item.sortOrder}`}
              className={cn(
                "h-1.5 w-1.5 rounded-full bg-white/65 transition-all",
                index === active && "w-5 bg-white",
              )}
            />
          ))}
          </div>
        </div>
      </button>
      <ImageLightbox
        images={items.map((item) => item.url)}
        open={previewOpen}
        startIndex={active}
        onClose={() => setPreviewOpen(false)}
      />
    </>
  );
}
