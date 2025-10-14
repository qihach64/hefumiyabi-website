import type { Metadata } from "next";
import { Noto_Sans_SC } from "next/font/google";
import "./globals.css";

const notoSansSC = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-sans-sc",
});

export const metadata: Metadata = {
  title: "江戸和装工房雅 - 专业和服租赁服务",
  description: "东京、京都专业和服租赁，体验传统日本文化，提供女士、男士、情侣和服套餐",
  keywords: ["和服租赁", "和服体验", "东京和服", "京都和服", "浅草和服", "传统服饰"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={`${notoSansSC.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
