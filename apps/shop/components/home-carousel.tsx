"use client";

import type { CarouselItem } from "@wuliuqi/types";
import { Button } from "@wuliuqi/ui/components/button";
import { Skeleton } from "@wuliuqi/ui/components/skeleton";
import { toast } from "@wuliuqi/ui/components/sonner";
import { Spinner } from "@wuliuqi/ui/components/spinner";
import { cn } from "@wuliuqi/ui/lib/utils";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FocusEvent,
  type PointerEvent,
} from "react";
import { fetchCarousel } from "@/lib/client-api";

const CAROUSEL_NAME = "home_ads";
const SWIPE_THRESHOLD = 48;
const AUTO_PLAY_INTERVAL_MS = 5000;
const AUTO_PLAY_PAUSE_AFTER_INTERACTION_MS = 5000;

export function HomeCarousel() {
  const [items, setItems] = useState<CarouselItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [active, setActive] = useState(0);
  const [focusPaused, setFocusPaused] = useState(false);
  const [hoverPaused, setHoverPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
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
    if (
      items.length < 2 ||
      focusPaused ||
      hoverPaused ||
      prefersReducedMotion
    ) {
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
  }, [focusPaused, hoverPaused, items.length, prefersReducedMotion]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);

    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

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

  function handleBlur(event: FocusEvent<HTMLElement>) {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setFocusPaused(false);
    }
  }

  if (loading && !error) {
    return (
      <section
        aria-label="首页轮播图占位"
        className="relative mx-auto aspect-[3/1] w-full max-w-6xl overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm sm:aspect-[11/5] sm:min-h-[150px]"
      >
        <Skeleton className="size-full rounded-none" />
      </section>
    );
  }

  if (error) {
    return (
      <section
        aria-label="首页轮播图加载失败"
        className="relative mx-auto flex aspect-[3/1] w-full max-w-6xl items-center justify-center overflow-hidden rounded-xl border border-border/80 bg-card p-4 text-center shadow-sm sm:aspect-[11/5] sm:min-h-[150px]"
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
      className="relative mx-auto aspect-[3/1] w-full max-w-6xl overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm sm:aspect-[11/5] sm:min-h-[150px]"
      style={{ touchAction: "pan-y" }}
      onBlurCapture={handleBlur}
      onFocusCapture={() => setFocusPaused(true)}
      onMouseEnter={() => setHoverPaused(true)}
      onMouseLeave={() => setHoverPaused(false)}
      onPointerCancel={handlePointerCancel}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      <Image
        fill
        priority
        className="select-none object-cover"
        draggable={false}
        sizes="(min-width: 1152px) 1152px, 100vw"
        src={current.url}
        alt="首页轮播图"
        unoptimized
      />
      {items.length > 1 ? (
        <>
          <button
            aria-label="上一张轮播图"
            className="absolute left-0 top-1/2 hidden h-16 w-9 -translate-y-1/2 place-items-center rounded-r-md bg-black/35 text-white/90 backdrop-blur-sm transition-colors hover:bg-black/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white sm:grid"
            title="上一张"
            type="button"
            onClick={showPrevious}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <ChevronLeft aria-hidden="true" size={26} strokeWidth={2} />
          </button>
          <button
            aria-label="下一张轮播图"
            className="absolute right-0 top-1/2 hidden h-16 w-9 -translate-y-1/2 place-items-center rounded-l-md bg-black/35 text-white/90 backdrop-blur-sm transition-colors hover:bg-black/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white sm:grid"
            title="下一张"
            type="button"
            onClick={showNext}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <ChevronRight aria-hidden="true" size={26} strokeWidth={2} />
          </button>
          <div className="absolute bottom-1 right-2 flex items-center rounded-full bg-black/25 px-1 py-0.5 backdrop-blur-sm sm:hidden">
            {items.map((item, index) => (
              <button
                key={`${item.url}-${item.sortOrder}`}
                aria-label={`切换到第 ${index + 1} 张轮播图`}
                className="group grid size-5 cursor-pointer place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-white"
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
              >
                <span
                  className={cn(
                    "size-1.5 rounded-full bg-white/60 transition-colors group-hover:bg-white",
                    index === active && "bg-white",
                  )}
                />
              </button>
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}
