import type { Metadata } from "next";
import localFont from "next/font/local";

import "./globals.css";
import "./landing-v2.css";

const pretendard = localFont({
  src: [
    {
      path: "../../public/fonts/Pretendard-Regular.subset.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/Pretendard-Medium.subset.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/Pretendard-SemiBold.subset.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/fonts/Pretendard-Bold.subset.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/fonts/Pretendard-ExtraBold.subset.woff2",
      weight: "800",
      style: "normal",
    },
    {
      path: "../../public/fonts/Pretendard-Black.subset.woff2",
      weight: "900",
      style: "normal",
    },
  ],
  display: "swap",
  variable: "--font-pretendard",
});

const SITE_URL = "https://tutormatch-web.vercel.app";
const SITE_DESCRIPTION =
  "엄선된 선생님과의 1:1 맞춤 과외. 상담부터 매칭·학습 관리까지 전담 매니저가 함께합니다.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Concord Private Tutoring",
    template: "%s · Concord Private Tutoring",
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: SITE_URL,
    siteName: "Concord Private Tutoring",
    title: "Concord Private Tutoring",
    description: SITE_DESCRIPTION,
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Concord Private Tutoring" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Concord Private Tutoring",
    description: SITE_DESCRIPTION,
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: "Concord Private Tutoring",
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    "@id": SITE_URL,
  };

  return (
    <html lang="ko" className={pretendard.variable}>
      {/* Prevent flash-of-wrong-theme: read localStorage before first paint */}
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('concord-theme');if(t==='light-lime'||t==='dark-blue')document.documentElement.setAttribute('data-theme',t);var c=localStorage.getItem('concord-color');if(c==='blue')document.documentElement.setAttribute('data-color','blue');var m=localStorage.getItem('concord-mode');if(m==='dark')document.documentElement.setAttribute('data-theme','dark');}catch(e){}})();` }} />
      </head>
      <body className="min-h-screen [word-break:keep-all]">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
