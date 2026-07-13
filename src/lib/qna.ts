import { prisma } from "@/lib/prisma";

/**
 * Q&A 데이터 계층. 웹(날짜별 카드 뷰)과 모바일(강사별 채팅 뷰)이 동일한
 * `QuestionMessage` 테이블을 소비하도록 뷰 변환을 이곳에 모았다.
 *
 * 저장 규약:
 *   • 학생 질문(루트): sender="me", replyToId=null, date="YYYY-MM-DD".
 *   • AI/강사 답변:    sender="ai"|"tutor", replyToId=<루트 id>.
 *   • "해결됨" 플래그는 루트 메시지의 isResolved에만 존재한다.
 *
 * 마이그레이션 시 Question.id를 루트 QuestionMessage.id로 그대로 재사용했기 때문에,
 * 기존 Notification.relatedId 등도 그대로 유효하다.
 */

/** 웹 카드 뷰용 레거시 Question 셰이프 (UI 하위호환). */
export type LegacyQuestion = {
  id: string;
  studentId: string;
  date: string;
  content: string;
  imageUrl: string | null;
  aiAnswer: string | null;
  teacherAnswer: string | null;
  teacherAnswerAt: Date | null;
  answeredBy: string | null;
  isResolved: boolean;
  createdAt: Date;
};

type RootWithReplies = {
  id: string;
  studentId: string;
  teacherId: string | null;
  body: string;
  imageUrl: string | null;
  date: string | null;
  isResolved: boolean;
  createdAt: Date;
  replies: {
    id: string;
    sender: string;
    teacherId: string | null;
    body: string;
    createdAt: Date;
  }[];
};

function rootToLegacyQuestion(row: RootWithReplies): LegacyQuestion {
  // AI 답변: 가장 이른 sender="ai" 응답
  const aiReply = row.replies
    .filter((r) => r.sender === "ai")
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
  // 강사 답변: 가장 이른 sender="tutor" 응답
  const teacherReply = row.replies
    .filter((r) => r.sender === "tutor")
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];

  return {
    id: row.id,
    studentId: row.studentId,
    date: row.date ?? "",
    content: row.body,
    imageUrl: row.imageUrl,
    aiAnswer: aiReply?.body ?? null,
    teacherAnswer: teacherReply?.body ?? null,
    teacherAnswerAt: teacherReply?.createdAt ?? null,
    answeredBy: teacherReply?.teacherId ?? null,
    isResolved: row.isResolved,
    createdAt: row.createdAt,
  };
}

/**
 * 채팅 타임라인용 단일 메시지 셰이프. 웹 학생 QnA를 모바일 앱과 동일한
 * 시간순 말풍선 모델로 재구성하기 위해 루트+답변을 평탄화한 것.
 */
export type QnaTimelineMessage = {
  id: string;
  /** me=학생, ai=AI 즉답, tutor=선생님 */
  sender: "me" | "ai" | "tutor";
  body: string;
  imageUrl: string | null;
  tokenCost: number;
  date: string | null;
  createdAt: string;
};

/**
 * 학생의 전체 QnA를 시간순 평탄 메시지 배열로 반환한다.
 * 루트(학생 질문)와 모든 답변(AI/선생님)을 하나의 타임라인으로 병합한다.
 * 모바일 `/api/mobile/qna`의 messages 셰이프와 동일한 멘탈모델을 웹에도 제공.
 */
export async function listStudentTimeline(
  studentId: string,
  options: { take?: number } = {},
): Promise<QnaTimelineMessage[]> {
  const rows = await prisma.questionMessage.findMany({
    where: { studentId },
    orderBy: { createdAt: "asc" },
    take: options.take,
    select: {
      id: true,
      sender: true,
      body: true,
      imageUrl: true,
      tokenCost: true,
      date: true,
      createdAt: true,
    },
  });

  return rows.map((r) => ({
    id: r.id,
    sender: r.sender === "me" || r.sender === "ai" ? r.sender : "tutor",
    body: r.body,
    imageUrl: r.imageUrl,
    tokenCost: r.tokenCost ?? 0,
    date: r.date ?? null,
    createdAt: r.createdAt.toISOString(),
  }));
}

type ListStudentQuestionsOptions = {
  date?: string;
  isResolved?: boolean;
  take?: number;
  skip?: number;
  orderBy?: "createdAt_desc" | "createdAt_asc";
};

/** 웹 UI가 기대하는 Question 셰이프 목록을 반환한다. */
export async function listStudentQuestions(
  studentId: string,
  options: ListStudentQuestionsOptions = {},
): Promise<LegacyQuestion[]> {
  const {
    date,
    isResolved,
    take,
    skip,
    orderBy = "createdAt_desc",
  } = options;

  const roots = await prisma.questionMessage.findMany({
    where: {
      studentId,
      sender: "me",
      replyToId: null,
      ...(date !== undefined ? { date } : {}),
      ...(isResolved !== undefined ? { isResolved } : {}),
    },
    orderBy: {
      createdAt: orderBy === "createdAt_desc" ? "desc" : "asc",
    },
    take,
    skip,
    select: {
      id: true,
      studentId: true,
      teacherId: true,
      body: true,
      imageUrl: true,
      date: true,
      isResolved: true,
      createdAt: true,
      replies: {
        select: {
          id: true,
          sender: true,
          teacherId: true,
          body: true,
          createdAt: true,
        },
      },
    },
  });

  return roots.map(rootToLegacyQuestion);
}

/** 웹 UI 셰이프의 단일 질문. */
export async function getStudentQuestion(
  id: string,
  studentId: string,
): Promise<LegacyQuestion | null> {
  const root = await prisma.questionMessage.findFirst({
    where: { id, studentId, sender: "me", replyToId: null },
    select: {
      id: true,
      studentId: true,
      teacherId: true,
      body: true,
      imageUrl: true,
      date: true,
      isResolved: true,
      createdAt: true,
      replies: {
        select: {
          id: true,
          sender: true,
          teacherId: true,
          body: true,
          createdAt: true,
        },
      },
    },
  });
  return root ? rootToLegacyQuestion(root) : null;
}

/**
 * 학생의 활성 매칭 중 첫 번째 강사 id를 반환한다.
 * 웹에서 질문 생성 시 teacherId를 자동으로 채워, 모바일 채팅에도 노출되게 한다.
 */
async function resolvePrimaryTeacherId(studentId: string): Promise<string | null> {
  const match = await prisma.teacherStudent.findFirst({
    where: { studentId, isActive: true },
    orderBy: { createdAt: "asc" },
    select: { teacherId: true },
  });
  return match?.teacherId ?? null;
}

type AskQuestionInput = {
  studentId: string;
  content: string;
  imageUrl?: string | null;
  /** 웹은 항상 date를 넣고, 모바일 채팅은 undefined. */
  date?: string;
  /**
   * 명시적으로 특정 강사와의 스레드로 저장하고 싶을 때. undefined면 활성 매칭에서 자동 해석.
   * null이면 강사 미지정으로 저장한다 (강사 배정 전 학생용).
   */
  teacherId?: string | null;
};

/** 학생 질문(루트 메시지) 생성. */
export async function askQuestion(input: AskQuestionInput) {
  const teacherId =
    input.teacherId === undefined
      ? await resolvePrimaryTeacherId(input.studentId)
      : input.teacherId;

  return prisma.questionMessage.create({
    data: {
      studentId: input.studentId,
      teacherId,
      sender: "me",
      body: input.content,
      imageUrl: input.imageUrl ?? null,
      date: input.date ?? null,
      replyToId: null,
    },
  });
}

type AnswerAsTeacherInput = {
  rootMessageId: string;
  teacherId: string;
  body: string;
};

/** 강사 답변 메시지 생성. */
export async function answerAsTeacher(input: AnswerAsTeacherInput) {
  return prisma.questionMessage.create({
    data: {
      studentId: (
        await prisma.questionMessage.findUniqueOrThrow({
          where: { id: input.rootMessageId },
          select: { studentId: true },
        })
      ).studentId,
      teacherId: input.teacherId,
      sender: "tutor",
      body: input.body,
      replyToId: input.rootMessageId,
    },
  });
}

type AnswerAsAiInput = {
  rootMessageId?: string; // 특정 학생 메시지에 대한 답변
  studentId: string;
  teacherId?: string | null;
  body: string;
  tokenCost?: number;
};

/** AI 답변 메시지 생성. */
export async function answerAsAi(input: AnswerAsAiInput) {
  return prisma.questionMessage.create({
    data: {
      studentId: input.studentId,
      teacherId: input.teacherId ?? null,
      sender: "ai",
      body: input.body,
      tokenCost: input.tokenCost ?? 0,
      replyToId: input.rootMessageId ?? null,
    },
  });
}

/** 학생이 루트 메시지를 "해결됨"으로 표시. */
export async function setResolved(
  rootMessageId: string,
  studentId: string,
  isResolved: boolean,
) {
  return prisma.questionMessage.updateMany({
    where: { id: rootMessageId, studentId, sender: "me", replyToId: null },
    data: { isResolved },
  });
}
