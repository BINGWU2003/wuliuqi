"use client";

import type { CarouselItem } from "@wuliuqi/types";
import { Button } from "@wuliuqi/ui/components/button";
import { Skeleton } from "@wuliuqi/ui/components/skeleton";
import { toast } from "@wuliuqi/ui/components/sonner";
import { Spinner } from "@wuliuqi/ui/components/spinner";
import { cn } from "@wuliuqi/ui/lib/utils";
import { RefreshCw } from "lucide-react";
import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
} from "react";
import { fetchCarousel } from "@/lib/client-api";

const CAROUSEL_NAME = "home_ads";
const SWIPE_THRESHOLD = 48;
const AUTO_PLAY_INTERVAL_MS = 3000;
const AUTO_PLAY_PAUSE_AFTER_INTERACTION_MS = 5000;

export function HomeCarousel() {
  const [items, setItems] = useState<CarouselItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [active, setActive] = useState(0);
  const dragStartXRef = useRef<number | null>(null);
  const dragPointerIdRef = useRef<number | null>(null);
  const autoPlayPausedUntilRef = useRef(0);
  const requestIdRef = useRef(0);
  const requestControllerRef = useRef<AbortController | null>(null);

  const loadCarousel = useCallback(async (retry = false) => {
    const requestId = ++requestIdRef.current;
    const controller = new AbortController();

    requestControllerRef.current?.abort();
    requestControllerRef.current = controller;
    setLoading(true);

    if (!retry) {
      setError("");
    }

    try {
      const carousel = await fetchCarousel(CAROUSEL_NAME, {
        signal: controller.signal,
      });

      if (requestId !== requestIdRef.current) {
        return;
      }

      setItems(carousel.items);
      setError("");
    } catch (loadError) {
      if (
        controller.signal.aborted ||
        requestId !== requestIdRef.current ||
        isAbortError(loadError)
      ) {
        return;
      }

      const message =
        loadError instanceof Error ? loadError.message : "轮播图加载失败";
      setItems([]);
      setError(message);
      toast.error(message);
    } finally {
      if (requestId === requestIdRef.current) {
        requestControllerRef.current = null;
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadCarousel();

    return () => {
      requestIdRef.current += 1;
      requestControllerRef.current?.abort();
    };
  }, [loadCarousel]);

  useEffect(() => {
    if (items.length < 2) {
      return;
    }

    let timer: number | undefined;
    let disposed = false;

    const scheduleNext = (delay: number) => {
      timer = window.setTimeout(tick, delay);
    };

    const tick = () => {
      if (disposed) {
        return;
      }

      const pauseRemaining = autoPlayPausedUntilRef.current - Date.now();

      if (pauseRemaining > 0) {
        scheduleNext(pauseRemaining);
        return;
      }

      setActive((current) => (current + 1) % items.length);
      scheduleNext(AUTO_PLAY_INTERVAL_MS);
    };

    scheduleNext(AUTO_PLAY_INTERVAL_MS);

    return () => {
      disposed = true;

      if (timer !== undefined) {
        window.clearTimeout(timer);
      }
    };
  }, [items.length]);

  useEffect(() => {
    setActive((current) => (items[current] ? current : 0));
  }, [items]);

  const pauseAutoPlay = useCallback(() => {
    autoPlayPausedUntilRef.current =
      Date.now() + AUTO_PLAY_PAUSE_AFTER_INTERACTION_MS;
  }, []);

  const showPrevious = useCallback(() => {
    pauseAutoPlay();
    setActive((current) => (current - 1 + items.length) % items.length);
  }, [items.length, pauseAutoPlay]);

  const showNext = useCallback(() => {
    pauseAutoPlay();
    setActive((current) => (current + 1) % items.length);
  }, [items.length, pauseAutoPlay]);

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (items.length < 2) {
      return;
    }

    pauseAutoPlay();
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

  if (loading && !error) {
    return (
      <section
        aria-label="首页轮播图占位"
        className="relative mx-auto aspect-[16/6] min-h-[150px] w-full max-w-6xl overflow-hidden rounded-md border border-border bg-card shadow-xs"
      >
        <Skeleton className="size-full rounded-none" />
      </section>
    );
  }

  if (error) {
    return (
      <section
        aria-label="首页轮播图加载失败"
        className="relative mx-auto flex aspect-[16/6] min-h-[150px] w-full max-w-6xl items-center justify-center overflow-hidden rounded-md border border-border bg-card p-4 text-center shadow-xs"
      >
        <div className="flex flex-col items-center gap-3">
          <div className="space-y-1">
            <div className="text-sm font-medium">轮播图加载失败</div>
            <div className="text-sm text-muted-foreground">{error}</div>
          </div>
          <Button
            className="h-9 rounded-md"
            disabled={loading}
            title="重新加载轮播图"
            type="button"
            variant="outline"
            onClick={() => void loadCarousel(true)}
          >
            {loading ? <Spinner /> : <RefreshCw size={16} />}
            {loading ? "重试中..." : "重新加载"}
          </Button>
        </div>
      </section>
    );
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
              title={`切换到第 ${index + 1} 张轮播图`}
              type="button"
              onClick={() => {
                pauseAutoPlay();
                setActive(index);
              }}
              onPointerDown={(event) => {
                pauseAutoPlay();
                event.stopPropagation();
              }}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}
