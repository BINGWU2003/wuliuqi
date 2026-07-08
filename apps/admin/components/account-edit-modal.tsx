"use client";

import { Button } from "@wuliuqi/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@wuliuqi/ui/components/dialog";
import { preventOutsideDismiss } from "@wuliuqi/ui/lib/modal-interactions";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CodmAccountForm, SanguoshaAccountForm } from "@/components/account-form";

export function AccountEditModal({
  accountId,
  initialGameKey = "codm",
}: {
  accountId?: number | null;
  initialGameKey?: "codm" | "sanguosha";
}) {
  const router = useRouter();
  const [formBusy, setFormBusy] = useState(false);
  const isInvalidAccountId = accountId === null;
  const title = accountId === undefined ? "新建账号" : "编辑账号";

  function closeModal() {
    if (formBusy) {
      return;
    }

    router.back();
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !formBusy) {
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
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogDescription className="sr-only">
          {accountId === undefined
            ? "新建账号图片、价格、状态、邮箱和描述。"
            : "编辑账号图片、价格、状态、邮箱和描述。"}
        </DialogDescription>
        <div className="flex h-12 shrink-0 items-center justify-end border-b border-border bg-background/95 px-3 backdrop-blur">
          <Button
            aria-label={`关闭${title}`}
            className="size-9 rounded-md"
            disabled={formBusy}
            size="icon"
            title={formBusy ? "保存中，暂不能关闭" : `关闭${title}`}
            type="button"
            variant="ghost"
            onClick={closeModal}
          >
            <X size={18} />
          </Button>
        </div>
        <div className="h-[calc(100%-3rem)] overflow-y-auto p-3 sm:p-5">
          {isInvalidAccountId ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              无效的账号ID
            </div>
          ) : initialGameKey === "sanguosha" ? (
            <SanguoshaAccountForm
              accountId={accountId}
              presentation="modal"
              onBusyChange={setFormBusy}
            />
          ) : (
            <CodmAccountForm
              accountId={accountId}
              presentation="modal"
              onBusyChange={setFormBusy}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
