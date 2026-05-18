import { TutorCard, type TutorCardData } from "@/components/tutors/TutorCard";

export function TutorsListing({ tutors }: { tutors: TutorCardData[] }) {
  return (
    <div className="pb-24">
      <section className="border-b border-gray-100 bg-white px-6 py-20 md:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">
            Teachers
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-[-0.04em] text-text-primary md:text-6xl">
            강사진
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-text-secondary">
            관리자 승인이 완료된 선생님을 확인할 수 있습니다. 카드 내용은 관리자
            페이지에서 수정한 정보가 바로 반영됩니다.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        {tutors.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-12 text-center">
            <h2 className="text-xl font-black text-text-primary">등록된 강사진이 없습니다.</h2>
            <p className="mt-3 text-sm text-text-secondary">
              승인된 선생님이 생기면 이곳에 표시됩니다.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tutors.map((tutor) => (
              <TutorCard key={tutor.id} tutor={tutor} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
