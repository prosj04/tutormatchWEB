import type { Metadata } from "next";

import { AppSessionProvider } from "@/components/providers/AppSessionProvider";
import { FontLoader } from "@/components/providers/FontLoader";

import "./globals.css";

const FONT_HREF =
  "https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard-dynamic-subset.css";

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
        {/* Warm up the CDN connection before the font CSS is requested */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        {/* Preload hint so the browser queues the download as soon as possible */}
        <link rel="preload" href={FONT_HREF} as="style" />
        {/* Fallback for JS-disabled environments */}
        <noscript>
          <link rel="stylesheet" href={FONT_HREF} />
        </noscript>
      </head>
      <body className="min-h-screen">
        <AppSessionProvider>
          {/* Injects the font stylesheet after first render — non-blocking */}
          <FontLoader />
          {children}
        </AppSessionProvider>
      </body>
    </html>
  );
}
