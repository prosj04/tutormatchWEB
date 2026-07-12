import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { TeacherLessonConfirmCard } from "@/components/teacher-portal/TeacherLessonConfirmCard";
import { isPortalTeacherRole } from "@/lib/portal-roles";
import { getTeacherByUserId } from "@/lib/get-teacher-cache";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "선생님 대시보드",
};

const weekdayLabels = ["일", "월", "화", "수", "목", "금", "토"];

function initial(name: string) {
  return name.slice(0, 1);
}

function formatTime(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export default async function TeacherDashboardPage() {
  const session = await auth();
  if (!session?.user?.id || !isPortalTeacherRole(session.user.role)) {
    redirect("/teacher-portal");
  }

  const teacher = await getTeacherByUserId(session.user.id);
  if (!teacher) {
    redirect("/teacher-portal");
  }

  const now = new Date();
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const [todayLessons, pendingQuestions, activeMatches] = await Promise.all([
    prisma.lesson.findMany({
      where: {
        teacherId: teacher.id,
        status: { not: "CANCELLED" },
        startAt: { gte: dayStart, lt: dayEnd },
      },
      orderBy: { startAt: "asc" },
      select: {
        id: true,
        subject: true,
        durationMin: true,
        startAt: true,
        student: { select: { name: true, grade: true } },
      },
    }),
    // QnA는 QuestionMessage 단일 저장소로 이관됨 — 레거시 Question count는 死통계 (B6-2)
    // 미답변 = 루트 질문 중 tutor 답변(replyToId=자신)이 없는 것
    prisma.questionMessage.count({
      where: {
        replyToId: null,
        sender: "me",
        replies: { none: { sender: "tutor" } },
        student: { teachers: { some: { teacherId: teacher.id, isActive: true } } },
      },
    }),
    prisma.teacherStudent.findMany({
      where: { teacherId: teacher.id, isActive: true },
      select: { student: { select: { id: true, name: true } } },
    }),
  ]);

  const studentIds = activeMatches.map((m) => m.student.id);
  const lessonsByStudent = await prisma.lesson.findMany({
    where: {
      teacherId: teacher.id,
      studentId: { in: studentIds },
      status: { not: "CANCELLED" },
    },
    select: { studentId: true },
  });
  const hasLesson = new Set(lessonsByStudent.map((l) => l.studentId));
  const noFirstLesson = activeMatches.filter((m) => !hasLesson.has(m.student.id));

  const monthDay = dayStart.getMonth() + 1;
  const dateStr = `${monthDay}월 ${dayStart.getDate()}일 (${weekdayLabels[dayStart.getDay()]})`;

  return (
    <section className="page on" id="pg-dash">
      <div className="crumb">/teacher-portal/dashboard</div>
      <h1>대시보드</h1>
      <p className="sub">오늘 수업과 이번 주 할 일을 확인하세요.</p>

      {/* E8: 승인 대기 배너를 진행 상황(KPI)보다 상단에 우선 배치 */}
      {!teacher.approved ? (
        <div className="sec banner warn" style={{ marginTop: 0 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
          <span>
            <b>계정이 승인 대기 중입니다.</b> 관리자 검토가 완료되면 수업을 시작하실 수 있습니다.
            매니저가 곧 개별 연락 드리겠습니다.
          </span>
        </div>
      ) : null}

      {teacher.approved ? <TeacherLessonConfirmCard /> : null}

      <div className="sec grid3">
        <div className="card kpi">
          <b>{todayLessons.length}</b>
          <span>오늘 수업</span>
        </div>
        <div className="card kpi">
          <b>
            {pendingQuestions}
            <em>답변 대기</em>
          </b>
          <span>학생 질문</span>
        </div>
        <div className="card kpi">
          <b>{noFirstLesson.length}</b>
          <span>첫 수업일 미정</span>
        </div>
      </div>

      <div className="sec">
        <h2>오늘 수업 · {dateStr}</h2>
        <div className="card">
          {todayLessons.length === 0 ? (
            <div className="row">
              <div className="g">
                <p>오늘 예정된 수업이 없습니다.</p>
              </div>
            </div>
          ) : (
            todayLessons.map((lesson) => (
              <div className="row" key={lesson.id}>
                <span className="av">{initial(lesson.student.name)}</span>
                <div className="g">
                  <b>
                    {lesson.student.name} · {lesson.student.grade}
                  </b>
                  <p>
                    {lesson.subject} · {lesson.durationMin}분
                  </p>
                </div>
                <span className="r num" style={{ fontWeight: 800, color: "var(--fg)" }}>
                  {formatTime(lesson.startAt)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {teacher.approved && noFirstLesson.length > 0 ? (
        <div className="sec banner warn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
          <span>
            <b>{noFirstLesson[0].student.name} 학생의 첫 수업일이 미정입니다.</b> 학생 페이지에서 지정해 주세요.
          </span>
        </div>
      ) : null}
    </section>
  );
}
