# @wuliuqi/domain

业务域服务包，封装商城前台和管理后台共用的业务规则。API 路由和页面应优先调用这里的函数，而不是直接拼接数据库读写逻辑。

## 管理内容

- 前台账号查询：账号列表、账号详情。
- 前台轮播查询：按名称读取轮播配置。
- 后台账号管理：创建、更新、上下架、删除、统计。
- 后台邮箱池管理：邮箱创建、查询、绑定状态校验与维护。
- 游戏属性管理：CODM 账号属性定义、选项、排序、启停和清理。
- 序号计数器：账号编号等递增序号的读取和重置。
- 数据序列化：将 Prisma 记录转换为 `@wuliuqi/types` 中的稳定结构。

## 主要导出

```ts
import {
  DomainError,
  getCarouselByName,
  getShopAccountById,
  listShopAccounts,
  listAdminAccounts,
} from "@wuliuqi/domain";
```

更多后台函数从包根入口导出，类型入参主要来自 `@wuliuqi/validators`。

## 依赖关系

- `@wuliuqi/db`：访问主业务 PostgreSQL / Prisma。
- `@wuliuqi/types`：复用跨端数据类型。
- `@wuliuqi/validators`：复用 API 输入结构类型。

## 常用命令

在仓库根目录执行：

```powershell
pnpm --filter @wuliuqi/domain check-types
pnpm --filter @wuliuqi/domain lint
pnpm --filter @wuliuqi/domain test
```

## 注意事项

- 涉及写操作的函数会在包内处理必要的事务和业务校验。
- 账号、邮箱、属性之间存在绑定状态联动，新增功能时优先复用已有 domain 函数。
- 对外错误统一使用 `DomainError`，调用方可根据 `code` 和 `status` 生成响应。
