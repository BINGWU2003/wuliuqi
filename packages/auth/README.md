# @wuliuqi/auth

管理端认证包，负责管理员登录、密码校验、会话 JWT 签发和当前用户解析。

## 主要能力

- 使用 `bcryptjs` 生成和校验密码哈希。
- 使用 `jose` 签发和验证管理端 session token。
- 通过 `@wuliuqi/db` 查询管理员用户。
- 对外提供统一的 `AuthError`，便于 API 层转换错误响应。

## 主要导出

```ts
import {
  ADMIN_SESSION_COOKIE,
  AuthError,
  getCurrentUser,
  hashPassword,
  loginWithPassword,
  requireAdmin,
  signSessionToken,
  verifyPassword,
  verifySessionToken,
} from "@wuliuqi/auth";
```

也可以按需读取常量：

```ts
import { SESSION_MAX_AGE_SECONDS } from "@wuliuqi/auth/constants";
```

## 环境变量

生产环境必须提供：

```env
JWT_SECRET="your-session-secret"
```

也兼容 `ADMIN_SESSION_SECRET`。开发环境如果没有配置 secret，会使用本地默认值，方便本地调试。

## 常用命令

在仓库根目录执行：

```powershell
pnpm --filter @wuliuqi/auth check-types
pnpm --filter @wuliuqi/auth lint
```

## 注意事项

- `loginWithPassword` 会直接访问主业务数据库的 `users` 表。
- `requireAdmin` 适合服务端 API 或页面加载阶段使用，未登录时会抛出 `AuthError`。
- 不要把生产环境的 `JWT_SECRET` 提交到仓库。
