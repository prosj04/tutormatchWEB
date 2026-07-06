import { redirect } from "next/navigation";

/** 개별 강사 상세 페이지는 큐레이션 개편으로 제거됨 — 강사 목록으로 리다이렉트. */
export default function TutorProfileRedirect() {
  redirect("/tutors");
}
