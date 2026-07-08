# @wuliuqi/validators

运行时输入校验包，使用 Zod 统一维护 API 查询参数、请求体和表单数据结构。

## 管理内容

- 账号列表查询、创建、更新和状态变更。
- 邮箱池查询、创建、更新和绑定状态变更。
- 轮播图更新。
- 序号计数器创建和重置。
- CODM 游戏属性定义创建和更新。
- 管理员登录。
- 知识库、分类、文章、FAQ、索引、公开搜索和聊天输入。

## 使用方式

```ts
import {
  accountListQuerySchema,
  adminAccountCreateSchema,
  loginSchema,
} from "@wuliuqi/validators";

const input = adminAccountCreateSchema.parse(await request.json());
```

类型可以直接从 schema 推导后的导出中使用：

```ts
import type { AdminAccountCreateInput } from "@wuliuqi/validators";
```

## 常量

- `ACCOUNT_STATUS`：账号状态枚举值。
- `EMAIL_BIND_STATUS`：邮箱绑定状态枚举值。

## 常用命令

在仓库根目录执行：

```powershell
pnpm --filter @wuliuqi/validators check-types
pnpm --filter @wuliuqi/validators lint
```

## 注意事项

- 这里负责输入形状和基础约束，跨记录、跨表的业务校验应放在 `@wuliuqi/domain`。
- query 参数通常先按字符串接收，再转换为数字或默认值。
- 新增 API 时建议先在这里定义 schema，再让调用方复用推导类型。
