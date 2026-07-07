# shop

买家侧 CODM 账号商城前台，提供首页轮播、账号列表、搜索筛选、账号详情和图片预览。

## 主要路由

- `/`：首页、轮播和账号推荐。
- `/account-section`：游戏账号分区入口。
- `/codm-account-page`：CODM 账号列表。
- `/codm-account-info?id=1`：账号详情页。
- `/guide`：购买引导内容。

## 环境变量

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE_NAME?sslmode=require"
DATABASE_POOL_SIZE="5"
DATABASE_POOL_TIMEOUT="20"
```

## 常用命令

```sh
pnpm --filter shop dev
pnpm --filter shop lint
pnpm --filter shop check-types
pnpm --filter shop build
pnpm --filter shop apps
```

本地开发端口：<http://localhost:3000>
