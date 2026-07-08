# @wuliuqi/rag

RAG 服务包，负责帮助中心内容索引、向量生成、相似内容检索和买家问答流式响应。

## 主要能力

- 将文章或 FAQ 切分为可检索的知识块。
- 调用 Gemini embedding 接口生成向量。
- 通过 `@wuliuqi/rag-db` 写入和检索知识库数据。
- 生成买家帮助中心 AI 问答的流式 `Response`。
- 对订单、支付、退款、账号隐私、库存、价格等敏感问题引导人工客服。

## 主要导出

```ts
import {
  RagError,
  createChatStreamResponse,
  getModelProvider,
  indexKnowledgeSource,
} from "@wuliuqi/rag";
```

## 环境变量

必须提供：

```env
GEMINI_API_KEY="your-gemini-api-key"
```

可选配置：

```env
RAG_MODEL_PROVIDER="gemini"
GEMINI_CHAT_MODEL="gemini-3.5-flash"
GEMINI_EMBEDDING_MODEL="gemini-embedding-2"
GEMINI_EMBEDDING_DIMENSIONS="768"
```

还需要按 `@wuliuqi/rag-db` 的说明配置 `RAG_DATABASE_URL`。

## 常用命令

在仓库根目录执行：

```powershell
pnpm --filter @wuliuqi/rag check-types
pnpm --filter @wuliuqi/rag lint
```

## 注意事项

- 当前仅支持 Gemini provider。
- embedding 维度需要和 `rag-db` 中 `knowledge_chunks.embedding` 的向量维度保持一致。
- `createChatStreamResponse` 会尽力记录会话消息，记录失败不会阻断用户得到回答。
