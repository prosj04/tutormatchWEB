-- FAQ·후기 홈/전용 페이지 노출 분리
ALTER TABLE "FaqItem" ADD COLUMN "showOnHome" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "FaqItem" ADD COLUMN "showOnFaqPage" BOOLEAN NOT NULL DEFAULT true;
UPDATE "FaqItem" SET "showOnHome" = true WHERE "isActive" = true;

ALTER TABLE "Testimonial" ADD COLUMN "showOnHome" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Testimonial" ADD COLUMN "showOnReviewsPage" BOOLEAN NOT NULL DEFAULT true;
UPDATE "Testimonial" SET "showOnHome" = true WHERE "isActive" = true;
