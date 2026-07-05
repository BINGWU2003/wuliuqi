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
import { AccountForm } from "@/components/account-form";

function preventOutsideDismiss(event: Event) {
  event.preventDefault();
}

export function AccountEditModal({ accountId }: { accountId: number | null }) {
  const router = useRouter();

  function closeModal() {
    router.back();
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
        onFocusOutside={preventOutsideDismiss}
        onInteractOutside={preventOutsideDismiss}
        onPointerDownOutside={preventOutsideDismiss}
      >
        <DialogTitle className="sr-only">编辑账号</DialogTitle>
        <DialogDescription className="sr-only">
          编辑账号图片、价格、状态、邮箱和描述。
        </DialogDescription>
        <div className="flex h-12 shrink-0 items-center justify-end border-b border-border bg-background/95 px-3 backdrop-blur">
          <Button
            aria-label="关闭编辑"
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
          {accountId ? (
            <AccountForm accountId={accountId} presentation="modal" />
          ) : (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              无效的账号ID
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
