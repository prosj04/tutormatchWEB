/** 모바일 알림 목록 섹션 분류 */
export function getNotificationCategory(type: string): string {
  switch (type) {
    case "NEW_BOOKING":
    case "BOOKING_CONFIRMED":
    case "TEACHER_ASSIGNED":
    case "NEW_STUDENT_ASSIGNED":
    case "VISIT_TIMES_UPDATED":
      return "수업";
    case "TEACHER_COMMENT":
    case "PROGRESS_WARNING":
    case "PROGRESS_DANGER":
      return "리포트 · 학습";
    case "NEW_QUESTION":
    case "TEACHER_ANSWERED":
    case "QUESTION_UNANSWERED":
    case "NEW_STUDENT_WAITING":
      return "메시지";
    default:
      return "기타";
  }
}
