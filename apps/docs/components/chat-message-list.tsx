"use client";

import type { ChatMessageInput } from "@wuliuqi/types";
import { Button } from "@wuliuqi/ui/components/button";
import { cn } from "@wuliuqi/ui/lib/utils";
import { Bot, ChevronDown, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const BOTTOM_THRESHOLD = 48;

export function ChatMessageList({
  messages,
  loading,
  emptyHint = "你可以直接问账号购买、交付、登录、换绑和售后相关问题。",
  className,
}: {
  messages: ChatMessageInput[];
  loading: boolean;
  emptyHint?: string;
  className?: string;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const atBottomRef = useRef(true);
  const [showJump, setShowJump] = useState(false);

  function scrollToBottom(behavior: ScrollBehavior = "smooth") {
    const el = viewportRef.current;

    if (!el) {
      return;
    }

    el.scrollTo({ top: el.scrollHeight, behavior });
  }

  function handleScroll() {
    const el = viewportRef.current;

    if (!el) {
      return;
    }

    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    const atBottom = distance < BOTTOM_THRESHOLD;

    atBottomRef.current = atBottom;
    setShowJump(!atBottom);
  }

  // 新消息或流式追加时，仅当用户本就贴着底部才自动滚到底，避免打断上滚查看历史。
  useEffect(() => {
    if (atBottomRef.current) {
      scrollToBottom("auto");
    }
  }, [messages]);

  return (
    <div
      className={cn(
        "relative min-h-0 overflow-hidden rounded-sm border border-line bg-surface",
        className,
      )}
    >
      <div
        ref={viewportRef}
        className="h-full overflow-y-auto"
        onScroll={handleScroll}
      >
        {messages.length === 0 ? (
          <div className="grid min-h-full place-items-center p-8 text-center">
            <div className="max-w-sm">
              <p className="text-sm leading-7 text-ink-muted">{emptyHint}</p>
            </div>
          </div>
        ) : null}
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={cn(
              "grid gap-3 border-b border-line p-4 sm:grid-cols-[7rem_minmax(0,1fr)]",
              message.role === "user" ? "bg-surface-muted/50" : "bg-surface",
            )}
          >
            <div className="flex items-center gap-2 self-start font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
              {message.role === "user" ? <UserRound size={16} /> : <Bot size={16} />}
              {message.role === "user" ? "你" : "567 助手"}
            </div>
            <div>
              {message.role === "assistant" ? (
                <span className="mb-2 inline-block border border-line bg-brand-soft px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-brand-strong dark:text-brand">
                  基于帮助中心
                </span>
              ) : null}
              <div className="whitespace-pre-wrap text-sm leading-7 text-ink/90">
                {message.content || (loading ? "正在检索并生成答案…" : "")}
              </div>
            </div>
          </div>
        ))}
      </div>
      {showJump ? (
        <Button
          aria-label="跳到最新消息"
          className="absolute bottom-2 right-2 size-8 rounded-sm border border-line bg-surface shadow-none hover:bg-brand-soft"
          size="icon"
          type="button"
          variant="secondary"
          onClick={() => scrollToBottom()}
        >
          <ChevronDown size={16} />
        </Button>
      ) : null}
    </div>
  );
}
