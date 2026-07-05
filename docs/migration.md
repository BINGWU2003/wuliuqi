# Next.js 重构迁移流程

本文档用于指导 `wuliuqi` 系统从现有 Vue/Express 三项目迁移到 `Next.js + pnpm workspace + Turborepo + shadcn/ui + Prisma` 架构。迁移目标是功能不变，样式允许重做，接口入口按用户端和管理端拆分，核心业务逻辑通过 packages 共享。

## 1. 现状确认

### 目标

确认旧系统功能边界和新仓库当前状态，避免迁移过程中遗漏业务模块。

### 主要任务

- 旧系统项目职责：
  - `wuliuqi-shop`：用户商城端，展示 CODM 账号、账号详情、价格筛选、轮播图。
  - `wuliuqi-shop-backend`：管理端，管理账号、邮箱、轮播图、序号计数器、登录态。
  - `wuliuqi-backend-server`：Express API 服务，连接 MySQL，提供用户、账号、邮箱、轮播图、计数器接口。
- 新仓库当前状态：
  - `apps/web`：Next.js 模板应用，后续迁移/重命名为 `apps/shop`。
  - `apps/docs`：Next.js 模板应用，后续迁移/重命名为 `apps/admin`。
  - `packages/ui`：当前共享 React 组件包，后续改造成 shadcn/ui 共享组件库。
  - `packages/eslint-config`、`packages/typescript-config`：保留为共享工程配置。

### 输出产物

- 完成旧系统页面、接口、数据表、环境变量清单。
- 确认新仓库中保留、重命名、新增的 app/package 名称。

### 验收标准

- 旧系统所有功能模块都有对应迁移目标。
- 明确哪些能力属于用户端，哪些属于管理端，哪些属于共享包。

### 风险点

- 旧前端中存在模板遗留页面和接口，迁移前需要区分真实业务与示例代码。
- 旧 `.env` 中存在数据库和 COS 敏感配置，迁移时不得复制到客户端环境变量。

## 2. 目标架构

### 目标

将系统整理为两个 Next.js app 和多个共享 package，做到接口入口分离、业务逻辑复用。

### 推荐结构

```txt
apps/
  shop/
  admin/
packages/
  ui/
  db/
  domain/
  auth/
  validators/
  types/
  storage/
  config/
```

### 主要任务

- 将 `apps/web` 迁移/重命名为 `apps/shop`。
- 将 `apps/docs` 迁移/重命名为 `apps/admin`。
- 将 `@wuliuqi/ui` 改造成 shadcn/ui 共享组件包。
- 新增共享包：
  - `@wuliuqi/db`：Prisma schema、Prisma Client、数据库连接。
  - `@wuliuqi/domain`：账号、邮箱、轮播图、用户、计数器业务服务。
  - `@wuliuqi/auth`：登录、JWT/cookie、当前用户、鉴权守卫。
  - `@wuliuqi/validators`：zod 请求参数和表单校验。
  - `@wuliuqi/types`：跨 app 共享类型。
  - `@wuliuqi/storage`：COS 上传签名和文件访问封装。
  - `@wuliuqi/config`：共享常量、分页默认值、业务枚举。

### 输出产物

- app 与 package 命名统一。
- workspace 依赖使用 `workspace:*`。
- app 不直接复制业务逻辑，共享逻辑放到 `packages/domain`。

### 验收标准

- `apps/shop` 和 `apps/admin` 可以独立启动。
- 共享包可以被两个 app 正常导入。
- 数据库查询只从服务端代码路径进入，不被客户端组件导入。

### 风险点

- 过早抽象所有组件会增加迁移成本。只抽真正复用的 UI 和业务逻辑。
- Next.js Server Component 与 Client Component 边界需要明确，避免把 Prisma、密钥、服务端逻辑打进客户端。

## 3. Prisma 数据库迁移

### 目标

用 Prisma 替代旧 Express 服务中的 Sequelize，保持现有 MySQL 数据和表结构可平滑迁移。

### 主要任务

- 在 `packages/db` 中初始化 Prisma。
- 使用旧数据库执行反向生成：

```sh
pnpm --filter @wuliuqi/db prisma db pull
pnpm --filter @wuliuqi/db prisma generate
```

- 基于 `db pull` 结果整理 schema：
  - 使用驼峰字段名，并通过 `@map` / `@@map` 保持旧表字段兼容。
  - 保留现有表：`users`、`codm_accounts`、`codm_emails`、`sequence_counters`、`carousels`。
  - 金额字段使用 Prisma `Decimal`，API 返回前统一转换。
  - JSON 字段用于账号图片、轮播图 items。
- 建立 Prisma Client 单例，避免 Next.js 开发环境重复创建连接。
- 初期以现有数据库为准，稳定后再补受控 migration。

### 输出产物

- `packages/db/prisma/schema.prisma`
- `packages/db/src/client.ts`
- `packages/db/src/index.ts`
- 可在服务端使用的 Prisma Client。

### 验收标准

- Prisma 能连接旧 MySQL。
- 所有旧表均可被 Prisma Client 查询。
- 账号、邮箱、用户、轮播图、计数器数据数量与旧系统一致。

### 风险点

- `BigInt`、`Decimal`、`Json` 类型返回给前端前需要序列化。
- 旧数据库字段命名为 snake_case，Prisma 模型推荐 camelCase，必须用 `@map` 保持兼容。
- 不要在迁移初期运行会破坏旧表结构的 `migrate reset` 或强制同步命令。

## 4. 后端接口迁移

### 目标

用 Next.js Route Handlers 替代 Express 路由。用户端和管理端拥有各自 BFF 接口，但共享业务服务。

### 主要任务

- `apps/shop/app/api/*` 只暴露用户端公开接口：
  - `GET /api/accounts`
  - `GET /api/accounts/[id]`
  - `GET /api/carousels/[name]`
- `apps/admin/app/api/*` 暴露管理接口：
  - `POST /api/auth/login`
  - `POST /api/auth/logout`
  - `GET /api/auth/me`
  - `GET /api/accounts`
  - `POST /api/accounts`
  - `GET /api/accounts/[id]`
  - `PATCH /api/accounts/[id]`
  - `DELETE /api/accounts/[id]`
  - `PATCH /api/accounts/[id]/status`
  - `GET /api/emails`
  - `POST /api/emails`
  - `PATCH /api/emails/[id]`
  - `DELETE /api/emails/[id]`
  - `PATCH /api/emails/[id]/bind-status`
  - `GET /api/carousels/[name]`
  - `PATCH /api/carousels/[name]`
  - `GET /api/sequence-counters`
  - `POST /api/sequence-counters`
- 请求校验统一使用 `@wuliuqi/validators`。
- 业务逻辑统一调用 `@wuliuqi/domain`，不要在 route handler 中直接写复杂查询。
- API 返回结构统一：

```ts
type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } }
```

### 输出产物

- shop BFF route handlers。
- admin BFF route handlers。
- 共享 domain service。
- 统一 API response helper。

### 验收标准

- 用户端公开接口不要求登录。
- 管理端接口全部要求鉴权，登录接口除外。
- 旧系统主要接口行为在新系统中都有等价实现。

### 风险点

- 不要把两个 app 的后端实现完全复制两份；接口入口可以分开，业务查询必须共享。
- 管理端接口需要比旧系统更严格，避免用户 CRUD 等管理接口裸露。

## 5. 鉴权迁移

### 目标

管理端使用 Next.js 友好的 HTTP-only cookie/JWT 鉴权，减少前端直接持有 token 的风险。

### 主要任务

- 登录成功后由 `apps/admin/app/api/auth/login/route.ts` 写入 HTTP-only cookie。
- `@wuliuqi/auth` 提供：
  - `hashPassword`
  - `verifyPassword`
  - `signSessionToken`
  - `verifySessionToken`
  - `getCurrentUser`
  - `requireAdmin`
- `apps/admin/middleware.ts` 保护后台页面和后台 API。
- 用户端 `apps/shop` 暂不强制登录；如后续需要用户体系，再单独设计。

### 输出产物

- 管理端登录、退出、当前用户接口。
- 管理端页面和 API 鉴权保护。
- 密码哈希和 JWT/cookie 工具。

### 验收标准

- 未登录访问管理页跳转登录页。
- 未登录访问管理 API 返回 401。
- 登录后刷新页面仍能保持会话。
- 退出后 cookie 清除，管理接口不可访问。

### 风险点

- cookie 配置需区分本地和生产环境的 `secure`、`sameSite`、`domain`。
- JWT secret 必须来自服务端环境变量，不能暴露给客户端。

## 6. 前端迁移

### 目标

在功能不变的前提下，用 Next.js 和 shadcn/ui 重做用户端和管理端界面。

### 主要任务

- 优先迁移管理端，再迁移用户端：
  1. 登录页和管理布局。
  2. 账号管理列表、筛选、上下架、删除。
  3. 账号新增/编辑表单，包含图片、价格、标题、描述、闲鱼链接、邮箱。
  4. 邮箱管理和邮箱选择。
  5. 轮播图管理。
  6. 序号计数器管理。
  7. 用户端首页、账号列表、价格筛选、账号详情、轮播图。
- shadcn/ui 基础组件放在 `packages/ui`：
  - button
  - input
  - dialog
  - dropdown-menu
  - table
  - form
  - select
  - tabs
  - sheet
  - toast
- 只在真实复用时抽业务组件：
  - 商品卡片
  - 图片预览
  - 价格筛选
  - 分页控件
  - 上传控件

### 输出产物

- `apps/admin` 完整管理端。
- `apps/shop` 完整用户端。
- `packages/ui` shadcn/ui 组件库。

### 验收标准

- 管理端所有旧功能可完成同等操作。
- 用户端可完成浏览、筛选、查看详情、跳转闲鱼。
- 移动端和桌面端布局不出现明显遮挡、溢出和错位。

### 风险点

- shadcn/ui 更适合后台，用户端商城需要单独设计移动端体验。
- 图片预览、上传、移动端筛选交互不要简单照搬旧 Vant 组件行为。

## 7. COS 和上传迁移

### 目标

移除前端环境变量中的 COS 密钥，改为服务端生成上传签名或代理上传。

### 主要任务

- 在 `@wuliuqi/storage` 中封装 COS 配置和签名逻辑。
- 管理端新增上传签名接口，例如 `POST /api/uploads/signature`。
- 前端上传组件只接收临时签名、bucket、region、key、url。
- 限制上传文件类型、大小、路径前缀。

### 输出产物

- 服务端 COS 签名模块。
- 管理端上传接口。
- 管理端图片上传组件。

### 验收标准

- 客户端 bundle 和浏览器环境变量中不包含 COS secret。
- 图片上传后可被账号和轮播图正常使用。
- 非法文件类型和超大文件被拒绝。

### 风险点

- 旧图片 URL 需要继续兼容。
- 上传路径命名要稳定，避免覆盖已有资源。

## 8. 测试与验收

### 目标

通过接口、页面和数据对账确认新系统功能等价。

### 主要任务

- 接口测试：
  - 账号列表分页、搜索、状态筛选、价格筛选。
  - 账号详情。
  - 账号创建、编辑、删除、上下架。
  - 邮箱创建、编辑、删除、绑定状态。
  - 轮播图读取和更新。
  - 登录、退出、当前用户。
- 页面测试：
  - 管理端登录保护。
  - 管理端账号和邮箱完整 CRUD。
  - 用户端浏览、筛选、详情、图片预览。
  - 移动端和桌面端响应式。
- 数据对账：
  - Prisma 查询数量与旧系统一致。
  - 关键记录抽样对比字段值。
  - JSON 图片、轮播图 items 可正常解析。

### 输出产物

- 接口验收清单。
- 页面验收清单。
- 数据对账记录。

### 验收标准

- 新系统功能覆盖旧系统真实业务功能。
- 管理端无未鉴权的管理接口。
- 用户端公开接口不暴露管理字段或敏感字段。
- 构建、类型检查、lint 全部通过。

### 风险点

- 旧系统存在部分未鉴权接口，新系统迁移时不能照搬安全缺陷。
- Decimal、BigInt 序列化错误可能导致页面渲染失败。

## 9. 切换与回滚

### 目标

在不破坏现有数据的前提下完成新旧系统切换，并保留回滚路径。

### 主要任务

- 新系统先连接同一只读备份库验证查询。
- 管理端写操作上线前，在测试库完整验证 CRUD。
- 切换前冻结旧管理端写操作或短时间维护窗口。
- 切换步骤：
  1. 备份生产数据库。
  2. 部署新 `apps/admin` 和 `apps/shop`。
  3. 配置生产环境变量。
  4. 执行 smoke test。
  5. 将流量切到新系统。
  6. 旧系统保留只读观察期。
- 回滚策略：
  - 保留旧 Express/Vue 部署。
  - 若新系统出现阻断问题，切回旧系统域名或反向代理。
  - 数据库 schema 未确认前不做破坏性 migration。

### 输出产物

- 发布检查清单。
- 数据库备份。
- 回滚操作说明。

### 验收标准

- 新系统上线后核心流程可用。
- 旧系统可在观察期内快速恢复。
- 没有客户端可见的密钥泄露。

### 风险点

- 如果新旧系统同时写同一数据库，可能产生行为不一致。切换期应避免双写。
- 生产环境变量必须和本地 `.env` 分离管理。

## 10. 推荐迁移顺序

1. 清理新仓库模板命名，确定 `shop/admin` app。
2. 建立 `packages/db`，用 Prisma 反向生成旧数据库 schema。
3. 建立 `packages/domain`，迁移账号、邮箱、轮播图、用户、计数器业务逻辑。
4. 建立 `packages/auth`，完成管理端 cookie/JWT 鉴权。
5. 建立 `packages/validators`，统一 zod 校验。
6. 改造 `packages/ui` 为 shadcn/ui 共享组件库。
7. 迁移 `apps/admin` 登录和布局。
8. 迁移 `apps/admin` 账号、邮箱、轮播图、计数器功能。
9. 建立 `packages/storage`，迁移 COS 上传签名。
10. 迁移 `apps/shop` 首页、列表、详情、轮播图。
11. 完成接口和数据对账。
12. 部署测试环境，完成端到端验收。
13. 生产切换，旧系统进入只读观察期。
14. 观察期结束后归档旧 Vue/Express 项目。

## 11. 完成标准

- `apps/shop` 和 `apps/admin` 均可独立构建和运行。
- 所有数据库访问都通过 Prisma 和共享 domain service。
- 管理端接口全部受鉴权保护。
- COS 密钥只存在服务端环境变量。
- 旧系统核心功能在新系统中全部可用。
- 新系统通过类型检查、lint、构建和人工验收。
