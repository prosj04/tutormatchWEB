"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useSession } from "next-auth/react";

import { useConsultationSignup } from "@/components/providers/ConsultationSignupProvider";
import { ANALYTICS_EVENTS } from "@/lib/analytics-events";
import { trackEvent } from "@/lib/analytics-client";

export const STUDENT_CONSULTATION_PATH = "/dashboard/consultation";

/**
 * 사이트 헤더 「상담 신청」과 동일: 비로그인 → 상담 가입 모달, 학생 → 상담 신청 페이지,
 * 그 외 역할 → 해당 포털 메인.
 */
export function useConsultationCta() {
  const { data: session, status } = useSession();
  const { open: openConsultationSignup } = useConsultationSignup();
  const router = useRouter();

  return useCallback((source = "unknown") => {
    if (status === "loading") return;

    trackEvent(ANALYTICS_EVENTS.landingConsultationCtaClicked, { source });

    if (!session?.user) {
      openConsultationSignup();
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
    if (role === "TEACHER" || role === "MANAGER") {
      router.push("/teacher-portal/dashboard");
      return;
    }

    router.push(STUDENT_CONSULTATION_PATH);
  }, [status, session, openConsultationSignup, router]);
}
