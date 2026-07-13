import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

import { parentSyntheticEmailFromDigits } from "../src/lib/phone-login";

const prisma = new PrismaClient();

// 시드 재실행 시 UUID가 바뀌므로 이름으로 동적 해석
let MANAGER = ""; // Chief_manager
let T_KIM = ""; // 김도현 (수학) — 로그인 대상 강사
let S_HONG = ""; // 홍서준 → ACTIVE
let S_HA = ""; // 김하은 → 수락 대기
let S_MIN = ""; // 이민재 → 첫 수업 대기
let S_YU = ""; // 박유나 → 배정(유지)

async function resolveIds() {
  const student = async (name: string) => {
    const s = await prisma.student.findFirst({ where: { name: { contains: name } }, select: { id: true } });
    if (!s) throw new Error(`student not found: ${name}`);
    return s.id;
  };
  const teacher = async (name: string) => {
    const t = await prisma.teacher.findFirst({ where: { name: { contains: name } }, select: { id: true } });
    if (!t) throw new Error(`teacher not found: ${name}`);
    return t.id;
  };
  MANAGER = await teacher("Chief_manager");
  T_KIM = await teacher("김도현");
  S_HONG = await student("홍서준");
  S_HA = await student("김하은");
  S_MIN = await student("이민재");
  S_YU = await student("박유나");
}

function dayKey(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function at(offsetDays: number, hour: number) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(hour, 0, 0, 0);
  return d;
}
const monthKey = dayKey(0).slice(0, 7);

async function main() {
  console.log("==> 데모 데이터 심화 (로컬 전용)");
  await resolveIds();

  // 0) 상담 노트 정리 + 상태 전이
  await prisma.consultationBooking.updateMany({
    where: { studentId: { in: [S_HONG, S_HA, S_MIN] } },
    data: { status: "COMPLETED", note: "수학 내신 대비, 주 2회 대면 희망. 현재 3등급, 1학기 내 2등급 목표.", assignedAt: at(-14, 10) },
  });
  await prisma.consultationBooking.updateMany({
    where: { studentId: S_YU },
    data: { status: "ASSIGNED", note: "영어 독해 보강 희망. 방문 상담 일정 조율 중." },
  });

  // 1) 상담 리포트 (홍서준) — 학습 목표 카드
  const hongBooking = await prisma.consultationBooking.findFirst({ where: { studentId: S_HONG }, orderBy: { createdAt: "desc" } });
  if (hongBooking) {
    await prisma.consultationReport.upsert({
      where: { bookingId: hongBooking.id },
      update: {},
      create: {
        bookingId: hongBooking.id,
        goals: JSON.stringify({
          quantitative: ["1학기 중간고사 수학 2등급 진입", "모의고사 수학 원점수 20점 향상"],
          qualitative: ["오답노트 습관화", "서술형 풀이과정 논리 강화"],
        }),
        subjectLevels: JSON.stringify({ 수학: "중상" }),
        recommendedPlan: "고등 · 주2 · 2h (수학 집중)",
        note: "성실하나 개념 구멍이 산발적. 단원별 진단 후 취약 유형 반복 권장.",
      },
    });
  }

  // 2) 매칭 3종
  const matches: Array<[string, string, string, boolean, "ACTIVE" | "PENDING_STUDENT_ACCEPT", string]> = [
    [T_KIM, S_HONG, "수학", true, "ACTIVE", "내신·모의고사 균형 지도 경험이 많아 배정했습니다."],
    [T_KIM, S_MIN, "수학", true, "ACTIVE", "물리·수학 동시 지도가 가능한 강사로 배정했습니다."],
    [T_KIM, S_HA, "수학", false, "PENDING_STUDENT_ACCEPT", "학생 성향(차분한 설명 선호)에 맞춰 추천드립니다."],
  ];
  for (const [tid, sid, subj, active, status, reason] of matches) {
    await prisma.teacherStudent.upsert({
      where: { teacherId_studentId: { teacherId: tid, studentId: sid } },
      update: { subjects: subj, isActive: active, matchStatus: status, matchReason: reason, respondedAt: active ? at(-10, 12) : null },
      create: {
        teacherId: tid, studentId: sid, subjects: subj, startDate: dayKey(-10),
        isActive: active, matchStatus: status, matchReason: reason,
        respondedAt: active ? at(-10, 12) : null,
      },
    });
  }

  // 3) 수업 (홍서준: 과거 완료 + 미래 예약 / 이민재: 없음 → 첫 수업 대기)
  await prisma.lesson.deleteMany({ where: { studentId: S_HONG } });
  await prisma.lesson.createMany({
    data: [
      { studentId: S_HONG, teacherId: T_KIM, subject: "수학", startAt: at(-7, 17), durationMin: 120, status: "COMPLETED" },
      { studentId: S_HONG, teacherId: T_KIM, subject: "수학", startAt: at(-3, 17), durationMin: 120, status: "COMPLETED" },
      { studentId: S_HONG, teacherId: T_KIM, subject: "수학", startAt: at(1, 17), durationMin: 120, status: "SCHEDULED" },
    ],
  });

  // 4) 학습 플랜 + 과제 (숙제 자동 분배 시연: 오늘 중심 5일)
  await prisma.studyPlan.deleteMany({ where: { studentId: S_HONG } });
  const planDays: Array<[number, Array<[string, "teacher" | "student", boolean]>]> = [
    [-1, [["쎈 수학(상) 32~35p 홀수번", "teacher", true], ["오답노트 정리 3문항", "student", true]]],
    [0, [["미적분 개념원리 p88 예제 4개", "teacher", false], ["기출 3점 문항 5개", "teacher", false], ["단어 20개 암기", "student", false]]],
    [1, [["수1 유형서 도함수 파트", "teacher", false], ["오답 재풀이", "student", false]]],
    [2, [["주간 복습 테스트 대비", "teacher", false]]],
    [3, [["모의고사 4점 문항 오답", "teacher", false], ["개념 요약 노트", "student", false]]],
  ];
  for (const [off, tasks] of planDays) {
    const plan = await prisma.studyPlan.create({
      data: {
        studentId: S_HONG, date: dayKey(off), source: off === 0 ? "AUTO_DISTRIBUTION" : "MANUAL",
        comment: off === 0 ? "오늘은 개념 예제에 집중하고, 3점 문항으로 감 잡아봅시다." : null,
        commentAt: off === 0 ? at(0, 9) : null, commentBy: off === 0 ? T_KIM : null,
      },
    });
    await prisma.studyTask.createMany({
      data: tasks.map(([title, source, done], i) => ({
        planId: plan.id, title, source, isDone: done, doneAt: done ? at(off, 20) : null, order: i,
      })),
    });
  }

  // 5) 질문 (QuestionMessage 스레드 — 현행 /api/questions 모델)
  await prisma.questionMessage.deleteMany({ where: { studentId: S_HONG } });
  const qThreads: Array<{ q: string; ai: string; tutor: string | null }> = [
    {
      q: "미분계수 정의에서 극한이 존재하지 않으면 미분 불가능인가요?",
      ai: "네. 미분계수는 그 점에서의 순간변화율(극한값)로 정의되므로, 좌·우 극한이 다르거나 극한이 존재하지 않으면 그 점에서 미분 불가능합니다. 대표적으로 뾰족점(절댓값 함수의 꼭짓점)이나 불연속점이 그렇습니다.",
      tutor: "정확해요. 추가로 '연속이지만 미분 불가능'한 예(y=|x|)를 꼭 기억하세요. 시험에 자주 나옵니다.",
    },
    {
      q: "합성함수 미분에서 안쪽 함수 미분을 곱하는 이유가 이해가 안 돼요.",
      ai: "연쇄법칙 때문입니다. y=f(g(x))일 때 x가 조금 변하면 g(x)가 변하고(=g'(x)), 그 변화가 다시 f를 통해 증폭됩니다(=f'(g(x))). 두 변화율의 곱이 전체 변화율이에요.",
      tutor: null,
    },
  ];
  for (const t of qThreads) {
    const root = await prisma.questionMessage.create({
      data: { studentId: S_HONG, teacherId: T_KIM, sender: "me", body: t.q, date: dayKey(0), replyToId: null },
    });
    await prisma.questionMessage.create({
      data: { studentId: S_HONG, teacherId: T_KIM, sender: "ai", body: t.ai, replyToId: root.id },
    });
    if (t.tutor) {
      await prisma.questionMessage.create({
        data: { studentId: S_HONG, teacherId: T_KIM, sender: "tutor", body: t.tutor, replyToId: root.id },
      });
    }
  }

  // 6) 매니저 케어 로그 (학생에게 노출)
  await prisma.managerCareLog.deleteMany({ where: { studentId: S_HONG } });
  await prisma.managerCareLog.createMany({
    data: [
      { managerId: MANAGER, studentId: S_HONG, type: "CONSULT", note: "첫 대면 상담 완료 — 수학 집중 플랜 확정, 김도현 강사 배정.", createdAt: at(-10, 15) },
      { managerId: MANAGER, studentId: S_HONG, type: "CHECK", note: "2주차 점검 — 과제 이행률 양호, 서술형 보완 요청 전달.", createdAt: at(-2, 15) },
    ],
  });

  // 7) 월간 리포트
  await prisma.monthlyReport.upsert({
    where: { studentId_month: { studentId: S_HONG, month: monthKey } },
    update: {},
    create: {
      studentId: S_HONG, month: monthKey,
      summary: "이번 달 8회 수업 진행, 과제 이행률 86%. 도함수 단원 개념 안정화 단계.",
      weakTypes: JSON.stringify(["극한의 존재성", "합성함수 미분", "서술형 논증"]),
      detail: "3점 문항 정답률은 안정적이나 4점 킬러 문항에서 시간 배분 이슈. 다음 달 실전 모의 훈련 비중 확대 예정.",
    },
  });

  // 8) 반복 숙제 템플릿 (강사 도구)
  await prisma.homeworkTemplate.deleteMany({ where: { teacherId: T_KIM } });
  await prisma.homeworkTemplate.create({
    data: {
      teacherId: T_KIM, title: "수학 주간 기본 루틴", subject: "수학", defaultDays: 7, isDefault: true,
      tasks: JSON.stringify([
        { title: "쎈 유형서 해당 단원", weight: 3 },
        { title: "오답노트 정리", weight: 2 },
        { title: "개념 요약 노트", weight: 1 },
        { title: "기출 3점 문항 세트", weight: 2 },
      ]),
    },
  });

  // 9) 공개 후기 (reviews/home)
  const testimonials = [
    ["대치동 학원을 옮겨다녔는데, 매니저님이 직접 상담 와서 아이 성향까지 파악해준 게 결정적이었어요. 3개월 만에 수학 3등급→1등급.", "고2 · 수학 · 학부모", true],
    ["숙제가 자동으로 요일별로 배분돼서 아이가 밀리지 않아요. 부모가 앱으로 진도까지 볼 수 있어 안심됩니다.", "중3 · 영어 · 학부모", true],
    ["모르는 문제를 밤에 올리면 AI가 바로 답을 주고, 다음날 선생님이 다시 확인해줘요. 질문 텀이 사라졌습니다.", "고1 · 수학 · 학생", false],
    ["강사 검증이 확실해서 처음부터 신뢰가 갔어요. 미스매치 걱정 없이 시작했습니다.", "중2 · 수학 · 학부모", false],
  ];
  await prisma.testimonial.deleteMany({});
  await prisma.testimonial.createMany({
    data: testimonials.map(([quote, author, showOnHome], i) => ({
      quote: quote as string, author: author as string, order: i,
      isActive: true, showOnHome: showOnHome as boolean, showOnReviewsPage: true,
    })),
  });

  // 10) FAQ
  const faqs = [
    ["수업은 대면인가요, 비대면인가요?", "Concord는 서울·분당 지역 대면 1:1 과외를 기본으로 합니다. 매니저가 직접 상담 후 검증된 강사를 배정합니다.", true],
    ["강사는 어떻게 검증되나요?", "서류·면접·범죄경력조회를 통과한 강사만 등록됩니다. 배정 후에도 학생이 수락 버튼을 눌러야 수업이 시작됩니다.", true],
    ["잘 맞지 않으면 강사를 바꿀 수 있나요?", "네. 미스매치 시 무료로 재매칭해 드립니다. 담당 매니저가 사유를 확인하고 즉시 조치합니다.", false],
    ["결제와 환불은 어떻게 되나요?", "월 정액 선불이며 토스페이먼츠로 안전 결제됩니다. 수업 시작 전 전액, 첫 수업 후 3일 이내 100% 환불 등 회차 기준 규정을 따릅니다.", false],
    ["학부모도 진도를 볼 수 있나요?", "네. 학습 플래너·과제 이행률·월간 리포트를 앱에서 실시간으로 열람하실 수 있습니다.", false],
  ];
  await prisma.faqItem.deleteMany({});
  await prisma.faqItem.createMany({
    data: faqs.map(([question, answer, showOnHome], i) => ({
      question: question as string, answer: answer as string, order: i,
      isActive: true, showOnHome: showOnHome as boolean, showOnFaqPage: true,
    })),
  });

  // 9) 학부모 계정 (홍서준 연결) — 전화 01090005001 / 비밀번호 env SEED_PORTAL_PASSWORD
  const parentPassword = process.env.SEED_PORTAL_PASSWORD;
  if (!parentPassword) throw new Error("SEED_PORTAL_PASSWORD 환경변수가 필요합니다");
  const parentDigits = "01090005001";
  const parentEmail = parentSyntheticEmailFromDigits(parentDigits);
  const parentUser = await prisma.user.upsert({
    where: { email: parentEmail },
    update: {},
    create: { email: parentEmail, password: await bcrypt.hash(parentPassword, 12), role: "PARENT" },
  });
  const parent = await prisma.parent.upsert({
    where: { userId: parentUser.id },
    update: {},
    create: { userId: parentUser.id, name: "[sample] 홍서준 학부모", phone: parentDigits },
  });
  await prisma.parentStudent.upsert({
    where: { parentId_studentId: { parentId: parent.id, studentId: S_HONG } },
    update: {},
    create: { parentId: parent.id, studentId: S_HONG, linkedVia: "MANAGER" },
  });

  console.log("==> 완료: 매칭 3 · 수업 3 · 플랜 5 · 질문 2 · 케어로그 2 · 월간리포트 1 · 템플릿 1 · 후기 4 · FAQ 5 · 학부모 1");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
