/** 분석 이벤트 이름 (웹/앱 공통) */
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

  webDashboardViewed: "web_dashboard_viewed",
  webDashboardRedirectConsultation: "web_dashboard_redirect_consultation",

  consultationSubmitted: "consultation_submitted",
  consultationPostSignupClicked: "consultation_post_signup_clicked",
  studentRegistered: "student_registered",
  journeyActiveReached: "journey_active_reached",
  landingConsultationCtaClicked: "landing_consultation_cta_clicked",
  consultationStatusViewClicked: "consultation_status_view_clicked",

  journeyStatusViewed: "journey_status_viewed",
} as const;

export type AnalyticsEventName =
  (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

export type AnalyticsPayload = Record<string, string | number | boolean | null>;
