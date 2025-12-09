import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI 和服试穿 - 开发版',
  description: 'Virtual Try-On Module Development Demo',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
