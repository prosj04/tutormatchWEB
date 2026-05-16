import type { Metadata } from "next";

import { AppSessionProvider } from "@/components/providers/AppSessionProvider";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Concord Private Tutoring",
    template: "%s · Concord Private Tutoring",
  },
  description:
    "Private academic guidance for families who expect discretion, rigor, and results.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="preload"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard-dynamic-subset.css"
          as="style"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard-dynamic-subset.css"
        />
      </head>
      <body className="min-h-screen">
        <AppSessionProvider>{children}</AppSessionProvider>
      </body>
    </html>
  );
}
