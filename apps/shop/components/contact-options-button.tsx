"use client";

import { Button } from "@wuliuqi/ui/components/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@wuliuqi/ui/components/sheet";
import { toast } from "@wuliuqi/ui/components/sonner";
import { cn } from "@wuliuqi/ui/lib/utils";
import { ExternalLink, MessageCircle, MessagesSquare } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { SHOP_WECHAT_ID, SHOP_XIANYU_URL } from "@/lib/contact";

type ContactButtonVariant = "full" | "floating";

export function ContactOptionsButton({
  avoidBottomTabs = false,
  className,
  variant = "full",
}: {
  avoidBottomTabs?: boolean;
  className?: string;
  variant?: ContactButtonVariant;
}) {
  const [open, setOpen] = useState(false);
  const isFloating = variant === "floating";

  async function openWechat() {
    const copied = await copyText(SHOP_WECHAT_ID);

    setOpen(false);

    if (copied) {
      toast.success("微信号已复制，打开微信后可直接粘贴搜索");
    } else {
      toast.warning("正在打开微信，可手动复制页面上的微信号");
    }

    window.location.href = "weixin://";
  }

  function openXianyu() {
    setOpen(false);
    window.open(SHOP_XIANYU_URL, "_blank", "noopener,noreferrer");
  }

  return (
    <>
      <Button
        aria-label="联系卖家"
        className={cn(
          isFloating
            ? [
                "fixed right-4 z-40 h-12 rounded-full px-4 shadow-lg shadow-black/15",
                "sm:right-6 sm:h-11 sm:px-5",
                avoidBottomTabs
                  ? "bottom-[calc(4rem+env(safe-area-inset-bottom)+0.75rem)] sm:bottom-6"
                  : "bottom-[calc(env(safe-area-inset-bottom)+1rem)] sm:bottom-6",
              ]
            : "h-11 w-full rounded-md",
          className,
        )}
        title="联系卖家"
        type="button"
        onClick={() => setOpen(true)}
      >
        <MessagesSquare size={isFloating ? 19 : 18} />
        <span className={cn(isFloating && "hidden sm:inline")}>联系卖家</span>
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          className="left-1/2 max-h-[calc(100vh-2rem)] w-full max-w-md -translate-x-1/2 rounded-t-lg p-0"
          side="bottom"
        >
          <SheetHeader className="border-b border-border px-5 py-4 text-left">
            <SheetTitle>选择联系方式</SheetTitle>
            <SheetDescription>
              微信号：{SHOP_WECHAT_ID}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-3 p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]">
            <ContactOption
              description="复制微信号并打开微信"
              icon={<MessageCircle size={20} />}
              title="微信联系"
              onClick={openWechat}
            />
            <ContactOption
              description="通过闲鱼店铺沟通"
              icon={<ExternalLink size={20} />}
              title="闲鱼联系"
              onClick={openXianyu}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function ContactOption({
  description,
  icon,
  onClick,
  title,
}: {
  description: string;
  icon: ReactNode;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      className="flex w-full items-center gap-3 rounded-md border border-border bg-card p-4 text-left transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
      type="button"
      onClick={onClick}
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-foreground">
          {title}
        </span>
        <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
          {description}
        </span>
      </span>
    </button>
  );
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return fallbackCopyText(text);
  }
}

function fallbackCopyText(text: string) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();

  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    document.body.removeChild(textarea);
  }
}
