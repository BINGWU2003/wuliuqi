# Docker 部署说明

本仓库为 `apps` 下三个 Next.js 项目提供同一套 Docker 部署配置：

- `shop`：容器端口 `3000`
- `admin`：容器端口 `3001`
- `docs`：容器端口 `3002`

Gemini 使用 Google 官方接口，只需要配置 `GEMINI_API_KEY`，不要额外配置 Gemini 中转地址。

## 部署前准备

首次部署前，需要先对 `DATABASE_URL` 指向的主业务 PostgreSQL 执行 Prisma migration：

```sh
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE_NAME?sslmode=require" pnpm --filter @wuliuqi/db migrate:deploy
```

### 关键环境变量

`DATABASE_URL` 是主业务 PostgreSQL 连接串，例如 Supabase Postgres、Neon 或其他托管 PostgreSQL。使用 Supabase 时，主业务 `DATABASE_URL` 建议使用 session pooler，也就是 pooler host 的 `5432` 端口。

`DATABASE_POOL_SIZE` 是每个 `shop`/`admin` Node 进程的 Prisma 主库连接池大小，默认 `5`。Supabase session pooler 常见上限是 `pool_size: 15`，同时部署 `shop` 和 `admin` 时先保持 `5`，合计约 10 条连接；如果增加副本数，按 `应用数 * 副本数 * DATABASE_POOL_SIZE` 重新下调。

`DATABASE_POOL_TIMEOUT` 是 Prisma 等待空闲连接的秒数，默认 `20`。

`RAG_DATABASE_URL` 是帮助中心/RAG 使用的 PostgreSQL + pgvector 连接串。使用 Supabase 时，RAG 可以使用 transaction pooler，也就是 pooler host 的 `6543` 端口。小规模起步时，`DATABASE_URL` 和 `RAG_DATABASE_URL` 可以指向同一个 Supabase database，但二者端口可以不同。

`shop`：

```text
DATABASE_URL
DATABASE_POOL_SIZE=5
DATABASE_POOL_TIMEOUT=20
```

`admin`：

```text
DATABASE_URL
DATABASE_POOL_SIZE=5
DATABASE_POOL_TIMEOUT=20
JWT_SECRET
COS_SECRET_ID
COS_SECRET_KEY
COS_BUCKET
COS_REGION
RAG_DATABASE_URL
RAG_DB_POOL_SIZE=5
RAG_MODEL_PROVIDER=gemini
GEMINI_API_KEY
GEMINI_CHAT_MODEL=gemini-3.5-flash
GEMINI_EMBEDDING_MODEL=gemini-embedding-2
GEMINI_EMBEDDING_DIMENSIONS=768
```

`docs`：

```text
RAG_DATABASE_URL
RAG_DB_POOL_SIZE=5
RAG_MODEL_PROVIDER=gemini
GEMINI_API_KEY
GEMINI_CHAT_MODEL=gemini-3.5-flash
GEMINI_EMBEDDING_MODEL=gemini-embedding-2
GEMINI_EMBEDDING_DIMENSIONS=768
```

RAG/Gemini 默认值可以直接使用；只有需要换模型或连接池大小时再调整。

`COS_PUBLIC_BASE_URL` 是可选项，只在使用自定义 CDN 或公开访问域名时配置。

## 服务器首次准备

在服务器上安装好 Git、Docker 和 Docker Compose，然后克隆仓库到部署目录：

```sh
cd /srv
git clone <你的仓库地址> wuliuqi
cd /srv/wuliuqi
cp .env.deploy.example .env
vi .env
```

`.env` 用来放运行时环境变量，例如数据库、COS、RAG、Gemini API Key 等。不要把真实 `.env` 提交到仓库。

如果仓库是私有仓库，服务器也需要有拉取 GitHub 代码的权限。推荐给服务器单独配置 GitHub Deploy Key：

```sh
ssh-keygen -t ed25519 -C "wuliuqi-server-deploy" -f ~/.ssh/wuliuqi_github
cat ~/.ssh/wuliuqi_github.pub
```

把输出的公钥添加到 GitHub 仓库的 `Settings -> Deploy keys`，并给读取权限。然后在服务器上配置 SSH remote，确保 `git pull` 可以正常执行。

## 手动部署流程

部署全部三个应用：

```sh
DEPLOY_DIR=/srv/wuliuqi DEPLOY_BRANCH=main sh scripts/deploy.sh all
```

单独部署某个应用：

```sh
sh scripts/deploy.sh shop
sh scripts/deploy.sh admin
sh scripts/deploy.sh docs
```

部署脚本会进入 `DEPLOY_DIR`，拉取 `main` 分支最新代码，然后执行 `docker compose up -d --build` 构建镜像并重启服务。

## 本地构建应用镜像

构建全部三个应用镜像：

```sh
pnpm run apps
```

单独构建某个应用镜像：

```sh
pnpm run apps:shop
pnpm run apps:admin
pnpm run apps:docs
```

## GitHub Actions 部署凭据

GitHub Actions 要远程登录服务器执行部署命令，必须配置服务器访问凭据。不要把用户名、密码或私钥写进仓库，统一放到 GitHub 仓库的 `Settings -> Secrets and variables -> Actions`。

建议配置这些 Secrets：

```text
SERVER_HOST=服务器 IP 或域名
SERVER_PORT=22
SERVER_USER=服务器登录用户，例如 root 或 deploy
SERVER_SSH_KEY=用于登录服务器的 SSH 私钥内容
```

服务器上需要把 `SERVER_SSH_KEY` 对应的公钥加入部署用户的授权列表：

```sh
mkdir -p ~/.ssh
chmod 700 ~/.ssh
vi ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

`authorized_keys` 里放公钥，GitHub Secrets 里的 `SERVER_SSH_KEY` 放私钥。生产环境建议创建单独的 `deploy` 用户，并只授予部署所需权限。

## GitHub Actions 示例

后续接入 CI/CD 时，可以在 GitHub Actions 中用 SSH 登录服务器并执行现有部署脚本：

```yaml
name: Deploy

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Deploy to server
        run: |
          mkdir -p ~/.ssh
          echo "${{ secrets.SERVER_SSH_KEY }}" > ~/.ssh/deploy_key
          chmod 600 ~/.ssh/deploy_key
          ssh -i ~/.ssh/deploy_key \
            -p ${{ secrets.SERVER_PORT }} \
            -o StrictHostKeyChecking=no \
            ${{ secrets.SERVER_USER }}@${{ secrets.SERVER_HOST }} \
            "DEPLOY_DIR=/srv/wuliuqi DEPLOY_BRANCH=main sh /srv/wuliuqi/scripts/deploy.sh all"
```

如果只部署单个应用，把最后的 `all` 改成 `shop`、`admin` 或 `docs`。

## 私有仓库注意事项

上面的 Actions 示例只负责登录服务器并触发部署。因为 `scripts/deploy.sh` 会在服务器上执行 `git pull`，所以服务器本身也必须能访问 GitHub 仓库。

推荐结构：

```text
GitHub Actions 使用 SERVER_SSH_KEY 登录服务器
服务器使用 GitHub Deploy Key 拉取 main 分支
服务器本地执行 docker compose up -d --build
```

也可以改成 GitHub Actions 在 CI 中构建镜像并推送到镜像仓库，服务器只负责拉镜像和重启容器；当前配置先采用服务器本地拉代码并构建的方式，便于起步和排查。
