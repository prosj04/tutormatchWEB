import { ConcordPageHead } from "@/components/concord/ConcordPageHead";
import { ConcordReveal } from "@/components/concord/ConcordReveal";
import { ReviewByLine, type ReviewCardItem } from "@/lib/reviews-html-fallback";

export function ReviewsPageContent({ testimonials }: { testimonials: ReviewCardItem[] }) {
  return (
    <main>
      <ConcordPageHead
        eyebrow="Reviews"
        title={
          <>
            성적보다 습관이
            <br />
            먼저 바뀌었어요
          </>
        }
        description="Concord와 함께한 가정의 실제 후기입니다. 점수 변화보다 학생이 스스로 공부하게 된 이야기를 더 자랑스럽게 생각합니다."
      />

      <section className="sec" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="rev-masonry">
            {testimonials.map((item) => (
              <ConcordReveal key={`${item.info}-${item.quote.slice(0, 24)}`} as="article" className="card rev-card">
                <div className="rev-stars">★★★★★</div>
                <p className="qt">{item.quote}</p>
                <ReviewByLine info={item.info} />
              </ConcordReveal>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
