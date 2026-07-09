import { indexKnowledgeSource } from "@wuliuqi/rag";
import type { KnowledgeSourceType } from "@wuliuqi/types";

export async function indexKnowledgeSourceAfterSave(
  sourceType: KnowledgeSourceType,
  sourceId: string,
) {
  try {
    await indexKnowledgeSource(sourceType, sourceId);
  } catch (error) {
    console.warn("知识库内容已保存，但索引失败", error);
  }
}
