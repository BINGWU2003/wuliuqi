"use client";

import { buttonVariants } from "fumadocs-ui/components/ui/button";
import { LoaderCircle, MessageCircle, Send, Trash2, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@wuliuqi/ui/lib/utils";
import { ChatMessageList } from "./chat-message-list";
import { useAskChat } from "./use-ask-chat";

const suggestions = [
  "多久发货？",
  "登录失败怎么办？",
  "账号能换绑吗？",
  "售后规则是什么？",
];

export function AskWidget({ kbSlug }: { kbSlug: string }) {
  const pathname = usePathname();

  if (pathname.endsWith("/ask")) {
    return null;
  }

  return <AskWidgetPanel kbSlug={kbSlug} />;
}

function AskWidgetPanel({ kbSlug }: { kbSlug: string }) {
  const [open, setOpen] = useState(false);
  const { messages, input, setInput, loading, ask, clear } = useAskChat(kbSlug);

  return (
    <>
      {open ? (
        <section
          aria-label="AI 帮助助手"
          className="fixed bottom-20 right-4 z-40 flex h-[560px] max-h-[calc(100dvh-7rem)] w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-xl border bg-fd-popover text-fd-popover-foreground shadow-2xl sm:w-[380px]"
          id="ai-help-widget"
          role="dialog"
        >
          <header className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <MessageCircle className="size-4" />
              AI 帮助助手
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 ? (
                <button
                  aria-label="清空对话"
                  className={buttonVariants({
                    color: "ghost",
                    size: "icon-sm",
                  })}
                  disabled={loading}
                  onClick={clear}
                  type="button"
                >
                  <Trash2 className="size-4" />
                </button>
              ) : null}
              <button
                aria-label="关闭 AI 助手"
                className={buttonVariants({ color: "ghost", size: "icon-sm" })}
                onClick={() => setOpen(false)}
                type="button"
              >
                <X className="size-4" />
              </button>
            </div>
          </header>

          <ChatMessageList
            className="flex-1 border-0"
            loading={loading}
            messages={messages}
          />

          {messages.length === 0 ? (
            <div className="flex flex-wrap gap-2 border-t px-3 py-3">
              {suggestions.map((suggestion) => (
                <button
                  className={buttonVariants({ color: "outline", size: "sm" })}
                  key={suggestion}
                  onClick={() => void ask(suggestion)}
                  type="button"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          ) : null}

          <div className="border-t p-3">
            <textarea
              className="min-h-16 w-full resize-none bg-transparent text-sm outline-none placeholder:text-fd-muted-foreground"
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
                  void ask(input);
                }
              }}
              placeholder="输入买家问题，例如：账号多久发货？"
              value={input}
            />
            <div className="mt-2 flex items-center justify-between border-t pt-2">
              <span className="text-xs text-fd-muted-foreground">
                Ctrl/⌘ + Enter
              </span>
              <button
                className={cn(
                  buttonVariants({ color: "primary", size: "sm" }),
                  "gap-2",
                )}
                disabled={loading || !input.trim()}
                onClick={() => void ask(input)}
                type="button"
              >
                {loading ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                发送
              </button>
            </div>
          </div>
        </section>
      ) : null}

      <button
        aria-controls="ai-help-widget"
        aria-expanded={open}
        aria-label={open ? "关闭 AI 助手" : "打开 AI 助手"}
        className={cn(
          buttonVariants({ color: "primary", size: "icon" }),
          "fixed bottom-4 right-4 z-40 size-11 rounded-full shadow-lg",
        )}
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        {open ? <X className="size-5" /> : <MessageCircle className="size-5" />}
      </button>
    </>
  );
}
