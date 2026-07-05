# wuliuqi

Next.js + pnpm workspace + Turborepo migration workspace for the wuliuqi shop system.

## Apps

- `apps/shop`: user-facing CODM shop, migrated from `wuliuqi-shop`
- `apps/admin`: admin console migrated from `wuliuqi-shop-backend`

## Packages

- `@wuliuqi/db`: Prisma schema and Prisma Client singleton
- `@wuliuqi/domain`: shared shop/admin account, email, carousel, and counter services
- `@wuliuqi/auth`: admin password verification and HTTP-only cookie JWT sessions
- `@wuliuqi/storage`: server-side COS upload wrapper
- `@wuliuqi/validators`: zod request validation
- `@wuliuqi/types`: shared API and domain-facing types
- `@wuliuqi/ui`: shared shadcn-style React UI components
- `@wuliuqi/eslint-config`: shared lint config
- `@wuliuqi/typescript-config`: shared TypeScript config

## Common Commands

```sh
pnpm install
pnpm --filter @wuliuqi/db generate
pnpm --filter shop dev
pnpm --filter admin dev
pnpm --filter shop build
pnpm --filter admin build
pnpm --filter shop check-types
pnpm --filter admin check-types
pnpm --filter shop lint
pnpm --filter admin lint
```

## Environment Variables

`apps/shop` needs `DATABASE_URL` for real data. `apps/admin` also needs
admin session and COS server-side upload variables:

```env
DATABASE_URL="mysql://USER:PASSWORD@HOST:3306/DATABASE_NAME"
JWT_SECRET="replace-with-a-strong-secret"
COS_SECRET_ID="your-cos-secret-id"
COS_SECRET_KEY="your-cos-secret-key"
COS_BUCKET="your-bucket"
COS_REGION="ap-guangzhou"
# Optional custom CDN/base URL:
COS_PUBLIC_BASE_URL="https://example.com"
```

For local development, create uncommitted `.env.local` files in the app that
needs them:

```txt
apps/shop/.env.local
apps/admin/.env.local
```

Example:

```env
DATABASE_URL="mysql://root:123456@localhost:3306/express_demo"
JWT_SECRET="local-dev-secret"
```

Notes:

- Do not commit `.env.local` or any file containing real database credentials.
- The password must be URL-encoded if it contains special characters like `@`, `#`, `:` or `/`.
- Neither app needs `NEXT_PUBLIC_*` variables for the migrated business flows.
- Old Vue/Express variables such as `VITE_APP_API_BASE_URL`, `DB_HOST`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` are not used by the new apps.
- COS keys are server-only and must not be exposed to client bundles.
- The connected MySQL database must contain the existing `users`, `codm_accounts`, `codm_emails`, `sequence_counters`, and `carousels` tables.

For Prisma CLI commands that connect to the database, pass the same `DATABASE_URL` in the shell or create an uncommitted `packages/db/.env`.
