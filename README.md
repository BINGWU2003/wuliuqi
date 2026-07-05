# wuliuqi

Next.js + pnpm workspace + Turborepo migration workspace for the wuliuqi shop system.

## Apps

- `apps/shop`: user-facing CODM shop, migrated from `wuliuqi-shop`
- `apps/docs`: template app reserved for the future admin migration

## Packages

- `@wuliuqi/db`: Prisma schema and Prisma Client singleton
- `@wuliuqi/domain`: shared account and carousel business queries
- `@wuliuqi/validators`: zod request validation
- `@wuliuqi/types`: shared API and domain-facing types
- `@wuliuqi/ui`: shared React UI package placeholder
- `@wuliuqi/eslint-config`: shared lint config
- `@wuliuqi/typescript-config`: shared TypeScript config

## Common Commands

```sh
pnpm install
pnpm --filter @wuliuqi/db generate
pnpm --filter shop dev
pnpm --filter shop build
pnpm --filter shop check-types
pnpm --filter shop lint
```

## Environment Variables

`apps/shop` currently needs only one business environment variable for real data:

```env
DATABASE_URL="mysql://USER:PASSWORD@HOST:3306/DATABASE_NAME"
```

For local shop development, create:

```txt
apps/shop/.env.local
```

Example:

```env
DATABASE_URL="mysql://root:123456@localhost:3306/express_demo"
```

Notes:

- Do not commit `.env.local` or any file containing real database credentials.
- The password must be URL-encoded if it contains special characters like `@`, `#`, `:` or `/`.
- The current shop runtime does not need any `NEXT_PUBLIC_*` variables.
- Old Vue/Express variables such as `VITE_APP_API_BASE_URL`, `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, and COS keys are not used by `apps/shop` at this stage.
- The connected MySQL database must contain the existing `codm_accounts` and `carousels` tables for the current shop pages and API routes.

For Prisma CLI commands that connect to the database, pass the same `DATABASE_URL` in the shell or create an uncommitted `packages/db/.env`.
