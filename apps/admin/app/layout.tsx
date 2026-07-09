import type { Metadata } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { Toaster } from "@wuliuqi/ui/components/sonner";
import { TooltipProvider } from "@wuliuqi/ui/components/tooltip";
import { getThemeInitScript } from "@wuliuqi/ui/lib/theme";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "五六七管理端",
  description: "CODM 账号、邮箱、轮播图和计数器运营管理",
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
          {getThemeInitScript("wuliuqi-admin-theme")}
        </Script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <AntdRegistry>
          <TooltipProvider delayDuration={300} skipDelayDuration={100}>
            {children}
          </TooltipProvider>
        </AntdRegistry>
        <Toaster />
      </body>
    </html>
  );
}
