# @wuliuqi/eslint-config

仓库内部共享 ESLint 配置包，供应用和子包统一使用 flat config。

## 配置入口

- `@wuliuqi/eslint-config/base`：基础 TypeScript / Turbo / Prettier 配置。
- `@wuliuqi/eslint-config/next-js`：Next.js 应用配置，包含 Next 推荐规则和 React Hooks。
- `@wuliuqi/eslint-config/react-internal`：React 组件库配置，适合 `packages/ui` 这类内部库。

## 使用方式

在子包的 `eslint.config.mjs` 中按需引入：

```js
import { config } from "@wuliuqi/eslint-config/base";

export default config;
```

Next.js 应用：

```js
import { nextJsConfig } from "@wuliuqi/eslint-config/next-js";

export default nextJsConfig;
```

React 内部组件库：

```js
import { config } from "@wuliuqi/eslint-config/react-internal";

export default config;
```

## 注意事项

- 当前配置使用 ESLint flat config。
- `base` 默认忽略 `dist/**`。
- `turbo/no-undeclared-env-vars` 目前设置为 warning，方便逐步收敛环境变量声明。
