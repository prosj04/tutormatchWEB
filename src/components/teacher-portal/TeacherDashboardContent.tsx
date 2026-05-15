type TeacherDashboardContentProps = {
  email: string;
  teacher: {
    name: string;
    phone: string;
    subjects: string;
    approved: boolean;
  };
};

export function TeacherDashboardContent({ teacher, email }: TeacherDashboardContentProps) {
  const subjectsLabel = teacher.subjects
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
        {teacher.approved ? (
          <>
            <span className="inline-block rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
              승인 완료
            </span>
            <p className="mt-4 text-sm font-medium text-text-dark">수업을 시작하실 수 있습니다.</p>
          </>
        ) : (
          <>
            <span className="inline-block rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900">
              승인 대기 중
            </span>
            <p className="mt-4 text-sm font-medium text-text-dark">
              관리자 검토가 완료되면 수업을 시작하실 수 있습니다.
            </p>
            <p className="mt-2 text-xs text-text-mid">보통 1-2 영업일 소요됩니다.</p>
          </>
        )}
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
        <h2 className="border-b border-gray-100 pb-3 text-xs font-semibold uppercase tracking-wider text-text-light">
          등록 정보
        </h2>
        <dl className="mt-6 space-y-4 text-sm">
          <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-8">
            <dt className="w-28 shrink-0 text-xs font-semibold uppercase tracking-wider text-text-light">
              이름
            </dt>
            <dd className="text-text-dark">{teacher.name}</dd>
          </div>
          <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-8">
            <dt className="w-28 shrink-0 text-xs font-semibold uppercase tracking-wider text-text-light">
              이메일
            </dt>
            <dd className="break-all text-text-dark">{email}</dd>
          </div>
          <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-8">
            <dt className="w-28 shrink-0 text-xs font-semibold uppercase tracking-wider text-text-light">
              담당 과목
            </dt>
            <dd className="text-text-dark">{subjectsLabel || "—"}</dd>
          </div>
          <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-8">
            <dt className="w-28 shrink-0 text-xs font-semibold uppercase tracking-wider text-text-light">
              전화번호
            </dt>
            <dd className="text-text-dark">{teacher.phone}</dd>
          </div>
        </dl>
        <p className="mt-8 border-t border-gray-100 pt-4 text-xs leading-relaxed text-text-mid">
          정보 수정이 필요하시면 관리자에게 문의해주세요.
        </p>
      </section>
    </div>
  );
}
