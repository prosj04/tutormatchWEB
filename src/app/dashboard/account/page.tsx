import Link from "next/link";
import { redirect } from "next/navigation";

import { AccountDeleteSection } from "@/components/account/AccountDeleteSection";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "계정 관리",
};

export default async function AccountPage() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }
  if (session.user.role !== "STUDENT") {
    redirect("/teacher-portal/dashboard");
  }

  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
    select: { name: true, grade: true, phone: true },
  });
  if (!student) {
    redirect("/?signup=1");
  }

  return (
    <main className="portal-main" style={{ maxWidth: 720, margin: "0 auto", padding: "40px 20px" }}>
      <Link href="/dashboard" className="text-sm" style={{ color: "var(--mut, #6b6b64)" }}>
        ← 대시보드로 돌아가기
      </Link>
      <h1 className="mt-4 text-2xl font-black" style={{ color: "var(--fg, #1a1a18)" }}>
        계정 관리
      </h1>
      <dl className="mt-6 text-sm" style={{ display: "grid", gridTemplateColumns: "100px 1fr", rowGap: 10 }}>
        <dt style={{ color: "var(--mut, #6b6b64)" }}>이름</dt>
        <dd>{student.name}</dd>
        <dt style={{ color: "var(--mut, #6b6b64)" }}>학년</dt>
        <dd>{student.grade}</dd>
        <dt style={{ color: "var(--mut, #6b6b64)" }}>전화번호</dt>
        <dd>{student.phone}</dd>
      </dl>
      <p className="mt-4 text-sm" style={{ color: "var(--mut, #6b6b64)" }}>
        정보 수정이 필요하면 담당 매니저 또는 help@concordedu.kr 로 문의해 주세요.
      </p>
      <AccountDeleteSection />
    </main>
  );
}
