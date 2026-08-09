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
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 border-b border-line pb-4">
        <span className="mr-1 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
          快速提问
        </span>
        {suggestions.map((suggestion) => (
          <Button
            className="rounded-sm border-line bg-transparent hover:bg-brand-soft hover:text-ink"
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
            className="ml-auto rounded-sm text-ink-muted hover:bg-brand-soft hover:text-ink"
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
        className="h-[58vh] min-h-[360px]"
        loading={loading}
        messages={messages}
      />

      <div className="sticky bottom-3 rounded-sm border-2 border-ink bg-surface p-2">
        <Textarea
          className="min-h-24 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
          placeholder="输入买家问题，例如：账号多久发货？"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
              void ask(input);
            }
          }}
        />
        <div className="flex items-center justify-between border-t border-line px-2 pb-1 pt-2">
          <span className="font-mono text-[10px] text-ink-muted">Ctrl/⌘ + Enter 发送</span>
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
  );
}
