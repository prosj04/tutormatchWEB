import type { Metadata } from "next";
import localFont from "next/font/local";
import Script from "next/script";

import "./globals.css";
import "./concord.css";
import "./dark-mode-bridge.css";
import "./responsive.css";

import { HydrationMarker } from "@/components/layout/HydrationMarker";
import { getPortalDesign } from "@/lib/portal-design";
import { SITE_URL } from "@/lib/site-config";

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

const SITE_DESCRIPTION =
  "1:1 프리미엄 과외 매칭 — 전담 매니저가 상담부터 선생님 매칭·학습 관리까지";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "콘코드 | 1:1 프리미엄 과외 매칭 플랫폼",
    template: "%s | 콘코드",
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: SITE_URL,
    siteName: "콘코드",
    title: "콘코드 | 1:1 프리미엄 과외 매칭 플랫폼",
    description: SITE_DESCRIPTION,
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "콘코드 - 프리미엄 과외 매칭" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "콘코드 | 1:1 프리미엄 과외 매칭",
    description: SITE_DESCRIPTION,
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  ...(process.env.NAVER_SITE_VERIFICATION && {
    verification: {
      other: {
        "naver-site-verification": process.env.NAVER_SITE_VERIFICATION,
      },
    },
  }),
};

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: "콘코드",
    alternateName: "Concord Private Tutoring",
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    "@id": SITE_URL,
  };

  return (
    <html lang="ko" className={pretendard.variable} data-portal-design={getPortalDesign()}>
      {/* Prevent flash-of-wrong-theme: read localStorage before first paint */}
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var c=localStorage.getItem('concord-color');document.documentElement.setAttribute('data-color',c==='blue'?'blue':'green');var m=localStorage.getItem('concord-mode');if(m==='dark')document.documentElement.setAttribute('data-theme','dark');var po=localStorage.getItem('portal-design-override');var pd=po==='legacy'?'legacy':po==='concord'?'concord':'${getPortalDesign()}';document.documentElement.setAttribute('data-portal-design',pd);}catch(e){document.documentElement.setAttribute('data-portal-design','${getPortalDesign()}');}})();` }} />
        {/* No-JS safeguard: reveal elements stay visible if scripts are disabled */}
        <noscript><style>{`.reveal{opacity:1!important;transform:none!important;}`}</style></noscript>
      </head>
      <body className="min-h-screen [word-break:keep-all]">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <HydrationMarker />
        {children}
        {GA_MEASUREMENT_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_MEASUREMENT_ID}');`}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
