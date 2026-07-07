# admin

管理端应用，用于维护账号、邮箱、首页轮播、序号计数器和帮助中心知识库。

## 主要路由

- `/login`：管理员登录。
- `/accounts`：账号管理。
- `/emails`：邮箱管理。
- `/carousels/home_ads`：首页轮播管理。
- `/sequence-counters`：序号计数器。
- `/knowledge`：知识库、分类、文章、FAQ 和索引管理。

## 环境变量

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:6543/DATABASE_NAME?sslmode=require&pgbouncer=true"
DATABASE_POOL_SIZE="5"
DATABASE_POOL_TIMEOUT="20"
JWT_SECRET="replace-with-a-strong-secret"

COS_SECRET_ID="your-cos-secret-id"
COS_SECRET_KEY="your-cos-secret-key"
COS_BUCKET="your-bucket"
COS_REGION="ap-guangzhou"
COS_PUBLIC_BASE_URL="https://example.com"

RAG_DATABASE_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-REGION.pooler.supabase.com:6543/postgres?sslmode=require"
RAG_DB_POOL_SIZE="5"
RAG_MODEL_PROVIDER="gemini"

GEMINI_API_KEY="your-gemini-api-key"
GEMINI_CHAT_MODEL="gemini-3.5-flash"
GEMINI_EMBEDDING_MODEL="gemini-embedding-2"
GEMINI_EMBEDDING_DIMENSIONS="768"
```

`COS_PUBLIC_BASE_URL` 只在使用自定义 CDN 或公开访问域名时填写。
RAG/Gemini 默认值可以不改；需要换模型或连接池大小时再调整。

Vercel 部署时将 `DATABASE_POOL_SIZE` 设为 `1`，避免多个 serverless 实例叠加打满 Supabase pooler。

## 常用命令

```sh
pnpm --filter admin dev
pnpm --filter admin lint
pnpm --filter admin check-types
pnpm --filter admin build
pnpm --filter admin apps
```

本地开发端口：<http://localhost:3001>
