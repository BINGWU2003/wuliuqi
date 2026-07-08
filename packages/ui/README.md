# @wuliuqi/ui

内部 React UI 组件库，沉淀管理端和前台可复用的基础组件、主题工具和样式合并工具。

## 管理内容

- 基础组件：button、card、code。
- Radix / Base UI 封装组件：dialog、alert-dialog、select、tabs、tooltip、scroll-area 等。
- 反馈和状态组件：sonner、spinner、skeleton、alert。
- 主题工具：浅色/深色主题读取、切换、持久化和初始化脚本。
- 样式工具：`cn` 合并 `clsx` 与 `tailwind-merge`。

## 使用方式

按导出路径引入组件：

```tsx
import { Button } from "@wuliuqi/ui/components/button";
import { Card, CardContent } from "@wuliuqi/ui/components/card";
import { cn } from "@wuliuqi/ui/lib/utils";
```

兼容的历史入口：

```tsx
import { Button } from "@wuliuqi/ui/button";
import { Card } from "@wuliuqi/ui/card";
```

## 常用命令

在仓库根目录执行：

```powershell
pnpm --filter @wuliuqi/ui check-types
pnpm --filter @wuliuqi/ui lint
pnpm --filter @wuliuqi/ui generate:component
```

## 注意事项

- 该包依赖 React、Radix UI、Base UI、lucide-react、sonner 和 Tailwind 相关工具。
- 新增组件时优先放在 `src/components/`，并在 `package.json` 的 `exports` 中确认可被外部引入。
- 组件应保持展示逻辑为主，业务数据获取和业务规则留在应用层或 domain 包。
