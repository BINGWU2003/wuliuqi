# @wuliuqi/db

主业务 PostgreSQL 数据库包，负责 Prisma schema、Prisma migration、Prisma Client 单例，以及少量数据库维护脚本。

## 管理内容

- `prisma/schema.prisma`：主业务库 Prisma schema。
- `prisma/migrations/`：主业务库迁移文件。
- `src/client.ts`：运行时 Prisma Client 单例，会根据环境变量补充连接池参数。
- `scripts/reconcile-email-bind-status.mjs`：邮箱绑定状态巡检和修复脚本。

当前主要表：

- `codm_accounts`：CODM 账号。
- `codm_emails`：邮箱池。
- `carousels`：轮播配置。
- `sequence_counters`：序号计数器。
- `users`：管理端用户。

## 环境变量

必须提供：

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/postgres?sslmode=require"
```

运行应用时，如果使用 Supabase，推荐使用 Transaction pooler 连接串，也就是 `6543` 端口：

```env
DATABASE_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-REGION.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true"
```

执行 Prisma migration 时，如果 pooler 报 `Schema engine error`，改用 direct connection，也就是 `db.PROJECT_REF.supabase.co:5432`：

```env
DATABASE_URL="postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres?sslmode=require"
```

可选连接池配置：

```env
DATABASE_POOL_SIZE="5"
DATABASE_POOL_TIMEOUT="20"
```

数据库维护脚本会按顺序尝试读取仓库根目录 `.env` 和 `apps/admin/.env`，但优先使用当前 shell 中已经存在的环境变量。

## 常用命令

在仓库根目录执行。

### 生成 Prisma Client

```powershell
pnpm --filter @wuliuqi/db generate
```

用途：

- 根据 `prisma/schema.prisma` 生成 `@prisma/client`。
- `pnpm install` 后根项目的 `postinstall` 会自动执行一次。
- 修改 Prisma schema 后建议手动执行。

### 开发迁移

```powershell
$env:DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/postgres?sslmode=require"
pnpm --filter @wuliuqi/db migrate:dev
```

用途：

- 本地或开发库生成并应用新的 Prisma migration。
- 会连接真实数据库，不要直接对生产库使用。

### 生产/远程库迁移

```powershell
$env:DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/postgres?sslmode=require"
pnpm --filter @wuliuqi/db migrate:deploy
```

用途：

- 应用 `prisma/migrations/` 中尚未执行的 migration。
- 适合生产、预发和远程开发库。
- 不会自动生成新的 migration。

### 拉取数据库结构

```powershell
$env:DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/postgres?sslmode=require"
pnpm --filter @wuliuqi/db db:pull
```

用途：

- 从数据库反向同步 schema 到 `prisma/schema.prisma`。
- 谨慎使用，可能覆盖手写的 Prisma schema 结构和命名。

### 直接调用 Prisma CLI

```powershell
pnpm --filter @wuliuqi/db prisma validate
```

用途：

- 调试 Prisma CLI。
- 示例：`pnpm --filter @wuliuqi/db prisma migrate status`。

### 类型检查

```powershell
pnpm --filter @wuliuqi/db check-types
```

用途：

- 检查 `src/` 中的 TypeScript 类型。
- 不主动修改数据库。

### 代码检查

```powershell
pnpm --filter @wuliuqi/db lint
```

用途：

- 执行 ESLint。
- 不主动修改数据库。

### 邮箱绑定状态巡检

```powershell
pnpm --filter @wuliuqi/db fix:email-bind-status
```

用途：

- dry-run，不修改数据库。
- 检查 `codm_emails.bind_status` 是否和未出售账号绑定关系一致。
- 报告缺失邮箱记录、重复邮箱行、多个未出售账号共用同一邮箱。

### 邮箱绑定状态修复

```powershell
pnpm --filter @wuliuqi/db fix:email-bind-status -- --write
```

用途：

- 修改数据库。
- 只修复 `codm_emails.bind_status` 不一致的记录。
- 不会自动删除重复邮箱，也不会自动补齐缺失邮箱记录。

## RLS 说明

Supabase Security Advisor 会检查 `public` schema 中暴露给 PostgREST 的表。当前 migration 已对主业务表开启 RLS：

- `codm_accounts`
- `codm_emails`
- `carousels`
- `sequence_counters`
- `users`
- `_prisma_migrations`

项目当前通过服务端 Prisma 访问数据库，没有给 Supabase `anon` 或 `authenticated` 角色添加开放策略。这样可以避免表被 Supabase REST API 直接读取，同时不影响服务端数据库连接。

## 注意事项

- 不要提交真实 `.env` 文件。
- 修改 schema 后先生成 migration，再执行 `generate`。
- 生产迁移优先使用 direct connection，应用运行时再使用 pooler。
- `fix:email-bind-status -- --write` 执行前建议先跑 dry-run 看输出。
