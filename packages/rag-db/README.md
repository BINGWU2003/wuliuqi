# @wuliuqi/rag-db

帮助中心和 RAG 使用的 PostgreSQL 数据库包，负责 Supabase Postgres + pgvector 的 SQL migration、seed 数据，以及知识库数据访问方法。

## 管理内容

- `migrations/`：RAG SQL migration。
- `scripts/migrate.mjs`：按文件名排序执行 `migrations/*.sql`。
- `scripts/seed.mjs`：初始化买家帮助中心知识库和默认分类。
- `src/index.ts`：知识库、文章、FAQ、向量块、RAG 对话的数据访问方法。

当前主要表：

- `knowledge_bases`：知识库。
- `knowledge_categories`：知识分类。
- `knowledge_articles`：知识文章。
- `faq_items`：FAQ。
- `knowledge_chunks`：向量检索块，依赖 pgvector。
- `rag_conversations`：AI 问答会话。
- `rag_messages`：AI 问答消息。

## 环境变量

必须提供：

```env
RAG_DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/postgres?sslmode=require"
```

使用 Supabase 时，运行应用可以使用 Transaction pooler 连接串：

```env
RAG_DATABASE_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-REGION.pooler.supabase.com:6543/postgres?sslmode=require"
```

可选连接池配置：

```env
RAG_DB_POOL_SIZE="5"
```

数据库需要支持：

- `pgcrypto`
- `pgvector`

`001_initial.sql` 会创建 `extensions` schema，并尝试安装 `vector` 和 `pgcrypto` 扩展。

## 常用命令

在仓库根目录执行。

### 执行 SQL migration

```powershell
$env:RAG_DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/postgres?sslmode=require"
pnpm --filter @wuliuqi/rag-db migrate
```

用途：

- 按文件名排序执行 `migrations/*.sql`。
- 会连接真实数据库并修改结构。
- 当前脚本不维护 migration history，每次都会重新执行所有 SQL 文件，所以 migration 应保持幂等。

当前 migration：

- `001_initial.sql`：创建扩展、知识库表、索引和更新时间触发器。
- `002_enable_rls.sql`：为 RAG 相关 public 表开启 Row Level Security。

### 初始化默认知识库

```powershell
$env:RAG_DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/postgres?sslmode=require"
pnpm --filter @wuliuqi/rag-db seed
```

用途：

- 创建或更新默认知识库 `buyer-help`。
- 创建或更新默认分类，如购买前问题、账号交付、登录问题、绑定与换绑、售后规则等。
- 脚本使用 `ON CONFLICT DO UPDATE`，可重复执行。

### 类型检查

```powershell
pnpm --filter @wuliuqi/rag-db check-types
```

用途：

- 检查 `src/index.ts` 和脚本相关 TypeScript 类型。
- 不连接数据库。

### 代码检查

```powershell
pnpm --filter @wuliuqi/rag-db lint
```

用途：

- 执行 ESLint。
- 不连接数据库。

## RLS 说明

Supabase Security Advisor 会检查 `public` schema 中暴露给 PostgREST 的表。`002_enable_rls.sql` 已对 RAG 表开启 RLS：

- `knowledge_bases`
- `knowledge_categories`
- `knowledge_articles`
- `faq_items`
- `knowledge_chunks`
- `rag_conversations`
- `rag_messages`

项目当前通过服务端 `postgres` 客户端访问数据库，没有给 Supabase `anon` 或 `authenticated` 角色添加开放策略。这样可以避免知识库草稿、向量块和对话消息被 Supabase REST API 直接读取，同时不影响服务端数据库连接。

## 注意事项

- 不要提交真实 `.env` 文件。
- 新增 migration 文件时使用递增文件名，例如 `003_xxx.sql`。
- 因为 `migrate` 会重跑所有 SQL，新增 SQL 尽量使用 `IF EXISTS`、`IF NOT EXISTS`、`CREATE OR REPLACE`、`ON CONFLICT` 等幂等写法。
- 修改 embedding 维度时，需要同步调整表结构、索引逻辑和模型配置。
