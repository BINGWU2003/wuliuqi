# wuliuqi

五六七账号商城 monorepo，基于 Next.js、pnpm workspace 和 Turborepo。当前包含商城前台、管理端，以及买家帮助中心 + Gemini AI 问答。

## 应用

- `apps/shop`：买家访问的 CODM 账号商城前台。
- `apps/admin`：管理端，包含账号、邮箱、轮播、计数器和知识库管理。
- `apps/docs`：公开买家帮助中心，支持文章浏览、FAQ 搜索和 AI 问答。

## 主要包

- `@wuliuqi/db`：MySQL Prisma schema 和 Prisma Client 单例。
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

不要提交真实 `.env.local` 或任何包含密钥的文件。按下面模板在本地创建并填充。

### `apps/shop/.env.local`

商城前台只需要现有 MySQL 数据库：

```env
DATABASE_URL="mysql://USER:PASSWORD@HOST:3306/DATABASE_NAME"
```

### RAG 使用 Supabase Postgres

帮助中心使用 Supabase 作为托管 Postgres，但当前服务端 RAG 实现是直接连接 Postgres。`RAG_DATABASE_URL` 要填写 Supabase 的 **Database connection string**，不是 Supabase 的公开 API key。

在 Supabase 控制台打开 **Project Settings -> Database -> Connection string**，优先复制 **Connection Pooling / Transaction pooler** 连接串：

```env
RAG_DATABASE_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-REGION.pooler.supabase.com:6543/postgres?sslmode=require"
```

不推荐本地开发使用 `db.PROJECT_REF.supabase.co:5432` 的 direct connection。它在很多网络环境下会解析到 IPv6，可能出现 `connect EACCES ...:5432` 或连接超时。

下面两个 Supabase API 变量当前 MVP 不需要，除非后续接入 Supabase Auth、Storage、Realtime 或浏览器端 Supabase client：

```env
# 当前 RAG 实现不需要
NEXT_PUBLIC_SUPABASE_URL="https://PROJECT_REF.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="your-publishable-key"
```

不要把 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` 当成 `RAG_DATABASE_URL` 使用。它不是数据库密码，不能执行 pgvector SQL 查询。

### `apps/admin/.env.local`

管理端需要 MySQL、管理端会话密钥、COS 上传配置，以及用于知识库索引的 RAG/Gemini 配置：

```env
DATABASE_URL="mysql://USER:PASSWORD@HOST:3306/DATABASE_NAME"
JWT_SECRET="replace-with-a-strong-secret"
# 可选，@wuliuqi/auth 也会读取这个名字：
ADMIN_SESSION_SECRET="replace-with-a-strong-secret"

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

## 数据库初始化

MySQL 由 `@wuliuqi/db` 和现有 Prisma schema 管理。执行 Prisma CLI 时，在 shell 中提供 `DATABASE_URL`，或创建未提交的 `packages/db/.env`。

RAG migration 和 seed 脚本读取 shell 中的 `RAG_DATABASE_URL`。PowerShell 示例：

```powershell
$env:RAG_DATABASE_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-REGION.pooler.supabase.com:6543/postgres?sslmode=require"
pnpm --filter @wuliuqi/rag-db migrate
pnpm --filter @wuliuqi/rag-db seed
```

Supabase Postgres 需要支持 `pgvector`，因为 RAG schema 会创建 `vector(768)` embedding 字段和 HNSW cosine 索引。

## 注意事项

- 不要提交 `.env.local` 或任何真实数据库凭据。
- 如果数据库密码包含 `@`、`#`、`:`、`/` 等特殊字符，需要 URL encode。
- 当前业务流程不需要 `NEXT_PUBLIC_*` 变量。
- 旧 Vue/Express 变量如 `VITE_APP_API_BASE_URL`、`DB_HOST`、`DB_USER`、`DB_PASSWORD`、`DB_NAME` 已不再使用。
- COS 密钥只允许服务端使用，不能暴露到客户端 bundle。
- MySQL 需要包含现有的 `users`、`codm_accounts`、`codm_emails`、`sequence_counters`、`carousels` 表。
- `RAG_DATABASE_URL` 指向 Supabase Postgres，不是现有 MySQL，也不是 Supabase 公开 API URL。
- `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` 只有在后续使用 Supabase 浏览器端/API 功能时才需要。
- Gemini key 是服务端密钥，不能以 `NEXT_PUBLIC_*` 暴露。
