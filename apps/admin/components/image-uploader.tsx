"use client";

import { Button } from "@wuliuqi/ui/components/button";
import { Input } from "@wuliuqi/ui/components/input";
import { Spinner } from "@wuliuqi/ui/components/spinner";
import { ImagePlus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { uploadImage } from "../lib/client-api";

export function ImageUploader({
  folder,
  images,
  maxCount = 10,
  onChange,
}: {
  folder: string;
  images: string[];
  maxCount?: number;
  onChange: (images: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFiles(files: FileList | null) {
    if (!files?.length) {
      return;
    }

    setUploading(true);
    setError("");

    try {
      const nextImages = [...images];

      for (const file of Array.from(files)) {
        if (nextImages.length >= maxCount) {
          break;
        }

        const result = await uploadImage(file, folder);
        nextImages.push(result.url);
      }

      onChange(nextImages);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "上传失败");
    } finally {
      setUploading(false);
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
            <Image
              fill
              alt="上传图片"
              className="object-cover"
              sizes="160px"
              src={image}
              unoptimized
            />
            <Button
              aria-label="删除图片"
              className="absolute right-1 top-1 size-8 bg-background/90 sm:opacity-0 sm:group-hover:opacity-100"
              size="icon"
              type="button"
              variant="ghost"
              onClick={() =>
                onChange(images.filter((_, itemIndex) => itemIndex !== index))
              }
            >
              <Trash2 size={15} />
            </Button>
          </div>
        ))}
        {images.length < maxCount ? (
          <button
            className="flex aspect-square flex-col items-center justify-center gap-2 rounded-md border border-dashed border-input bg-background text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            disabled={uploading}
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
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
