import type { KnowledgeSourceType } from "./knowledge.js";

export const CHAT_ROLE = {
  user: "user",
  assistant: "assistant",
  system: "system",
} as const;
export const CHAT_ROLES = [
  CHAT_ROLE.user,
  CHAT_ROLE.assistant,
  CHAT_ROLE.system,
] as const;
export type ChatRole = (typeof CHAT_ROLES)[number];

export interface RagMessageSource {
  title: string;
  href: string;
  sourceType: KnowledgeSourceType;
  sourceId: string;
  score?: number;
}

export interface RagConversation {
  id: string;
  knowledgeBaseId: string;
  title?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RagMessage {
  id: string;
  conversationId: string;
  role: ChatRole;
  content: string;
  sources: RagMessageSource[];
  createdAt?: string;
}

export interface ChatMessageInput {
  role: ChatRole;
  content: string;
}
