"use client";

import { Button } from "@wuliuqi/ui/components/button";
import { ImageLightbox } from "@wuliuqi/ui/components/image-lightbox";
import { Input } from "@wuliuqi/ui/components/input";
import { Spinner } from "@wuliuqi/ui/components/spinner";
import { toast } from "@wuliuqi/ui/components/sonner";
import { downloadImageWithWatermark } from "@wuliuqi/utils/browser/image-download";
import { ImagePlus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { uploadImages } from "@/lib/client-api";
import { errorMessage } from "@/lib/feedback";

const UPLOAD_PARALLEL_LIMIT = 3;

export function ImageUploader({
  folder,
  images,
  maxCount = 10,
  onChange,
  onUploadingChange,
}: {
  folder: string;
  images: string[];
  maxCount?: number;
  onChange: (images: string[]) => void;
  onUploadingChange?: (uploading: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) {
      return;
    }

    setUploading(true);
    onUploadingChange?.(true);

    try {
      const nextImages = [...images];
      const uploadFiles = Array.from(files).slice(0, maxCount - images.length);
      const results = await uploadImages(
        uploadFiles,
        folder,
        UPLOAD_PARALLEL_LIMIT,
      );

      for (const result of results) {
        nextImages.push(result.url);
      }

      onChange(nextImages);
      toast.success("图片已上传");
    } catch (uploadError) {
      toast.error(errorMessage(uploadError, "上传失败"));
    } finally {
      setUploading(false);
      onUploadingChange?.(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {images.map((image, index) => (
          <div
            key={`${image}-${index}`}
            className="group relative aspect-square overflow-hidden rounded-md border border-border bg-muted"
          >
            <button
              aria-label={`预览第 ${index + 1} 张图片`}
              className="relative size-full"
              title={`预览第 ${index + 1} 张图片`}
              type="button"
              onClick={() => {
                setPreviewIndex(index);
                setPreviewOpen(true);
              }}
            >
              <Image
                fill
                alt="上传图片"
                className="object-cover"
                sizes="160px"
                src={image}
                unoptimized
              />
            </button>
            <Button
              aria-label="删除图片"
              className="absolute right-1 top-1 size-8 bg-background/90 sm:opacity-0 sm:group-hover:opacity-100"
              size="icon"
              title="删除图片"
              type="button"
              variant="ghost"
              onClick={(event) => {
                event.stopPropagation();
                onChange(images.filter((_, itemIndex) => itemIndex !== index));
              }}
            >
              <Trash2 size={15} />
            </Button>
          </div>
        ))}
        {images.length < maxCount ? (
          <button
            aria-label="添加图片"
            className="flex aspect-square flex-col items-center justify-center gap-2 rounded-md border border-dashed border-input bg-background text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            disabled={uploading}
            title="添加图片"
            type="button"
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? (
              <Spinner className="size-5" />
            ) : (
              <ImagePlus size={22} />
            )}
            {uploading ? "上传中..." : "添加图片"}
          </button>
        ) : null}
      </div>
      <Input
        ref={inputRef}
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        multiple
        type="file"
        onChange={(event) => handleFiles(event.target.files)}
      />
      <ImageLightbox
        downloadImage={(image) =>
          downloadImageWithWatermark(image, { text: "© 567手游店" })
        }
        images={images}
        labels={{ imageAlt: "上传图片预览" }}
        open={previewOpen}
        startIndex={previewIndex}
        onClose={() => setPreviewOpen(false)}
      />
    </div>
  );
}
