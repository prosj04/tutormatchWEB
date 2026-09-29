// E7: 웹 미승인 강사 게이트. 모바일 PendingHome/EmptyState 문구와 정합.
export function TeacherApprovalLock() {
  return (
    <div className="sec">
      <div className="banner warn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
        <span>
          <b>승인 대기 중</b>
        </span>
      </div>
      <div className="empty">
        <b>승인 완료 후 이용 가능한 메뉴예요</b>
        <p>관리자 승인이 완료되면 학생·질문 기능이 열립니다.</p>
      </div>
    </div>
  );
}
