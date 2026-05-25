import { revalidateTag } from "next/cache";

export const PUBLIC_CMS_REVALIDATE_SECONDS = 300;

export const SITE_CONTENT_CACHE_TAG = "public-site-content";
export const TESTIMONIALS_CACHE_TAG = "public-testimonials";
export const FAQS_CACHE_TAG = "public-faqs";

export function revalidatePublicCms(...tags: string[]) {
  const targets =
    tags.length > 0
      ? tags
      : [SITE_CONTENT_CACHE_TAG, TESTIMONIALS_CACHE_TAG, FAQS_CACHE_TAG];

  for (const tag of targets) {
    revalidateTag(tag);
  }
}
