import Link from "next/link";

export function TeacherPortalEntryTopBar() {
  return (
    <header className="fixed left-0 right-0 top-0 z-40 border-b border-navy/10 bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <span className="text-lg font-semibold tracking-tight text-navy">Concord.</span>
        <Link
          href="/"
          className="text-xs font-medium text-navy/60 transition hover:text-navy"
        >
          ← 메인으로 돌아가기
        </Link>
      </div>
    </header>
  );
}
