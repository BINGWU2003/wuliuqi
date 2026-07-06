FROM node:24-alpine AS builder

RUN apk add --no-cache libc6-compat openssl
RUN corepack enable && corepack prepare pnpm@10.34.4 --activate

WORKDIR /app

ARG APP_NAME
ARG APP_PORT

ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/admin/package.json apps/admin/package.json
COPY apps/docs/package.json apps/docs/package.json
COPY apps/shop/package.json apps/shop/package.json
COPY packages/auth/package.json packages/auth/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/domain/package.json packages/domain/package.json
COPY packages/eslint-config/package.json packages/eslint-config/package.json
COPY packages/rag/package.json packages/rag/package.json
COPY packages/rag-db/package.json packages/rag-db/package.json
COPY packages/storage/package.json packages/storage/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/typescript-config/package.json packages/typescript-config/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY packages/utils/package.json packages/utils/package.json
COPY packages/validators/package.json packages/validators/package.json
COPY packages/db/prisma packages/db/prisma

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm --filter @wuliuqi/db generate
RUN pnpm --filter ${APP_NAME} build

FROM node:24-alpine AS runner

RUN apk add --no-cache libc6-compat openssl
RUN corepack enable && corepack prepare pnpm@10.34.4 --activate

WORKDIR /app

ARG APP_NAME
ARG APP_PORT

ENV APP_NAME=${APP_NAME}
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=${APP_PORT}

COPY --from=builder /app /app

EXPOSE ${APP_PORT}

CMD ["sh", "-c", "pnpm --filter ${APP_NAME} start"]
