"use client";

import type { CarouselItem } from "@wuliuqi/types";
import { Button } from "@wuliuqi/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@wuliuqi/ui/components/card";
import { ImageLightbox } from "@wuliuqi/ui/components/image-lightbox";
import { Input } from "@wuliuqi/ui/components/input";
import { Skeleton } from "@wuliuqi/ui/components/skeleton";
import { Spinner } from "@wuliuqi/ui/components/spinner";
import { toast } from "@wuliuqi/ui/components/sonner";
import { downloadImageWithWatermark } from "@wuliuqi/utils/browser/image-download";
import { ArrowDown, ArrowUp, ImagePlus, Save, Trash2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { fetchCarousel, updateCarousel, uploadImage } from "@/lib/client-api";
import { errorMessage } from "@/lib/feedback";

const MAX_IMAGES = 6;

function reorder(items: CarouselItem[], fromIndex: number, toIndex: number) {
  const nextItems = [...items];
  const [moved] = nextItems.splice(fromIndex, 1);

  if (!moved) {
    return items;
  }

  nextItems.splice(toIndex, 0, moved);
  return nextItems.map((item, index) => ({ ...item, sortOrder: index }));
}

export function CarouselPage({ name }: { name: string }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragIndexRef = useRef<number | null>(null);
  const [items, setItems] = useState<CarouselItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);

  async function loadCarousel() {
    setLoading(true);

    try {
      const carousel = await fetchCarousel(name);
      setItems(carousel.items);
    } catch (loadError) {
      toast.error(errorMessage(loadError, "加载失败"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCarousel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  async function handleFiles(files: FileList | null) {
    if (!files?.length || uploading || saving || items.length >= MAX_IMAGES) {
      return;
    }

    setUploading(true);

    try {
      const nextItems = [...items];

      for (const file of Array.from(files)) {
        if (nextItems.length >= MAX_IMAGES) {
          break;
        }

        const result = await uploadImage(file, "banners/");
        nextItems.push({
          sortOrder: nextItems.length,
          url: result.url,
        });
      }

      setItems(nextItems);
      toast.success("图片已上传");
    } catch (uploadError) {
      toast.error(errorMessage(uploadError, "上传失败"));
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function save() {
    if (saving || uploading) {
      return;
    }

    setSaving(true);

    try {
      const normalizedItems = items.map((item, index) => ({
        ...item,
        sortOrder: index,
      }));
      await updateCarousel(name, normalizedItems);
      setItems(normalizedItems);
      toast.success("轮播图已保存");
    } catch (saveError) {
      toast.error(errorMessage(saveError, "保存失败"));
    } finally {
      setSaving(false);
    }
  }

  const isBusy = saving || uploading;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-normal">轮播图管理</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            配置名：{name}，最多 {MAX_IMAGES} 张
          </p>
        </div>
        <div className="grid gap-2 sm:flex">
          <Button
            className="w-full sm:w-auto"
            disabled={isBusy || items.length >= MAX_IMAGES}
            title="添加图片"
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? <Spinner /> : <ImagePlus size={16} />}
            {uploading ? "上传中..." : "添加图片"}
          </Button>
          <Button
            className="w-full sm:w-auto"
            disabled={isBusy || items.length === 0}
            title="保存轮播图"
            type="button"
            onClick={save}
          >
            {saving ? <Spinner /> : <Save size={16} />}
            {saving ? "保存中..." : "保存"}
          </Button>
        </div>
      </div>

      <Input
        ref={fileInputRef}
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        multiple
        type="file"
        onChange={(event) => handleFiles(event.target.files)}
      />

      <Card className="rounded-md shadow-none">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-base">图片排序</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {loading ? (
            <CarouselLoadingGrid />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item, index) => (
                <div
                  key={`${item.url}-${index}`}
                  className="rounded-md border border-border bg-background"
                  draggable={!isBusy}
                  onDragOver={(event) => {
                    if (!isBusy) {
                      event.preventDefault();
                    }
                  }}
                  onDragStart={() => {
                    if (isBusy) {
                      return;
                    }
                    dragIndexRef.current = index;
                  }}
                  onDrop={() => {
                    if (isBusy) {
                      return;
                    }
                    if (dragIndexRef.current !== null) {
                      setItems(reorder(items, dragIndexRef.current, index));
                    }
                    dragIndexRef.current = null;
                  }}
                >
                  <div className="relative aspect-[16/9] overflow-hidden rounded-t-md bg-muted">
                    <button
                      aria-label={`预览第 ${index + 1} 张轮播图`}
                      className="relative size-full"
                      title={`预览第 ${index + 1} 张轮播图`}
                      type="button"
                      onClick={() => {
                        setPreviewIndex(index);
                        setPreviewOpen(true);
                      }}
                    >
                      <Image
                        fill
                        alt={`轮播图 ${index + 1}`}
                        className="object-cover"
                        sizes="360px"
                        src={item.url}
                        unoptimized
                      />
                    </button>
                  </div>
                  <div className="space-y-2 p-3">
                    <Input
                      disabled={isBusy}
                      placeholder="跳转链接，可选"
                      value={item.linkUrl ?? ""}
                      onChange={(event) =>
                        setItems(
                          items.map((nextItem, itemIndex) =>
                            itemIndex === index
                              ? { ...nextItem, linkUrl: event.target.value }
                              : nextItem,
                          ),
                        )
                      }
                    />
                    <div className="flex justify-between gap-1">
                      <div className="flex gap-1">
                        <Button
                          aria-label="上移"
                          disabled={isBusy || index === 0}
                          size="icon"
                          title="上移"
                          type="button"
                          variant="ghost"
                          onClick={() =>
                            setItems(reorder(items, index, index - 1))
                          }
                        >
                          <ArrowUp size={16} />
                        </Button>
                        <Button
                          aria-label="下移"
                          disabled={isBusy || index === items.length - 1}
                          size="icon"
                          title="下移"
                          type="button"
                          variant="ghost"
                          onClick={() =>
                            setItems(reorder(items, index, index + 1))
                          }
                        >
                          <ArrowDown size={16} />
                        </Button>
                      </div>
                      <Button
                        aria-label="删除"
                        disabled={isBusy}
                        size="icon"
                        title="删除"
                        type="button"
                        variant="ghost"
                        onClick={() =>
                          setItems(
                            items
                              .filter((_, itemIndex) => itemIndex !== index)
                              .map((nextItem, itemIndex) => ({
                                ...nextItem,
                                sortOrder: itemIndex,
                              })),
                          )
                        }
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {items.length === 0 ? (
                <div className="rounded-md border border-dashed border-input p-8 text-center text-sm text-muted-foreground">
                  暂无轮播图
                </div>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>
      <ImageLightbox
        downloadImage={(image) =>
          downloadImageWithWatermark(image, { text: "© 567手游店" })
        }
        images={items.map((item) => item.url)}
        labels={{ imageAlt: "轮播图预览" }}
        open={previewOpen}
        startIndex={previewIndex}
        onClose={() => setPreviewOpen(false)}
      />
    </div>
  );
}

function CarouselLoadingGrid() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          className="overflow-hidden rounded-md border border-border bg-background"
          key={index}
        >
          <Skeleton className="aspect-[16/9] rounded-none" />
          <div className="space-y-2 p-3">
            <Skeleton className="h-9 w-full" />
            <div className="flex justify-between gap-1">
              <div className="flex gap-1">
                <Skeleton className="size-9" />
                <Skeleton className="size-9" />
              </div>
              <Skeleton className="size-9" />
            </div>
          </div>
        </div>
      ))}
      <div className="flex min-h-32 items-center justify-center rounded-md border border-dashed border-input text-sm text-muted-foreground">
        <Spinner />
        <span className="ml-2">加载轮播图</span>
      </div>
    </div>
  );
}
