/**
 * /manager/* 는 사이드바 셸 없이 직접 접근되는 경로다(앱 내부 링크는
 * /teacher-portal/dashboard/approval 을 쓴다). 셸이 없어 페이지 여백이 0이 되던 것을
 * ds.css 의 포털 지면 컨테이너(.portal-shell > .main)로 감싸 v3 여백·바탕을 맞춘다.
 * 내비게이션은 중복 정의하지 않는다 — 메뉴가 필요한 경로는 teacher-portal 셸을 쓴다.
 */
export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="portal-shell">
      <main className="main">{children}</main>
    </div>
  );
}
