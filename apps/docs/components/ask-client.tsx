"use client";

import type { ChatMessageInput } from "@wuliuqi/types";
import { Badge } from "@wuliuqi/ui/components/badge";
import { Button } from "@wuliuqi/ui/components/button";
import { Card } from "@wuliuqi/ui/components/card";
import { Spinner } from "@wuliuqi/ui/components/spinner";
import { Textarea } from "@wuliuqi/ui/components/textarea";
import { Bot, Send, UserRound } from "lucide-react";
import { useState } from "react";

const suggestions = ["多久发货？", "登录失败怎么办？", "账号能换绑吗？", "售后规则是什么？"];

export function AskClient({ kbSlug }: { kbSlug: string }) {
  const [messages, setMessages] = useState<ChatMessageInput[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function ask(nextQuestion = input) {
    const question = nextQuestion.trim();

    if (!question || loading) {
      return;
    }

    const nextMessages: ChatMessageInput[] = [
      ...messages,
      { role: "user", content: question },
    ];

    setMessages([...nextMessages, { role: "assistant", content: "" }]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kbSlug, messages: nextMessages }),
      });

      if (!response.ok) {
        const message = await response.text().catch(() => "");

        throw new Error(message || "AI 问答暂时不可用");
      }

      if (!response.body) {
        throw new Error("AI 问答暂时不可用");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let answer = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        answer += decoder.decode(value, { stream: true });
        setMessages([...nextMessages, { role: "assistant", content: answer }]);
      }
    } catch (error) {
      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content:
            error instanceof Error
              ? error.message
              : "AI 问答暂时不可用，请联系人工客服。",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
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
      </div>
      <div className="space-y-3">
        {messages.length === 0 ? (
          <Card className="rounded-md p-8 text-center text-sm text-muted-foreground shadow-none">
            你可以直接问账号购买、交付、登录、换绑和售后相关问题。
          </Card>
        ) : null}
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className="rounded-md border border-border bg-card p-4"
          >
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              {message.role === "user" ? <UserRound size={16} /> : <Bot size={16} />}
              {message.role === "user" ? "你" : "AI 助手"}
              {message.role === "assistant" ? <Badge variant="secondary">基于帮助中心</Badge> : null}
            </div>
            <div className="whitespace-pre-wrap text-sm leading-7">
              {message.content || "正在生成..."}
            </div>
          </div>
        ))}
      </div>
      <div className="sticky bottom-3 rounded-md border border-border bg-background p-2 shadow-sm">
        <Textarea
          className="min-h-24 border-0 shadow-none focus-visible:ring-0"
          placeholder="输入买家问题，例如：账号多久发货？"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
              void ask();
            }
          }}
        />
        <div className="flex items-center justify-between px-2 pb-1">
          <span className="text-xs text-muted-foreground">Ctrl/⌘ + Enter 发送</span>
          <Button disabled={loading || !input.trim()} onClick={() => ask()}>
            {loading ? <Spinner /> : <Send size={16} />}
            发送
          </Button>
        </div>
      </div>
    </div>
  );
}
