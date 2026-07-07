# docs

买家帮助中心应用，提供帮助文章、FAQ 搜索和 Gemini AI 问答。

## 主要路由

- `/kb/buyer-help`：买家帮助中心首页。
- `/kb/[kbSlug]/categories/[categorySlug]`：帮助分类页。
- `/kb/[kbSlug]/docs/[docSlug]`：帮助文章详情。
- `/kb/[kbSlug]/ask`：AI 问答页。
- `/search`：帮助内容搜索。

## 环境变量

```env
RAG_DATABASE_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-REGION.pooler.supabase.com:6543/postgres?sslmode=require"
RAG_DB_POOL_SIZE="5"
RAG_MODEL_PROVIDER="gemini"

GEMINI_API_KEY="your-gemini-api-key"
GEMINI_CHAT_MODEL="gemini-3.5-flash"
GEMINI_EMBEDDING_MODEL="gemini-embedding-2"
GEMINI_EMBEDDING_DIMENSIONS="768"
```

RAG/Gemini 默认值可以不改；需要换模型或连接池大小时再调整。

## 常用命令

```sh
pnpm --filter docs dev
pnpm --filter docs lint
pnpm --filter docs check-types
pnpm --filter docs build
pnpm --filter docs apps
```

本地开发端口：<http://localhost:3002>
