"use client";

import { buttonVariants } from "fumadocs-ui/components/ui/button";
import { LoaderCircle, Send, Trash2 } from "lucide-react";
import { cn } from "@wuliuqi/ui/lib/utils";
import { ChatMessageList } from "./chat-message-list";
import { useAskChat } from "./use-ask-chat";

const suggestions = [
  "多久发货？",
  "登录失败怎么办？",
  "账号能换绑吗？",
  "售后规则是什么？",
];

export function AskClient({ kbSlug }: { kbSlug: string }) {
  const { messages, input, setInput, loading, ask, clear } = useAskChat(kbSlug);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 border-b pb-4">
        <span className="mr-1 text-xs font-medium text-fd-muted-foreground">
          快速提问
        </span>
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
        {messages.length > 0 ? (
          <button
            className={cn(
              buttonVariants({ color: "ghost", size: "sm" }),
              "ml-auto gap-2",
            )}
            disabled={loading}
            onClick={clear}
            type="button"
          >
            <Trash2 className="size-4" />
            清空对话
          </button>
        ) : null}
      </div>

      <ChatMessageList
        className="h-[58vh] min-h-[360px]"
        loading={loading}
        messages={messages}
      />

      <div className="sticky bottom-3 rounded-xl border bg-fd-card p-3 shadow-lg">
        <textarea
          className="min-h-24 w-full resize-none bg-transparent text-sm outline-none placeholder:text-fd-muted-foreground"
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
            Ctrl/⌘ + Enter 发送
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
    </div>
  );
}
