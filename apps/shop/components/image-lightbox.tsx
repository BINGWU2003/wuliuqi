"use client";

import { Button } from "@wuliuqi/ui/components/button";
import { ChevronLeft, ChevronRight, Download, X } from "lucide-react";
import Image from "next/image";
import type { MouseEvent, TouchEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { downloadImageWithWatermark } from "../lib/watermark";

export function ImageLightbox({
  images,
  onClose,
  open,
  startIndex,
}: {
  images: string[];
  onClose: () => void;
  open: boolean;
  startIndex: number;
}) {
  const [index, setIndex] = useState(startIndex);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const touchEndRef = useRef<{ x: number; y: number } | null>(null);
  const ignoreNextClickRef = useRef(false);

  const goPrevious = useCallback(() => {
    setIndex((current) => Math.max(0, current - 1));
  }, []);

  const goNext = useCallback(() => {
    setIndex((current) => Math.min(images.length - 1, current + 1));
  }, [images.length]);

  useEffect(() => {
    if (open) {
      setIndex(startIndex);
    }
  }, [open, startIndex]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
      if (event.key === "ArrowLeft") {
        goPrevious();
      }
      if (event.key === "ArrowRight") {
        goNext();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goNext, goPrevious, onClose, open]);

  if (!open || images.length === 0) {
    return null;
  }

  const currentImage = images[index];

  async function saveCurrent() {
    if (currentImage) {
      await downloadImageWithWatermark(currentImage);
    }
  }

  function stopClickPropagation(event: MouseEvent) {
    event.stopPropagation();
  }

  function handleBackdropClick() {
    if (ignoreNextClickRef.current) {
      ignoreNextClickRef.current = false;
      return;
    }

    onClose();
  }

  async function saveAll() {
    for (const image of images) {
      await downloadImageWithWatermark(image);
    }
  }

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    const touch = event.touches[0];

    if (!touch) {
      return;
    }

    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    touchEndRef.current = null;
  }

  function handleTouchMove(event: TouchEvent<HTMLDivElement>) {
    const touch = event.touches[0];

    if (!touch) {
      return;
    }

    touchEndRef.current = { x: touch.clientX, y: touch.clientY };
  }

  function handleTouchEnd() {
    const start = touchStartRef.current;
    const end = touchEndRef.current;

    touchStartRef.current = null;
    touchEndRef.current = null;

    if (!start || !end) {
      return;
    }

    const deltaX = end.x - start.x;
    const deltaY = end.y - start.y;
    const isHorizontalSwipe =
      Math.abs(deltaX) > 48 && Math.abs(deltaX) > Math.abs(deltaY) * 1.25;

    if (!isHorizontalSwipe) {
      return;
    }

    ignoreNextClickRef.current = true;

    if (deltaX > 0) {
      goPrevious();
    } else {
      goNext();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex touch-none items-center justify-center bg-black/90 select-none"
      role="dialog"
      aria-modal="true"
      onClick={handleBackdropClick}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onTouchStart={handleTouchStart}
    >
      <div
        className="absolute inset-x-3 top-3 z-10 flex items-center justify-between text-white"
        onClick={stopClickPropagation}
      >
        <span className="rounded-full bg-white/15 px-3 py-1 text-sm">
          {index + 1} / {images.length}
        </span>
        <Button
          aria-label="关闭图片预览"
          className="rounded-full bg-white/15 text-white hover:bg-white/25"
          size="icon"
          type="button"
          variant="ghost"
          onClick={onClose}
        >
          <X size={21} />
        </Button>
      </div>
      {currentImage ? (
        <Image
          fill
          className="pointer-events-none object-contain"
          sizes="100vw"
          src={currentImage}
          alt="账号截图预览"
          unoptimized
        />
      ) : null}
      {index > 0 ? (
        <Button
          aria-label="上一张"
          className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/15 text-white hover:bg-white/25"
          size="icon"
          type="button"
          variant="ghost"
          onClick={(event) => {
            event.stopPropagation();
            goPrevious();
          }}
        >
          <ChevronLeft size={28} />
        </Button>
      ) : null}
      {index < images.length - 1 ? (
        <Button
          aria-label="下一张"
          className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/15 text-white hover:bg-white/25"
          size="icon"
          type="button"
          variant="ghost"
          onClick={(event) => {
            event.stopPropagation();
            goNext();
          }}
        >
          <ChevronRight size={28} />
        </Button>
      ) : null}
      <div
        className="absolute bottom-5 right-3 z-10 flex gap-2"
        onClick={stopClickPropagation}
      >
        <Button
          className="rounded-full bg-white/15 text-white hover:bg-white/25"
          type="button"
          variant="ghost"
          onClick={() => void saveCurrent()}
        >
          <Download size={17} />
          保存当前
        </Button>
        <Button
          className="rounded-full bg-white/15 text-white hover:bg-white/25"
          type="button"
          variant="ghost"
          onClick={() => void saveAll()}
        >
          <Download size={17} />
          保存全部
        </Button>
      </div>
    </div>
  );
}
