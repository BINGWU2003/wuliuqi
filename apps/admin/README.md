# wuliuqi admin

Next.js admin console for CODM account operations.

## Commands

```sh
pnpm --filter admin dev
pnpm --filter admin build
pnpm --filter admin check-types
pnpm --filter admin lint
```

The dev server runs on <http://localhost:3001>.

## Required Environment Variables

```env
DATABASE_URL="mysql://USER:PASSWORD@HOST:3306/DATABASE_NAME"
JWT_SECRET="replace-with-a-strong-secret"
COS_SECRET_ID="your-cos-secret-id"
COS_SECRET_KEY="your-cos-secret-key"
COS_BUCKET="your-bucket"
COS_REGION="ap-guangzhou"
```

`COS_PUBLIC_BASE_URL` is optional when uploaded files should use a CDN or custom
public base URL.
