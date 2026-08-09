"use client";

import { Button } from "@wuliuqi/ui/components/button";
import { Spinner } from "@wuliuqi/ui/components/spinner";
import { Textarea } from "@wuliuqi/ui/components/textarea";
import { MessageCircle, Send, Trash2, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChatMessageList } from "./chat-message-list";
import { useAskChat } from "./use-ask-chat";

const suggestions = ["多久发货？", "登录失败怎么办？", "账号能换绑吗？", "售后规则是什么？"];

export function AskWidget({ kbSlug }: { kbSlug: string }) {
  const pathname = usePathname();

  // /ask 页面本身就是完整聊天，且与 widget 共用同一 sessionStorage key，双挂载会互相打架。
  if (pathname?.endsWith("/ask")) {
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
        <div className="docs-offset-panel fixed bottom-20 right-4 z-50 flex h-[560px] max-h-[calc(100dvh-8rem)] w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-sm border-2 border-ink bg-surface sm:w-[380px]">
          <div className="flex items-center justify-between border-b border-line bg-brand-soft px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-bold">
              <MessageCircle size={16} />
              567 助手
              <span className="font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-brand-strong dark:text-brand">
                Support
              </span>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 ? (
                <Button
                  className="rounded-sm text-ink-muted hover:bg-surface hover:text-ink"
                  disabled={loading}
                  size="icon"
                  type="button"
                  variant="ghost"
                  onClick={clear}
                  aria-label="清空对话"
                >
                  <Trash2 size={16} />
                </Button>
              ) : null}
              <Button
                className="rounded-sm hover:bg-surface"
                size="icon"
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                aria-label="关闭"
              >
                <X size={16} />
              </Button>
            </div>
          </div>

          <ChatMessageList
            className="flex-1 rounded-none border-0"
            loading={loading}
            messages={messages}
          />

          {messages.length === 0 ? (
            <div className="flex flex-wrap gap-2 border-t border-line px-3 py-3">
              {suggestions.map((suggestion) => (
                <Button
                  key={suggestion}
                  className="rounded-sm border-line bg-transparent hover:bg-brand-soft hover:text-ink"
                  size="sm"
                  type="button"
                  variant="outline"
                  onClick={() => ask(suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          ) : null}

          <div className="border-t-2 border-ink p-2">
            <Textarea
              className="min-h-16 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
              placeholder="输入买家问题，例如：账号多久发货？"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
                  void ask(input);
                }
              }}
            />
            <div className="flex items-center justify-between border-t border-line px-1 pb-1 pt-2">
              <span className="font-mono text-[9px] text-ink-muted">Ctrl/⌘ + Enter</span>
              <Button
                className="docs-primary-action rounded-sm"
                disabled={loading || !input.trim()}
                onClick={() => ask(input)}
              >
                {loading ? <Spinner /> : <Send size={16} />}
                发送
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <Button
        className="docs-primary-action docs-brand-mark fixed bottom-4 right-4 z-50 size-11 rounded-sm border-2 border-ink"
        size="icon"
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "关闭 AI 助手" : "打开 AI 助手"}
      >
        {open ? <X size={20} /> : <MessageCircle size={20} />}
      </Button>
    </>
  );
}
