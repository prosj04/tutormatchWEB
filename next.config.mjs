const isDev = process.env.NODE_ENV === "development";

/**
 * CSP. script-src에 'unsafe-inline'을 두는 이유: App Router는 페이지마다
 * 동적 인라인 flight 스크립트(self.__next_f.push)를 내보내므로 해시로는
 * 허용 불가, nonce는 미들웨어+전 페이지 동적 렌더 강제라 과함.
 * 호스트 허용목록·object-src 'none'·base-uri로 외부 스크립트 주입은 차단됨.
 * ponytail: connect-src https: 광역 — 파일럿 후 Toss·GA 도메인으로 좁히기.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://js.tosspayments.com https://www.googletagmanager.com https://t1.kakaocdn.net`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https:",
  "frame-src 'self' https://*.tosspayments.com",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'self'",
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      { source: "/teacher-potal", destination: "/teacher-portal", permanent: true },
      { source: "/teacher-potal/:path*", destination: "/teacher-portal/:path*", permanent: true },
    ];
  },
  serverExternalPackages: ["@prisma/client"],
  experimental: {
    optimizePackageImports: [
      "@dnd-kit/core",
      "@dnd-kit/sortable",
      "@dnd-kit/utilities",
      "framer-motion",
    ],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
