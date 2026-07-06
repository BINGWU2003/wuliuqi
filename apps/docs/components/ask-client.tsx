"use client";

import { Button } from "@wuliuqi/ui/components/button";
import { Spinner } from "@wuliuqi/ui/components/spinner";
import { Textarea } from "@wuliuqi/ui/components/textarea";
import { Send, Trash2 } from "lucide-react";
import { ChatMessageList } from "./chat-message-list";
import { useAskChat } from "./use-ask-chat";

const suggestions = ["多久发货？", "登录失败怎么办？", "账号能换绑吗？", "售后规则是什么？"];

export function AskClient({ kbSlug }: { kbSlug: string }) {
  const { messages, input, setInput, loading, ask, clear } = useAskChat(kbSlug);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {suggestions.map((suggestion) => (
          <Button
            key={suggestion}
            size="sm"
            type="button"
            variant="outline"
            onClick={() => ask(suggestion)}
          >
            {suggestion}
          </Button>
        ))}
        {messages.length > 0 ? (
          <Button
            className="ml-auto text-muted-foreground"
            disabled={loading}
            size="sm"
            type="button"
            variant="ghost"
            onClick={clear}
          >
            <Trash2 size={16} />
            清空对话
          </Button>
        ) : null}
      </div>

      <ChatMessageList
        className="h-[60vh]"
        loading={loading}
        messages={messages}
      />

      <div className="sticky bottom-3 rounded-md border border-border bg-background p-2 shadow-sm">
        <Textarea
          className="min-h-24 border-0 shadow-none focus-visible:ring-0"
          placeholder="输入买家问题，例如：账号多久发货？"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
              void ask(input);
            }
          }}
        />
        <div className="flex items-center justify-between px-2 pb-1">
          <span className="text-xs text-muted-foreground">Ctrl/⌘ + Enter 发送</span>
          <Button disabled={loading || !input.trim()} onClick={() => ask(input)}>
            {loading ? <Spinner /> : <Send size={16} />}
            发送
          </Button>
        </div>
      </div>
    </div>
  );
}
