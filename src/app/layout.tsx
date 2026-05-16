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
      <body className="min-h-screen">
        <AppSessionProvider>{children}</AppSessionProvider>
      </body>
    </html>
  );
}
