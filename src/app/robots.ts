import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site-config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/pricing", "/reviews", "/tutors", "/faq", "/terms", "/privacy", "/refund"],
        disallow: ["/admin", "/dashboard", "/teacher-portal", "/api/", "/checkout", "/success", "/register", "/login"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
