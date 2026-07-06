"use client";

import type { ChatMessageInput } from "@wuliuqi/types";
import { useCallback, useEffect, useState } from "react";

const storageKey = (kbSlug: string) => `ask-messages:${kbSlug}`;

export function useAskChat(kbSlug: string) {
  const [messages, setMessages] = useState<ChatMessageInput[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // 从 sessionStorage 恢复对话：刷新页面保留，关闭标签/浏览器自动清空。
  useEffect(() => {
    const stored = sessionStorage.getItem(storageKey(kbSlug));

    if (!stored) {
      return;
    }

    try {
      const parsed = JSON.parse(stored) as ChatMessageInput[];

      if (Array.isArray(parsed)) {
        setMessages(parsed);
      }
    } catch {
      sessionStorage.removeItem(storageKey(kbSlug));
    }
  }, [kbSlug]);

  useEffect(() => {
    if (messages.length === 0) {
      sessionStorage.removeItem(storageKey(kbSlug));
      return;
    }

    sessionStorage.setItem(storageKey(kbSlug), JSON.stringify(messages));
  }, [kbSlug, messages]);

  const ask = useCallback(
    async (question: string) => {
      const trimmed = question.trim();

      if (!trimmed || loading) {
        return;
      }

      const nextMessages: ChatMessageInput[] = [
        ...messages,
        { role: "user", content: trimmed },
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
    },
    [kbSlug, loading, messages],
  );

  const clear = useCallback(() => {
    if (loading) {
      return;
    }

    setMessages([]);
  }, [loading]);

  return { messages, input, setInput, loading, ask, clear };
}
