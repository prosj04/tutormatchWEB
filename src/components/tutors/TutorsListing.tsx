import { CmsEdit } from "@/components/admin/CmsEditOverlay";
import { TutorCard, type TutorCardData } from "@/components/tutors/TutorCard";
import { getCmsSectionValue } from "@/lib/cms-page-defaults";

export function TutorsListing({
  tutors,
  siteContent,
  isEditMode = false,
}: {
  tutors: TutorCardData[];
  siteContent?: Record<string, Record<string, string>>;
  isEditMode?: boolean;
}) {
  const get = (key: string, fallback: string) =>
    getCmsSectionValue(siteContent, "tutors_page", key, fallback);
  return (
    <div className="pb-24">
      <section className="border-b border-gray-100 bg-white px-4 py-12 sm:px-6 sm:py-16 md:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">
            Teachers
          </p>
          <CmsEdit active={isEditMode} section="tutors_page" cmsKey="header_title" type="text">
            <h1 className="mt-4 text-4xl font-black tracking-[-0.04em] text-text-primary md:text-6xl">
              {get("header_title", "강사진")}
            </h1>
          </CmsEdit>
          <CmsEdit active={isEditMode} section="tutors_page" cmsKey="header_subtext" type="text">
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-text-secondary">
              {get(
                "header_subtext",
                "관리자 승인이 완료된 선생님을 확인할 수 있습니다. 카드 내용은 관리자 페이지에서 수정한 정보가 바로 반영됩니다.",
              )}
            </p>
          </CmsEdit>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12 md:py-16">
        {tutors.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-12 text-center">
            <CmsEdit active={isEditMode} section="tutors_page" cmsKey="empty_title" type="text">
              <h2 className="text-xl font-black text-text-primary">
                {get("empty_title", "등록된 강사진이 없습니다.")}
              </h2>
            </CmsEdit>
            <CmsEdit active={isEditMode} section="tutors_page" cmsKey="empty_desc" type="text">
              <p className="mt-3 text-sm text-text-secondary">
                {get("empty_desc", "승인된 선생님이 생기면 이곳에 표시됩니다.")}
              </p>
            </CmsEdit>
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
