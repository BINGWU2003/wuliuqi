# @wuliuqi/storage

对象存储包，封装腾讯云 COS 上传、临时上传凭证生成和公开访问 URL 生成。

## 主要能力

- 服务端直传图片到 COS。
- 生成限定单个对象 key 的临时上传凭证，供前端直传。
- 校验图片类型、大小和上传目录。
- 返回统一的上传结果类型。

## 主要导出

```ts
import {
  StorageError,
  createUploadCredential,
  uploadToCos,
} from "@wuliuqi/storage";
```

## 环境变量

必须提供：

```env
COS_SECRET_ID="your-secret-id"
COS_SECRET_KEY="your-secret-key"
COS_BUCKET="your-bucket"
COS_REGION="ap-guangzhou"
```

可选：

```env
COS_PUBLIC_BASE_URL="https://cdn.example.com"
```

如果配置了 `COS_PUBLIC_BASE_URL`，返回 URL 会优先使用该域名；否则使用 COS 默认访问域名。

## 默认限制

- 默认只允许 `image/jpeg`、`image/png`、`image/gif`、`image/webp`。
- 默认最大文件大小为 10MB。
- 临时上传凭证有效期为 900 秒。

## 常用命令

在仓库根目录执行：

```powershell
pnpm --filter @wuliuqi/storage check-types
pnpm --filter @wuliuqi/storage lint
```

## 注意事项

- `folder` 会被规范化为对象 key 前缀，不能包含 `..`。
- 不要提交腾讯云密钥。
- 如需支持非图片文件，调用时显式传入 `allowedTypes` 和 `maxSize`。
