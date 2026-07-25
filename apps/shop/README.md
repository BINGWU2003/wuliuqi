# shop

买家侧 CODM 账号商城前台，提供首页轮播、账号列表、搜索筛选、账号详情和图片预览。

## 主要路由

- `/`：首页、轮播和账号推荐。
- `/account-section`：游戏账号分区入口。
- `/codm-account-page`：CODM 账号列表。
- `/codm-account-info?id=1`：账号详情页。
- `/guide`：购买引导内容。

首页的游戏、价格和排序属于跨游戏通用筛选，会写入 URL，并在进入游戏专区时继续保留。游戏专区可以在通用筛选之外开放专属属性筛选：当前 CODM 仅开放数据覆盖率足够的神话皮肤和传说皮肤数量；三国杀当前在售库存较少，暂不开放专属属性筛选。

## 环境变量

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:6543/DATABASE_NAME?sslmode=require&pgbouncer=true"
DATABASE_POOL_SIZE="5"
DATABASE_POOL_TIMEOUT="20"

NEXT_PUBLIC_POSTHOG_KEY="phc_your_project_token"
POSTHOG_INGEST_HOST="https://your-region-ingest-host"
POSTHOG_ASSET_HOST="https://your-region-assets-host"
```

Vercel 部署时将 `DATABASE_POOL_SIZE` 设为 `1`，避免多个 serverless 实例叠加打满 Supabase pooler。

三个 PostHog 变量必须同时配置才会启用采集。商城通过同域 `/ingest` 代理发送无 Cookie Web Analytics；Host 请按 PostHog 项目所属区域填写。未配置时会静默关闭，不影响商城运行。上线前需在 PostHog 项目中开启 Cookieless server hash mode。

## 常用命令

```sh
pnpm --filter shop dev
pnpm --filter shop lint
pnpm --filter shop test
pnpm --filter shop check-types
pnpm --filter shop build
pnpm --filter shop apps
```

本地开发端口：<http://localhost:3000>
