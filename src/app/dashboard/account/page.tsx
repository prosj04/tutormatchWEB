import "@/app/concord-portal.css";
import "@/app/concord-bridge.css";

import { redirect } from "next/navigation";

import { StudentPortalShell } from "@/components/concord-portal/StudentPortalShell";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

import { AccountClient } from "./AccountClient";

export const metadata = {
  title: "계정 관리",
};

export const dynamic = "force-dynamic";

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
    <StudentPortalShell>
      <section className="page on" id="pg-account" data-screen-label="계정">
        <div className="crumb">/dashboard/account</div>
        <h1>계정</h1>
        <p className="sub">프로필과 보안, 학부모 연결을 관리하세요.</p>
        <AccountClient
          name={student.name}
          grade={student.grade ?? "-"}
          phone={student.phone ?? "-"}
        />
      </section>
    </StudentPortalShell>
  );
}
