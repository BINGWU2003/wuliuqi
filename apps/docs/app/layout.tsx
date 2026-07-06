import type { Metadata } from "next";
import Script from "next/script";
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
          {`
            try {
              var storedTheme = localStorage.getItem("wuliuqi-docs-theme");
              var theme = storedTheme === "light" || storedTheme === "dark"
                ? storedTheme
                : "light";
              document.documentElement.classList.toggle("dark", theme === "dark");
              document.documentElement.dataset.theme = theme;
            } catch (_) {}
          `}
        </Script>
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
