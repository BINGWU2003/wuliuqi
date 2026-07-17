import type { Metadata } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "@wuliuqi/ui/components/sonner";
import { getThemeInitScript } from "@wuliuqi/ui/lib/theme";
import { ShopFrame } from "@/components/shop-frame";
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
  title: "五六七手游店",
  description: "CODM 账号展示、筛选和购买指引",
};

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {getThemeInitScript("wuliuqi-shop-theme")}
        </Script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <ShopFrame>{children}</ShopFrame>
        {modal}
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
