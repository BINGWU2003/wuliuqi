"use client";

import type { ChatMessageInput } from "@wuliuqi/types";
import { Badge } from "@wuliuqi/ui/components/badge";
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
    <div className={cn("relative min-h-0", className)}>
      <div
        ref={viewportRef}
        className="h-full space-y-3 overflow-y-auto px-1"
        onScroll={handleScroll}
      >
        {messages.length === 0 ? (
          <div className="rounded-md border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            {emptyHint}
          </div>
        ) : null}
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className="rounded-md border border-border bg-card p-4"
          >
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              {message.role === "user" ? <UserRound size={16} /> : <Bot size={16} />}
              {message.role === "user" ? "你" : "AI 助手"}
              {message.role === "assistant" ? (
                <Badge variant="secondary">基于帮助中心</Badge>
              ) : null}
            </div>
            <div className="whitespace-pre-wrap text-sm leading-7">
              {message.content || (loading ? "正在生成..." : "")}
            </div>
          </div>
        ))}
      </div>
      {showJump ? (
        <Button
          className="absolute bottom-2 right-2 size-8 rounded-full shadow-md"
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
