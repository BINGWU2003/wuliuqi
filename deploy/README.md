# Docker / Render 部署说明

本仓库为 `apps` 下三个 Next.js 项目提供同一套 Docker 部署配置：

- `shop`：容器端口 `3000`
- `admin`：容器端口 `3001`
- `docs`：容器端口 `3002`

Gemini 使用 Google 官方接口，只需要配置 `GEMINI_API_KEY`，不要额外配置 Gemini 中转地址。

## Render 部署

仓库根目录提供了 `render.yaml`，用于在 Render 上创建三个独立的 Docker Web Service：

- `wuliuqi-shop`
- `wuliuqi-admin`
- `wuliuqi-docs`

Render 不直接使用本仓库的 `docker-compose.yml`。在 Render 上部署时，每个 Web Service 都会使用同一个 Dockerfile：

```text
docker/Dockerfile.app
```

区别由环境变量决定：

```text
APP_NAME=shop | admin | docs
APP_PORT=10000
PORT=10000
```

Render 会给 Web Service 注入 `PORT` 环境变量，`render.yaml` 里也显式写成 `10000`。Dockerfile 启动时会优先监听 `PORT`，本地 Docker Compose 没有 `PORT` 时才回退到 `APP_PORT`。

### Render Blueprint 流程

1. 把代码推送到 GitHub。
2. 在 Render 控制台选择 `New -> Blueprint`。
3. 选择本仓库，让 Render 读取根目录的 `render.yaml`。
4. 按提示填写 `sync: false` 的环境变量，例如数据库、COS、Gemini API Key。
5. 创建服务后等待 Render 构建和发布。

`render.yaml` 默认使用：

```text
region: singapore
plan: free
autoDeployTrigger: checksPass
```

`free` 计划适合测试，会有休眠和冷启动。正式给用户访问时，建议在 Render 控制台把 `plan` 调整为付费实例。

### Render 需要填写的关键环境变量

`shop`：

```text
DATABASE_URL
```

`admin`：

```text
DATABASE_URL
JWT_SECRET
ADMIN_SESSION_SECRET
COS_SECRET_ID
COS_SECRET_KEY
COS_BUCKET
COS_REGION
COS_PUBLIC_BASE_URL
RAG_DATABASE_URL
GEMINI_API_KEY
```

`docs`：

```text
RAG_DATABASE_URL
GEMINI_API_KEY
```

非敏感默认值已经写在 `render.yaml` 中，例如 `RAG_MODEL_PROVIDER=gemini`、`RAG_DB_POOL_SIZE=5` 和 Gemini 模型名称。

### 手动创建 Render Web Service

如果不使用 Blueprint，也可以手动创建三个 Web Service。每个服务都选择 Docker，并填写：

```text
Dockerfile Path: ./docker/Dockerfile.app
Docker Context: .
```

然后分别配置：

```text
wuliuqi-shop:
  APP_NAME=shop
  APP_PORT=10000
  PORT=10000

wuliuqi-admin:
  APP_NAME=admin
  APP_PORT=10000
  PORT=10000

wuliuqi-docs:
  APP_NAME=docs
  APP_PORT=10000
  PORT=10000
```

其余数据库、COS、Gemini 等环境变量按服务需要填写。

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
