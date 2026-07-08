# @wuliuqi/typescript-config

仓库内部共享 TypeScript 配置包，用于统一应用和子包的编译选项。

## 配置文件

- `base.json`：基础严格配置，面向 NodeNext / ES2022，开启 `strict` 和 `noUncheckedIndexedAccess`。
- `nextjs.json`：Next.js 应用配置，继承 `base`，使用 Next 插件、Bundler 解析和 `jsx: preserve`。
- `react-library.json`：React 组件库配置，继承 `base`，使用 `jsx: react-jsx`。

## 使用方式

普通 TypeScript 子包：

```json
{
  "extends": "@wuliuqi/typescript-config/base.json"
}
```

Next.js 应用：

```json
{
  "extends": "@wuliuqi/typescript-config/nextjs.json"
}
```

React 库：

```json
{
  "extends": "@wuliuqi/typescript-config/react-library.json"
}
```

## 注意事项

- 该包只提供配置文件，不包含运行时代码。
- 子包可以在自己的 `tsconfig.json` 中追加 `include`、`exclude` 或覆盖少量编译选项。
- 修改基础配置会影响整个 monorepo，建议同时运行相关包的类型检查。
