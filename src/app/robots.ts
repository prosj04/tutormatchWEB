import type { MetadataRoute } from "next";

const SITE_URL = "https://tutormatch-web.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/pricing", "/reviews", "/tutors", "/faq"],
        disallow: ["/admin", "/dashboard", "/teacher-portal", "/api/", "/checkout", "/success", "/register", "/login"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
