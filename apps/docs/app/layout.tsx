import type { Metadata } from "next";
import { RootProvider } from "fumadocs-ui/provider/next";
import { KnowledgeSearchDialog } from "@/components/knowledge-search-dialog";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "五六七手游店 · 帮助中心",
    template: "%s | 五六七手游店 · 帮助中心",
  },
  description: "账号购买、交付、登录、绑定和售后常见问题。",
};

const translations = {
  "Close Search(search dialog)(aria-label)": "关闭搜索",
  "Close Sidebar(aria-label)": "关闭侧边栏",
  "Close Sidebar(sidebar)(aria-label)": "关闭侧边栏",
  "Collapse Sidebar(sidebar)(aria-label)": "收起侧边栏",
  "Copy Link(accordion)(aria-label)": "复制链接",
  "Dark(theme switcher)(aria-label)": "深色",
  "Hide Sidebar(sidebar)": "隐藏侧边栏",
  "Light(theme switcher)(aria-label)": "浅色",
  "Last updated on(page footer)": "最后更新于",
  "Next Page(pagination)": "下一篇",
  "No Headings(table of contents)": "本文没有目录",
  "No results found(search dialog)": "没有找到结果",
  "On this page(table of contents)": "本文目录",
  "Open Search(search trigger)(aria-label)": "打开搜索",
  "Open Sidebar(sidebar)(aria-label)": "打开侧边栏",
  "Previous Page(pagination)": "上一篇",
  "Search(search dialog)": "搜索帮助内容",
  "Search(search trigger)": "搜索",
  "Show Sidebar(sidebar)": "显示侧边栏",
  "System(theme switcher)(aria-label)": "跟随系统",
  "Toggle Menu(mobile menu)(aria-label)": "切换菜单",
  "Toggle Theme(theme switcher)(aria-label)": "切换主题",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="min-h-screen bg-fd-background text-fd-foreground antialiased">
        <RootProvider
          i18n={{ locale: "zh-CN", translations }}
          search={{ SearchDialog: KnowledgeSearchDialog }}
          theme={{
            attribute: "class",
            defaultTheme: "system",
            enableSystem: true,
            storageKey: "wuliuqi-docs-theme",
          }}
        >
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
