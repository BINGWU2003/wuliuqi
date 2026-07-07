# wuliuqi

五六七账号商城 monorepo，基于 Next.js、pnpm workspace 和 Turborepo。当前包含商城前台、管理端，以及买家帮助中心 + Gemini AI 问答。

## 应用

- `apps/shop`：买家访问的 CODM 账号商城前台。
- `apps/admin`：管理端，包含账号、邮箱、轮播、计数器和知识库管理。
- `apps/docs`：公开买家帮助中心，支持文章浏览、FAQ 搜索和 AI 问答。

## 主要包

- `@wuliuqi/db`：PostgreSQL Prisma schema、migration 和 Prisma Client 单例。
- `@wuliuqi/domain`：商城和管理端业务服务。
- `@wuliuqi/auth`：管理端密码校验和 HTTP-only Cookie JWT 会话。
- `@wuliuqi/storage`：服务端腾讯云 COS 上传封装。
- `@wuliuqi/rag-db`：Supabase Postgres + pgvector 的知识库数据访问和 SQL migration。
- `@wuliuqi/rag`：RAG 索引、Gemini chat、Gemini embedding 和回答编排。
- `@wuliuqi/validators`：Zod 请求校验。
- `@wuliuqi/types`：共享 API 和业务类型。
- `@wuliuqi/ui`：共享 shadcn 风格 React UI 组件。
- `@wuliuqi/eslint-config`：共享 ESLint 配置。
- `@wuliuqi/typescript-config`：共享 TypeScript 配置。

## 常用命令

```sh
pnpm install
pnpm --filter @wuliuqi/db generate

pnpm --filter shop dev
pnpm --filter admin dev
pnpm --filter docs dev

pnpm --filter shop build
pnpm --filter admin build
pnpm --filter docs build

pnpm --filter shop check-types
pnpm --filter admin check-types
pnpm --filter docs check-types

pnpm --filter shop lint
pnpm --filter admin lint
pnpm --filter docs lint

pnpm --filter @wuliuqi/rag-db migrate
pnpm --filter @wuliuqi/rag-db seed
```

开发端口：

- `shop`：<http://localhost:3000>
- `admin`：<http://localhost:3001>
- `docs`：<http://localhost:3002>

## 主要路由

### `apps/shop`

- `/`：商城首页、轮播、搜索、筛选和账号卡片。
- `/account-section`：游戏账号分区入口。
- `/codm-account-page`：CODM 账号列表。
- `/codm-account-info?id=1`：账号详情和图片预览。
- `/guide`：CODM 引导内容。

### `apps/admin`

- `/accounts`：账号管理。
- `/emails`：邮箱管理。
- `/carousels/home_ads`：首页轮播管理。
- `/sequence-counters`：序号计数器。
- `/knowledge`：知识库、分类、文章、FAQ 和索引管理。

### `apps/docs`

- `/kb/buyer-help`：买家帮助中心首页。
- `/kb/[kbSlug]/categories/[categorySlug]`：帮助分类页。
- `/kb/[kbSlug]/docs/[docSlug]`：帮助文章详情。
- `/kb/[kbSlug]/ask`：AI 问答页。
- `/search`：帮助内容搜索。

## 环境变量

按应用创建本地 `.env.local` 或 `.env`，只填当前服务需要的变量。

### 主业务 PostgreSQL

`shop` 和 `admin` 都读取 `DATABASE_URL`。

如果主业务库使用 Supabase，推荐填写 **Connection Pooling / Session pooler** 连接串，也就是 pooler host 的 `5432` 端口：

```env
DATABASE_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-REGION.pooler.supabase.com:5432/postgres?sslmode=require"
```

### `apps/shop/.env.local`

商城前台只需要主业务数据库：

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE_NAME?sslmode=require"
```

### RAG 使用 Supabase Postgres

帮助中心使用 Supabase Postgres。`RAG_DATABASE_URL` 填写 Supabase 的 **Database connection string**。

在 Supabase 控制台打开 **Project Settings -> Database -> Connection string**，优先复制 **Connection Pooling / Transaction pooler** 连接串：

```env
RAG_DATABASE_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-REGION.pooler.supabase.com:6543/postgres?sslmode=require"
```

### `apps/admin/.env.local`

管理端需要主业务 PostgreSQL、管理端会话密钥、COS 上传配置，以及用于知识库索引的 RAG/Gemini 配置：

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE_NAME?sslmode=require"
JWT_SECRET="replace-with-a-strong-secret"

COS_SECRET_ID="your-cos-secret-id"
COS_SECRET_KEY="your-cos-secret-key"
COS_BUCKET="your-bucket"
COS_REGION="ap-guangzhou"
# 可选，自定义 CDN 或公开访问域名
COS_PUBLIC_BASE_URL="https://example.com"

RAG_DATABASE_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-REGION.pooler.supabase.com:6543/postgres?sslmode=require"
RAG_DB_POOL_SIZE="5"
RAG_MODEL_PROVIDER="gemini"

GEMINI_API_KEY="your-gemini-api-key"
GEMINI_CHAT_MODEL="gemini-3.5-flash"
GEMINI_EMBEDDING_MODEL="gemini-embedding-2"
GEMINI_EMBEDDING_DIMENSIONS="768"
```

### `apps/docs/.env.local`

帮助中心从 Supabase Postgres 读取已发布内容，并使用 Gemini 提供公开 AI 问答：

```env
RAG_DATABASE_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-REGION.pooler.supabase.com:6543/postgres?sslmode=require"
RAG_DB_POOL_SIZE="5"
RAG_MODEL_PROVIDER="gemini"

GEMINI_API_KEY="your-gemini-api-key"
GEMINI_CHAT_MODEL="gemini-3.5-flash"
GEMINI_EMBEDDING_MODEL="gemini-embedding-2"
GEMINI_EMBEDDING_DIMENSIONS="768"
```

RAG 默认值：

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `RAG_DB_POOL_SIZE` | `5` | RAG PostgreSQL 连接池大小 |
| `RAG_MODEL_PROVIDER` | `gemini` | 当前只支持 Gemini |
| `GEMINI_CHAT_MODEL` | `gemini-3.5-flash` | AI 问答模型 |
| `GEMINI_EMBEDDING_MODEL` | `gemini-embedding-2` | 知识库索引向量模型 |
| `GEMINI_EMBEDDING_DIMENSIONS` | `768` | embedding 维度，需和 RAG 表结构一致 |

## 数据库初始化

主业务数据库由 `@wuliuqi/db` 和 Prisma migration 管理。执行 Prisma CLI 时，在 shell 中提供 PostgreSQL `DATABASE_URL`，或创建未提交的 `packages/db/.env`。

初始化或升级 PostgreSQL 主业务表：

```powershell
$env:DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE_NAME?sslmode=require"
pnpm --filter @wuliuqi/db migrate:deploy
pnpm --filter @wuliuqi/db generate
```

RAG migration 和 seed 脚本读取 shell 中的 `RAG_DATABASE_URL`。PowerShell 示例：

```powershell
$env:RAG_DATABASE_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-REGION.pooler.supabase.com:6543/postgres?sslmode=require"
pnpm --filter @wuliuqi/rag-db migrate
pnpm --filter @wuliuqi/rag-db seed
```

Supabase Postgres 需要支持 `pgvector`，因为 RAG schema 会创建 `vector(768)` embedding 字段和 HNSW cosine 索引。
