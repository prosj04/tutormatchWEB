/**
 * CMS 기본 콘텐츠 시딩 — POST /api/admin/cms/init과 동일 로직의 CLI 실행본
 * 실행: npx tsx scripts/seed-cms.ts (idempotent — skipDuplicates)
 */
import { seedDefaultCmsContent } from "@/lib/cms-seed";
import { prisma } from "@/lib/prisma";

async function main() {
  const before = {
    site: await prisma.siteContent.count(),
    testimonial: await prisma.testimonial.count(),
    faq: await prisma.faqItem.count(),
  };
  const result = await seedDefaultCmsContent();
  const after = {
    site: await prisma.siteContent.count(),
    testimonial: await prisma.testimonial.count(),
    faq: await prisma.faqItem.count(),
  };
  console.log("before:", before);
  console.log("result:", result);
  console.log("after:", after);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
