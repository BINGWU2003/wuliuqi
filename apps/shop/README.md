# shop

User-facing CODM shop migrated from the legacy `wuliuqi-shop` Vue app.

## Routes

- `/`: home carousel, price filters, search, account cards
- `/account-section`: game account section entry
- `/codm-account-page`: CODM account list
- `/codm-account-info?id=1`: account detail and image preview
- `/guide`: CODM guide content

## API Routes

- `GET /api/accounts`
- `GET /api/accounts/[id]`
- `GET /api/carousels/[name]`

## Environment Variables

Create `apps/shop/.env.local` for local development:

```env
DATABASE_URL="mysql://USER:PASSWORD@HOST:3306/DATABASE_NAME"
```

Example:

```env
DATABASE_URL="mysql://root:123456@localhost:3306/express_demo"
```

Only `DATABASE_URL` is required right now. The shop does not currently use `NEXT_PUBLIC_*`, `VITE_APP_API_BASE_URL`, COS keys, or the old Express split database variables.

The database should contain the legacy `codm_accounts` and `carousels` tables.
