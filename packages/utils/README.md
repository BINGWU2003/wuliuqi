# @wuliuqi/utils

通用工具函数包，放置跨应用可复用但不属于业务域服务的轻量工具。

## 当前工具

- `browser/image-compress`：浏览器端图片压缩，默认跳过 GIF 和非图片文件。
- `browser/image-download`：浏览器端图片加水印并下载。
- `codm-attributes`：从 CODM 账号标题或描述中解析神话、传说皮肤数量。

## 使用方式

```ts
import { compressImageFile } from "@wuliuqi/utils/browser/image-compress";
import { downloadImageWithWatermark } from "@wuliuqi/utils/browser/image-download";
import { parseCodmSkinAttributes } from "@wuliuqi/utils/codm-attributes";
```

## 常用命令

在仓库根目录执行：

```powershell
pnpm --filter @wuliuqi/utils check-types
pnpm --filter @wuliuqi/utils lint
```

## 注意事项

- `browser/*` 工具依赖浏览器 API，不应在纯服务端运行时直接调用。
- 图片压缩失败时会返回原文件，避免阻塞上传流程。
- 新增工具时尽量保持无状态、少依赖，并在 `package.json` 的 `exports` 中暴露明确路径。
