"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useSession } from "next-auth/react";

import { ANALYTICS_EVENTS } from "@/lib/analytics-events";
import { trackEvent } from "@/lib/analytics-client";

export const STUDENT_CONSULTATION_PATH = "/dashboard/consultation";
export const PUBLIC_CONSULT_PATH = "/consult";

/**
 * 사이트 헤더 「상담 신청」과 동일: 비로그인 → 공개 상담신청 페이지(/consult),
 * 학생 → 상담 신청 페이지, 그 외 역할 → 해당 포털 메인.
 */
export function useConsultationCta() {
  const { data: session, status } = useSession();
  const router = useRouter();

  return useCallback((source = "unknown") => {
    if (status === "loading") return;

    trackEvent(ANALYTICS_EVENTS.landingConsultationCtaClicked, { source });

    if (!session?.user) {
      router.push(`${PUBLIC_CONSULT_PATH}?source=${encodeURIComponent(source)}`);
      return;
    }

    const role = session.user.role;
    if (role === "STUDENT") {
      router.push(STUDENT_CONSULTATION_PATH);
      return;
    }
    if (role === "ADMIN") {
      router.push("/admin");
      return;
    }
    if (role === "TEACHER" || role === "MANAGER" || role === "CHIEF_MANAGER") {
      router.push("/teacher-portal/dashboard");
      return;
    }

    router.push(STUDENT_CONSULTATION_PATH);
  }, [status, session, router]);
}
