import { ConcordPageHead } from "@/components/concord/ConcordPageHead";
import { FaqAccordionList, type FaqItem } from "@/components/faq/FaqAccordionList";

export function FaqPageContent({ faqs }: { faqs: FaqItem[] }) {
  return (
    <main>
      <ConcordPageHead
        eyebrow="FAQ"
        title="자주 묻는 질문"
        description="상담·매칭·수업·결제에 대해 학부모님이 가장 많이 묻는 내용을 모았습니다. 더 궁금한 점은 언제든 상담으로 문의해 주세요."
      />

      <section className="sec" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <FaqAccordionList faqs={faqs} />
        </div>
      </section>
    </main>
  );
}
