import type { Metadata } from "next";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "sonner";
import "./globals.css";
import SessionProvider from "@/components/providers/SessionProvider";
import { TRPCProvider } from "@/shared/api";

export const metadata: Metadata = {
  title: "Kimono One - 专业和服租赁服务",
  description: "东京、京都专业和服租赁，体验传统日本文化，提供女士、男士、情侣和服套餐",
  keywords: ["和服租赁", "和服体验", "东京和服", "京都和服", "浅草和服", "传统服饰"],
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        {/* Hero 图片 preconnect 优化 - 提升 LCP */}
        <link rel="preconnect" href="https://i0.wp.com" />
        <link rel="dns-prefetch" href="https://i0.wp.com" />
      </head>
      <body className="font-sans antialiased">
        <SessionProvider>
          <NuqsAdapter>
            <TRPCProvider>{children}</TRPCProvider>
          </NuqsAdapter>
        </SessionProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: 'white',
              border: '1px solid var(--wabi-200)',
              color: 'var(--wabi-800)',
              borderRadius: '12px',
              fontFamily: 'var(--font-sans)',
              fontSize: '15px',
              padding: '12px 16px',
              boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.08)',
            },
            classNames: {
              success: '[&>svg]:text-sakura-500',
            },
          }}
        />
      </body>
    </html>
  );
}
