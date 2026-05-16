/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: "/teacher-potal", destination: "/teacher-portal", permanent: true },
      { source: "/teacher-potal/:path*", destination: "/teacher-portal/:path*", permanent: true },
    ];
  },
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
