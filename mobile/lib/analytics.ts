import { API_BASE } from "./api";
import { getAccessToken } from "./auth";

export const ANALYTICS_EVENTS = {
  homeViewed: "home_viewed",
  homeEmptyTodayLessonViewed: "home_empty_today_lesson_viewed",
  homeCtaClicked: "home_cta_clicked",
  learningViewed: "learning_viewed",
  learningEmptyTasksViewed: "learning_empty_tasks_viewed",
  learningEmptyReportViewed: "learning_empty_report_viewed",
  qnaViewed: "qna_viewed",
  qnaEmptyNoTeacherViewed: "qna_empty_no_teacher_viewed",
  qnaFirstQuestionClicked: "qna_first_question_clicked",
  consultationSubmitted: "consultation_submitted",
  consultationPostSignupClicked: "consultation_post_signup_clicked",
  consultationStatusViewClicked: "consultation_status_view_clicked",
  journeyStatusViewed: "journey_status_viewed",
} as const;

type AnalyticsPayload = Record<string, string | number | boolean | null>;

/** 앱 이벤트 전송 (fire-and-forget, 204 응답 대응) */
export function trackEvent(
  name: string,
  payload?: AnalyticsPayload,
): void {
  void getAccessToken().then((token) =>
    fetch(`${API_BASE}/api/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ name, payload, platform: "mobile" }),
    }),
  ).catch(() => {});
}
