import { CmsEdit } from "@/components/admin/CmsEditOverlay";
import type { GroupedSiteContent } from "@/lib/site-content";
import { getCmsSpacing, getCmsSectionValue } from "@/lib/cms-page-defaults";

export type FaqItem = {
  q: string;
  a: string;
};

export function FaqPageContent({
  faqs,
  siteContent,
  isEditMode = false,
}: {
  faqs: FaqItem[];
  siteContent?: GroupedSiteContent;
  isEditMode?: boolean;
}) {
  const get = (section: string, key: string, fb: string) =>
    getCmsSectionValue(siteContent, section, key, fb);
  const sp = (key: string) => getCmsSpacing(siteContent, key);
  return (
    <div className="bg-neutral-10 pb-24 md:pb-32">
      <CmsEdit active={isEditMode} section="spacing" cmsKey="faq_header" type="spacing">
      <section className="border-b border-neutral-20 bg-white py-12 md:py-16 lg:py-20" style={sp("faq_header")}>
        <div className="mx-auto max-w-[900px] px-4 sm:px-5">
          <CmsEdit active={isEditMode} section="faq_page" cmsKey="kicker" type="text">
            <p className="text-sm font-black uppercase tracking-wider text-primary">
              {get("faq_page", "kicker", "FAQ")}
            </p>
          </CmsEdit>
          <CmsEdit active={isEditMode} section="faq_page" cmsKey="title" type="text">
            <h1 className="mt-3 text-[clamp(2rem,4vw,3.5rem)] font-black tracking-[-0.03em] text-neutral-100">
              {get("faq_page", "title", "자주 묻는 질문")}
            </h1>
          </CmsEdit>
          <CmsEdit active={isEditMode} section="faq_page" cmsKey="subtext" type="text">
            <p className="mt-4 max-w-2xl text-base font-medium leading-relaxed text-neutral-80">
              {get("faq_page", "subtext", "서비스 이용 전 궁금한 점을 모았습니다.")}
            </p>
          </CmsEdit>
        </div>
      </section>
      </CmsEdit>

      <CmsEdit active={isEditMode} section="spacing" cmsKey="faq_list" type="spacing">
      <section className="mx-auto max-w-[900px] px-4 py-10 sm:px-5 sm:py-12 md:py-16" style={sp("faq_list")}>
        {faqs.length === 0 ? (
          <CmsEdit active={isEditMode} section="faq_page" cmsKey="empty_text" type="text">
            <p className="rounded-2xl border border-dashed border-neutral-20 bg-white p-10 text-center text-sm text-neutral-80">
              {get("faq_page", "empty_text", "등록된 FAQ가 없습니다.")}
            </p>
          </CmsEdit>
        ) : (
          <div className="divide-y divide-neutral-20 overflow-hidden rounded-[28px] border border-neutral-20 bg-white">
            {faqs.map((item) => (
              <div key={item.q} className="px-4 py-5 sm:px-6 sm:py-6 md:px-8 md:py-8">
                <p className="font-black text-neutral-100 md:text-lg">Q. {item.q}</p>
                <p className="mt-4 text-sm font-medium leading-relaxed text-neutral-80 md:text-base">
                  A. {item.a}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
      </CmsEdit>
    </div>
  );
}
