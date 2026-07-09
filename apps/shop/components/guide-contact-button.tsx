"use client";

import { Button } from "@wuliuqi/ui/components/button";
import { toast } from "@wuliuqi/ui/components/sonner";
import { MessageCircle } from "lucide-react";

export function GuideContactButton({ wechatId }: { wechatId: string }) {
  async function handleContact() {
    const copied = await copyText(wechatId);

    if (copied) {
      toast.success("微信号已复制，打开微信后可直接粘贴搜索");
    } else {
      toast.warning("正在打开微信，可手动复制页面上的微信号");
    }

    window.location.href = "weixin://";
  }

  return (
    <Button
      className="h-11 w-full rounded-md"
      title={`联系我：${wechatId}`}
      type="button"
      onClick={handleContact}
    >
      <MessageCircle size={18} />
      联系我
    </Button>
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
