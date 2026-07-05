"use client";

import type { CarouselItem } from "@wuliuqi/types";
import { cn } from "@wuliuqi/ui/lib/utils";
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
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/25 px-2 py-1.5 backdrop-blur">
          {items.map((item, index) => (
            <button
              key={`${item.url}-${item.sortOrder}`}
              aria-label={`切换到第 ${index + 1} 张轮播图`}
              className={cn(
                "h-1.5 w-1.5 cursor-pointer rounded-full bg-white/65 transition-all hover:bg-white",
                index === active && "w-5 bg-white",
              )}
              type="button"
              onClick={() => setActive(index)}
              onPointerDown={(event) => event.stopPropagation()}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
