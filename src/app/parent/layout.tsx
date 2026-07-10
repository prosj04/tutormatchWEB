import Link from "next/link";

import { requireParentPage } from "@/lib/parent-page-auth";

export const dynamic = "force-dynamic";

/**
 * 웹 학부모 포털 레이아웃 — 기능/뼈대 스켈레톤.
 * 디자인 폴리시는 디자인 핸드오프 대상(최소 디자인 규칙).
 */
export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { parent } = await requireParentPage();

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <header className="mb-6 flex items-center justify-between border-b pb-4">
        <div>
          <p className="text-sm text-gray-500">학부모</p>
          <h1 className="text-lg font-semibold">{parent.name} 님</h1>
        </div>
        <nav className="flex gap-4 text-sm">
          <Link href="/parent" className="hover:underline">
            자녀
          </Link>
          <Link href="/parent/payments" className="hover:underline">
            결제
          </Link>
          <Link href="/parent/consultation" className="hover:underline">
            상담
          </Link>
        </nav>
      </header>
      {children}
    </div>
  );
}
