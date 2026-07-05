"use client";

import { Button } from "@wuliuqi/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@wuliuqi/ui/components/dialog";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { AccountDetail } from "@/components/account-detail";

export function AccountDetailModal({ id }: { id: number | null }) {
  const router = useRouter();

  function closeModal() {
    router.back();
  }

  function isImageLightboxOpen() {
    return Boolean(
      document.querySelector("[data-account-image-lightbox='true']"),
    );
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) {
          closeModal();
        }
      }}
    >
      <DialogContent
        className="h-[100dvh] w-screen max-w-none gap-0 overflow-hidden rounded-none border-0 p-0 sm:h-[calc(100dvh-2rem)] sm:w-[calc(100vw-2rem)] sm:max-w-6xl sm:rounded-md sm:border"
        onEscapeKeyDown={(event) => {
          if (isImageLightboxOpen()) {
            event.preventDefault();
          }
        }}
      >
        <DialogTitle className="sr-only">CODM 账号详情</DialogTitle>
        <DialogDescription className="sr-only">
          查看账号截图、价格、说明和交易信息。
        </DialogDescription>
        <div className="flex h-12 shrink-0 items-center justify-end border-b border-border bg-background/95 px-3 backdrop-blur">
          <Button
            aria-label="关闭详情"
            className="size-9 rounded-md"
            size="icon"
            type="button"
            variant="ghost"
            onClick={closeModal}
          >
            <X size={18} />
          </Button>
        </div>
        <div className="h-[calc(100%-3rem)] overflow-y-auto p-3 sm:p-5">
          <AccountDetail id={id} presentation="modal" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
