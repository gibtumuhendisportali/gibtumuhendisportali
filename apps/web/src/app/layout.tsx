import type { Metadata } from "next";
import { getDictionary } from "@gibtu/shared";
import "./globals.css";

const dict = getDictionary("tr");

export const metadata: Metadata = {
  title: dict.meta.siteTitle,
  description: dict.meta.siteDescription,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className="min-h-screen bg-paper text-ink antialiased">{children}</body>
    </html>
  );
}
