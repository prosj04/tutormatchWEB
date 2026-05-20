import type { GroupedSiteContent } from "@/lib/site-content";
import { getCmsSectionValue } from "@/lib/cms-page-defaults";

export type FaqItem = {
  q: string;
  a: string;
};

export function FaqPageContent({
  faqs,
  siteContent,
}: {
  faqs: FaqItem[];
  siteContent?: GroupedSiteContent;
}) {
  const get = (section: string, key: string, fb: string) =>
    getCmsSectionValue(siteContent, section, key, fb);
  return (
    <div className="bg-neutral-10 pb-24 md:pb-32">
      <section className="border-b border-neutral-20 bg-white py-16 md:py-20">
        <div className="mx-auto max-w-[900px] px-5">
          <p className="text-sm font-black uppercase tracking-wider text-primary">
            {get("faq_page", "kicker", "FAQ")}
          </p>
          <h1 className="mt-3 text-[clamp(2rem,4vw,3.5rem)] font-black tracking-[-0.03em] text-neutral-100">
            {get("faq_page", "title", "자주 묻는 질문")}
          </h1>
          <p className="mt-4 max-w-2xl text-base font-medium leading-relaxed text-neutral-50">
            {get("faq_page", "subtext", "서비스 이용 전 궁금한 점을 모았습니다.")}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[900px] px-5 py-12 md:py-16">
        {faqs.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-neutral-20 bg-white p-10 text-center text-sm text-neutral-50">
            {get("faq_page", "empty_text", "등록된 FAQ가 없습니다.")}
          </p>
        ) : (
          <div className="divide-y divide-neutral-20 overflow-hidden rounded-[28px] border border-neutral-20 bg-white">
            {faqs.map((item) => (
              <div key={item.q} className="px-7 py-7 md:px-8 md:py-8">
                <p className="font-black text-neutral-100 md:text-lg">Q. {item.q}</p>
                <p className="mt-4 text-sm font-medium leading-relaxed text-neutral-50 md:text-base">
                  A. {item.a}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
