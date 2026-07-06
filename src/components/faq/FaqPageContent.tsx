import { CmsEdit } from "@/components/admin/CmsEditOverlay";
import { ConcordPageHead } from "@/components/concord/ConcordPageHead";
import { ConcordSubpageCta } from "@/components/concord/ConcordSubpageCta";
import { FaqAccordionList, type FaqItem } from "@/components/faq/FaqAccordionList";
import { formatCmsMultiline, getCmsSectionValue } from "@/lib/cms-page-defaults";
import type { GroupedSiteContent } from "@/lib/site-content";

function cmsTitleLines(text: string) {
  const lines = formatCmsMultiline(text).split("\n").filter(Boolean);
  if (lines.length <= 1) return text;
  return lines.map((line, i) => (
    <span key={line}>
      {line}
      {i < lines.length - 1 ? <br /> : null}
    </span>
  ));
}

export function FaqPageContent({
  faqs,
  siteContent,
  isEditMode = false,
}: {
  faqs: FaqItem[];
  siteContent?: GroupedSiteContent;
  isEditMode?: boolean;
}) {
  const get = (key: string, fallback: string) =>
    getCmsSectionValue(siteContent, "faq_page", key, fallback);

  return (
    <main>
      <ConcordPageHead
        eyebrow={
          <CmsEdit active={isEditMode} section="faq_page" cmsKey="kicker" type="text">
            {get("kicker", "FAQ")}
          </CmsEdit>
        }
        title={
          <CmsEdit active={isEditMode} section="faq_page" cmsKey="title" type="text">
            {cmsTitleLines(get("title", "자주 묻는 질문"))}
          </CmsEdit>
        }
        description={
          <CmsEdit active={isEditMode} section="faq_page" cmsKey="subtext" type="text">
            {get(
              "subtext",
              "상담·매칭·수업·환불에 대해 가장 많이 묻는 내용을 모았습니다. 추가 질문은 무료 상담으로 문의해 주세요.",
            )}
          </CmsEdit>
        }
      />

      <section className="sec" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <FaqAccordionList faqs={faqs} />
        </div>
      </section>

      <ConcordSubpageCta source="faq_page_cta" />
    </main>
  );
}
