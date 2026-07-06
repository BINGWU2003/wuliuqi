import { indexKnowledgeSource } from "@wuliuqi/rag";

type SourceType = "article" | "faq";

export async function indexKnowledgeSourceAfterSave(
  sourceType: SourceType,
  sourceId: string,
) {
  try {
    await indexKnowledgeSource(sourceType, sourceId);
  } catch (error) {
    console.warn("知识库内容已保存，但索引失败", error);
  }
}
