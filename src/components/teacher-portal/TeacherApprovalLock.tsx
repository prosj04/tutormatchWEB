// E7: 웹 미승인 강사 게이트. 모바일 PendingHome/EmptyState 문구와 정합.
export function TeacherApprovalLock() {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
      <span className="inline-block rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-semibold text-amber-900">
        승인 대기 중
      </span>
      <p className="mt-4 text-sm font-semibold text-text-primary">
        승인 완료 후 이용 가능한 메뉴예요
      </p>
      <p className="mt-2 text-xs text-text-secondary">
        관리자 승인이 완료되면 학생·질문 기능이 열립니다.
      </p>
    </div>
  );
}
