"use client";

import type { CarouselItem } from "@wuliuqi/types";
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
        className="relative mx-auto aspect-[16/7] min-h-[150px] w-full max-w-5xl overflow-hidden rounded-lg border border-border bg-card shadow-sm"
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
        <div className="absolute bottom-3 right-3 flex gap-1.5">
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
