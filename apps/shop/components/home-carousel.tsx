"use client";

import type { CarouselItem } from "@wuliuqi/types";
import { Badge } from "@wuliuqi/ui/components/badge";
import { Button } from "@wuliuqi/ui/components/button";
import { cn } from "@wuliuqi/ui/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
} from "react";
import { fetchCarousel } from "../lib/client-api";

const CAROUSEL_NAME = "home_ads";
const SWIPE_THRESHOLD = 48;

export function HomeCarousel() {
  const [items, setItems] = useState<CarouselItem[]>([]);
  const [active, setActive] = useState(0);
  const dragStartXRef = useRef<number | null>(null);
  const dragPointerIdRef = useRef<number | null>(null);

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

  useEffect(() => {
    setActive((current) => (items[current] ? current : 0));
  }, [items]);

  const showPrevious = useCallback(() => {
    setActive((current) => (current - 1 + items.length) % items.length);
  }, [items.length]);

  const showNext = useCallback(() => {
    setActive((current) => (current + 1) % items.length);
  }, [items.length]);

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (items.length < 2) {
      return;
    }

    dragStartXRef.current = event.clientX;
    dragPointerIdRef.current = event.pointerId;
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    if (items.length < 2 || dragStartXRef.current === null) {
      return;
    }

    const deltaX = event.clientX - dragStartXRef.current;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragStartXRef.current = null;
    dragPointerIdRef.current = null;

    if (Math.abs(deltaX) < SWIPE_THRESHOLD) {
      return;
    }

    if (deltaX > 0) {
      showPrevious();
    } else {
      showNext();
    }
  }

  function handlePointerCancel(event: PointerEvent<HTMLDivElement>) {
    if (
      dragPointerIdRef.current !== null &&
      event.currentTarget.hasPointerCapture(dragPointerIdRef.current)
    ) {
      event.currentTarget.releasePointerCapture(dragPointerIdRef.current);
    }

    dragStartXRef.current = null;
    dragPointerIdRef.current = null;
  }

  if (items.length === 0) {
    return null;
  }

  const current = items[active] ?? items[0];

  if (!current) {
    return null;
  }

  return (
    <section
      aria-label="首页轮播图"
      className="relative mx-auto aspect-[16/6] min-h-[150px] w-full max-w-6xl overflow-hidden rounded-md border border-border bg-card shadow-xs"
      style={{ touchAction: "pan-y" }}
      onPointerCancel={handlePointerCancel}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      <Image
        fill
        priority
        className="select-none object-cover"
        draggable={false}
        sizes="(min-width: 920px) 920px, 100vw"
        src={current.url}
        alt="首页轮播图"
        unoptimized
      />
      {items.length > 1 ? (
        <>
          <Button
            aria-label="上一张轮播图"
            className="absolute left-2 top-1/2 size-9 -translate-y-1/2 rounded-full border-white/40 bg-background/85 text-foreground shadow-sm backdrop-blur hover:bg-background sm:left-3 sm:size-10"
            size="icon"
            type="button"
            variant="outline"
            onClick={showPrevious}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <ChevronLeft size={19} />
          </Button>
          <Button
            aria-label="下一张轮播图"
            className="absolute right-2 top-1/2 size-9 -translate-y-1/2 rounded-full border-white/40 bg-background/85 text-foreground shadow-sm backdrop-blur hover:bg-background sm:right-3 sm:size-10"
            size="icon"
            type="button"
            variant="outline"
            onClick={showNext}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <ChevronRight size={19} />
          </Button>
        </>
      ) : null}
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
            <button
              key={`${item.url}-${item.sortOrder}`}
              aria-label={`切换到第 ${index + 1} 张轮播图`}
              className={cn(
                "h-1.5 w-1.5 rounded-full bg-white/65 transition-all",
                index === active && "w-5 bg-white",
              )}
              type="button"
              onClick={() => setActive(index)}
              onPointerDown={(event) => event.stopPropagation()}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
