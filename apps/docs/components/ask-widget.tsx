"use client";

import { buttonVariants } from "fumadocs-ui/components/ui/button";
import {
  LoaderCircle,
  MessageCircle,
  Send,
  Trash2,
  X,
} from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@wuliuqi/ui/lib/utils";
import { useAskChat } from "./use-ask-chat";

const OPEN_AI_ASSISTANT_EVENT = "open-ai-assistant";

export function AskAssistantTrigger({
  children,
  className,
}: {
  children: ReactNode;
  className?: ComponentProps<"button">["className"];
}) {
  return (
    <button
      className={className}
      onClick={() => window.dispatchEvent(new Event(OPEN_AI_ASSISTANT_EVENT))}
      type="button"
    >
      {children}
    </button>
  );
}

export function AskWidget({ kbSlug }: { kbSlug: string }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { messages, input, setInput, loading, ask, clear } = useAskChat(kbSlug);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOpen = () => {
      setMounted(true);
      setOpen(true);
    };

    window.addEventListener(OPEN_AI_ASSISTANT_EVENT, handleOpen);
    return () =>
      window.removeEventListener(OPEN_AI_ASSISTANT_EVENT, handleOpen);
  }, []);

  function setPanelOpen(nextOpen: boolean) {
    if (nextOpen) {
      setMounted(true);
    }

    setOpen(nextOpen);
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && open) {
        setPanelOpen(false);
        event.preventDefault();
      }

      if (event.key === "/" && (event.ctrlKey || event.metaKey) && !open) {
        setPanelOpen(true);
        event.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  useEffect(() => {
    const list = listRef.current;

    if (list) {
      list.scrollTo({ top: list.scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

  return (
    <>
      {mounted ? (
        <button
          aria-label="关闭 AI 助手"
          className={cn(
            "fixed inset-0 z-30 bg-fd-overlay backdrop-blur-xs lg:hidden",
            open ? "animate-fd-fade-in" : "animate-fd-fade-out",
          )}
          onAnimationEnd={() => {
            if (!open) {
              setMounted(false);
            }
          }}
          onClick={() => setPanelOpen(false)}
          type="button"
        />
      ) : null}

      {mounted ? (
        <section
          aria-label="AI 帮助助手"
          className={cn(
            "z-30 overflow-hidden bg-fd-card text-fd-card-foreground [--ai-chat-width:400px] 2xl:[--ai-chat-width:460px]",
            "max-lg:fixed max-lg:inset-x-2 max-lg:inset-y-4 max-lg:rounded-2xl max-lg:border max-lg:shadow-xl",
            "lg:sticky lg:top-0 lg:ms-auto lg:h-dvh lg:border-s lg:in-[#nd-docs-layout]:[grid-area:toc]",
            open
              ? "animate-fd-dialog-in lg:animate-[ask-ai-open_200ms]"
              : "animate-fd-dialog-out lg:animate-[ask-ai-close_200ms]",
          )}
          id="ai-help-widget"
          onAnimationEnd={(event) => {
            if (event.currentTarget === event.target && !open) {
              setMounted(false);
            }
          }}
          role="dialog"
        >
          <div className="flex size-full flex-col p-2 lg:w-(--ai-chat-width) lg:p-3">
            <header className="sticky top-0 flex items-start gap-2 rounded-xl border bg-fd-secondary text-fd-secondary-foreground shadow-sm">
              <div className="flex-1 px-3 py-2">
                <p className="mb-2 text-sm font-medium">AI 帮助助手</p>
                <p className="text-xs text-fd-muted-foreground">
                  AI 回答可能不准确，请核对帮助文档或联系人工客服。
                </p>
              </div>
              <button
                aria-label="关闭 AI 助手"
                className={cn(
                  buttonVariants({ color: "ghost", size: "icon-sm" }),
                  "rounded-full text-fd-muted-foreground",
                )}
                onClick={() => setPanelOpen(false)}
                type="button"
              >
                <X className="size-4" />
              </button>
            </header>

            <div
              className="fd-scroll-container flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain py-4"
              ref={listRef}
              style={{
                maskImage:
                  "linear-gradient(to bottom, transparent, white 1rem, white calc(100% - 1rem), transparent 100%)",
              }}
            >
              {messages.length === 0 ? (
                <div className="flex size-full flex-col items-center justify-center gap-2 text-center text-sm text-fd-muted-foreground/80">
                  <MessageCircle
                    className="size-5"
                    fill="currentColor"
                    stroke="none"
                  />
                  <p>在下方开始新的对话。</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4 px-3">
                  {messages.map((message, index) => (
                    <div key={message.role + "-" + index}>
                      <p
                        className={cn(
                          "mb-1 text-sm font-medium text-fd-muted-foreground",
                          message.role === "assistant" && "text-fd-primary",
                        )}
                      >
                        {message.role === "assistant" ? "AI 助手" : "你"}
                      </p>
                      <div className="whitespace-pre-wrap text-sm leading-7">
                        {message.content ||
                          (loading ? "正在检索并生成答案…" : "")}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border bg-fd-secondary text-fd-secondary-foreground shadow-sm has-focus-visible:shadow-md">
              <form
                className="flex items-end pe-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  void ask(input);
                }}
              >
                <textarea
                  autoFocus
                  className="min-h-14 max-h-40 flex-1 resize-none bg-transparent p-3 text-sm outline-none placeholder:text-fd-muted-foreground"
                  disabled={loading}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void ask(input);
                    }
                  }}
                  placeholder={loading ? "AI 正在回答…" : "向 AI 提问"}
                  rows={1}
                  value={input}
                />
                <button
                  aria-label="发送"
                  className={cn(
                    buttonVariants({ color: "primary", size: "icon-sm" }),
                    "mb-2 rounded-full",
                  )}
                  disabled={loading || !input.trim()}
                  type="submit"
                >
                  {loading ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                </button>
              </form>
              {messages.length > 0 ? (
                <div className="flex items-center gap-1.5 p-1">
                  <button
                    className={cn(
                      buttonVariants({ color: "secondary", size: "sm" }),
                      "gap-1.5 rounded-full",
                    )}
                    disabled={loading}
                    onClick={clear}
                    type="button"
                  >
                    <Trash2 className="size-4" />
                    清空对话
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      <button
        aria-controls="ai-help-widget"
        aria-expanded={open}
        className={cn(
          buttonVariants({ color: "secondary" }),
          "fixed bottom-4 inset-e-[calc(--spacing(4)+var(--removed-body-scroll-bar-size,0px))] z-20 w-28 gap-2 rounded-2xl shadow-lg transition-[translate,opacity]",
          open && "pointer-events-none translate-y-10 opacity-0",
        )}
        onClick={() => setPanelOpen(!open)}
        type="button"
      >
        <MessageCircle className="size-4.5" />
        询问 AI
      </button>
    </>
  );
}
