"use client";

import { Button } from "@wuliuqi/ui/components/button";
import { ChevronLeft, ChevronRight, Download, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
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
        setIndex((current) => Math.max(0, current - 1));
      }
      if (event.key === "ArrowRight") {
        setIndex((current) => Math.min(images.length - 1, current + 1));
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [images.length, onClose, open]);

  if (!open || images.length === 0) {
    return null;
  }

  const currentImage = images[index];

  async function saveCurrent() {
    if (currentImage) {
      await downloadImageWithWatermark(currentImage);
    }
  }

  async function saveAll() {
    for (const image of images) {
      await downloadImageWithWatermark(image);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-x-3 top-3 z-10 flex items-center justify-between text-white">
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
          className="object-contain"
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
          onClick={() => setIndex((current) => Math.max(0, current - 1))}
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
          onClick={() =>
            setIndex((current) => Math.min(images.length - 1, current + 1))
          }
        >
          <ChevronRight size={28} />
        </Button>
      ) : null}
      <div className="absolute bottom-5 right-3 z-10 flex gap-2">
        <Button
          className="rounded-full bg-white/15 text-white hover:bg-white/25"
          type="button"
          variant="ghost"
          onClick={saveCurrent}
        >
          <Download size={17} />
          保存当前
        </Button>
        <Button
          className="rounded-full bg-white/15 text-white hover:bg-white/25"
          type="button"
          variant="ghost"
          onClick={saveAll}
        >
          <Download size={17} />
          保存全部
        </Button>
      </div>
    </div>
  );
}
