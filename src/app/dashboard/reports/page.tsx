import "@/app/concord-portal.css";
import "@/app/concord-bridge.css";

import { redirect } from "next/navigation";

import { StudentPortalShell } from "@/components/concord-portal/StudentPortalShell";
import { auth } from "@/auth";
import { listChildReports } from "@/lib/parent-data";
import { prisma } from "@/lib/prisma";

import { StudentReportsView } from "./StudentReportsView";

export const metadata = {
  title: "월간 리포트",
};

export const dynamic = "force-dynamic";

export default async function StudentReportsPage() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }
  if (session.user.role !== "STUDENT") {
    redirect("/teacher-portal/dashboard");
  }

  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
    select: { id: true, name: true },
  });
  if (!student) {
    redirect("/?signup=1");
  }

  const reports = await listChildReports(student.id);

  return (
    <StudentPortalShell>
      <section className="page on" id="pg-reports" data-screen-label="월간 리포트">
        <div className="crumb">/dashboard/reports</div>
        <h1>월간 리포트</h1>
        <p className="sub">선생님·매니저가 매달 요약한 나의 학습 리포트예요.</p>
        <StudentReportsView reports={reports} studentName={student.name} />
      </section>
    </StudentPortalShell>
  );
}
