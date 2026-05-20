import { TestimonialCard, type TestimonialItem } from "@/components/reviews/TestimonialCard";
import { getCmsSectionValue } from "@/lib/cms-page-defaults";
import type { GroupedSiteContent } from "@/lib/site-content";

export function ReviewsPageContent({
  testimonials,
  siteContent,
}: {
  testimonials: TestimonialItem[];
  siteContent?: GroupedSiteContent;
}) {
  const get = (key: string, fb: string) => getCmsSectionValue(siteContent, "reviews_page", key, fb);
  return (
    <div className="pb-24 md:pb-32">
      <section className="border-b border-neutral-20 bg-white py-12 md:py-16 lg:py-20">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-5">
          <p className="text-sm font-black uppercase tracking-wider text-primary">
            {get("kicker", "REVIEWS")}
          </p>
          <h1 className="mt-3 text-[clamp(2rem,4vw,3.5rem)] font-black tracking-[-0.03em] text-neutral-100">
            {get("title", "학습 후기")}
          </h1>
          <p className="mt-4 max-w-2xl text-base font-medium leading-relaxed text-neutral-50">
            {get("subtext", "실제 학부모·학생이 남긴 후기를 모았습니다.")}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 py-10 sm:px-5 sm:py-12 md:py-16">
        {testimonials.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-neutral-20 bg-white p-10 text-center text-sm text-neutral-50">
            {get("empty_text", "등록된 후기가 없습니다.")}
          </p>
        ) : (
          <div className="space-y-5">
            {testimonials.map((item) => (
              <TestimonialCard key={`${item.info}-${item.quote.slice(0, 24)}`} item={item} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
