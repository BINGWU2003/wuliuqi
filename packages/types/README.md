# @wuliuqi/types

跨包共享类型定义包，集中维护前台、后台、存储、知识库和 RAG 对话中使用的数据结构。

## 类型范围

- 通用 API 响应与分页：`ApiResponse`、`Pagination`。
- 商城账号与轮播：`ShopAccount`、`Carousel`。
- 管理后台：账号、邮箱、属性定义、序号计数器、管理员用户。
- 上传结果：`UploadResult`、`UploadCredential`。
- 知识库：知识库、分类、文章、FAQ、向量块、搜索结果。
- RAG 对话：会话、消息、来源、聊天输入。

## 使用方式

```ts
import type {
  ApiResponse,
  ShopAccount,
  AdminAccount,
  KnowledgeArticle,
} from "@wuliuqi/types";
```

## 常用命令

在仓库根目录执行：

```powershell
pnpm --filter @wuliuqi/types check-types
pnpm --filter @wuliuqi/types lint
```

## 注意事项

- 这里只放结构类型，不放运行时校验逻辑。
- 新增 API 入参校验请放在 `@wuliuqi/validators`。
- 新增数据库访问或业务规则请放在对应 domain / db 包。
