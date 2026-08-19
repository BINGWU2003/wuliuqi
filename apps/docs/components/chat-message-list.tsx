"use client";

import type { ChatMessageInput } from "@wuliuqi/types";
import { buttonVariants } from "fumadocs-ui/components/ui/button";
import { Bot, ChevronDown, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@wuliuqi/ui/lib/utils";

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
    const element = viewportRef.current;
    element?.scrollTo({ top: element.scrollHeight, behavior });
  }

  function handleScroll() {
    const element = viewportRef.current;

    if (!element) {
      return;
    }

    const distance =
      element.scrollHeight - element.scrollTop - element.clientHeight;
    const atBottom = distance < BOTTOM_THRESHOLD;
    atBottomRef.current = atBottom;
    setShowJump(!atBottom);
  }

  useEffect(() => {
    if (atBottomRef.current) {
      scrollToBottom("auto");
    }
  }, [messages]);

  return (
    <div
      className={cn(
        "relative min-h-0 overflow-hidden rounded-xl border",
        className,
      )}
    >
      <div
        className="h-full overflow-y-auto"
        onScroll={handleScroll}
        ref={viewportRef}
      >
        {messages.length === 0 ? (
          <div className="grid min-h-full place-items-center p-8 text-center">
            <p className="max-w-sm text-sm leading-7 text-fd-muted-foreground">
              {emptyHint}
            </p>
          </div>
        ) : null}
        {messages.map((message, index) => (
          <div
            className={cn(
              "grid gap-3 border-b p-4 sm:grid-cols-[6rem_minmax(0,1fr)]",
              message.role === "user" ? "bg-fd-muted/50" : "bg-fd-background",
            )}
            key={`${message.role}-${index}`}
          >
            <div className="flex items-center gap-2 self-start text-xs font-medium text-fd-muted-foreground">
              {message.role === "user" ? (
                <UserRound className="size-4" />
              ) : (
                <Bot className="size-4" />
              )}
              {message.role === "user" ? "你" : "AI 助手"}
            </div>
            <div className="whitespace-pre-wrap text-sm leading-7">
              {message.content || (loading ? "正在检索并生成答案…" : "")}
            </div>
          </div>
        ))}
      </div>
      {showJump ? (
        <button
          aria-label="跳到最新消息"
          className={cn(
            buttonVariants({ color: "outline", size: "icon-sm" }),
            "absolute bottom-2 right-2 bg-fd-background",
          )}
          onClick={() => scrollToBottom()}
          type="button"
        >
          <ChevronDown className="size-4" />
        </button>
      ) : null}
    </div>
  );
}
