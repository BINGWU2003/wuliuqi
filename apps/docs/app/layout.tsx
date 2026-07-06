import type { Metadata } from "next";
import Script from "next/script";
import { getThemeInitScript } from "@wuliuqi/ui/lib/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: "买家帮助中心",
  description: "账号购买、交付、登录、绑定和售后常见问题。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {getThemeInitScript("wuliuqi-docs-theme")}
        </Script>
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
