import type { Metadata } from "next";
import { Playfair_Display } from "next/font/google";

import { AppSessionProvider } from "@/components/providers/AppSessionProvider";

import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

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
      <body className={`min-h-screen ${playfair.variable}`}>
        <AppSessionProvider>{children}</AppSessionProvider>
      </body>
    </html>
  );
}
