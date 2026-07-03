"use client";

import { useEffect } from "react";
import Link from "next/link";

import { useConsultationSignup } from "@/components/providers/ConsultationSignupProvider";

export default function RegisterPage() {
  const { open } = useConsultationSignup();

  useEffect(() => {
    open();
  }, [open]);

  return (
    <div className="auth-wrap">
      <div className="auth-bg" aria-hidden />
      <div className="auth-card">
        <div className="brand">
          Concord<span>.</span>
        </div>
        <h1>회원가입</h1>
        <p className="sub">
          회원가입/상담 신청 창을 열고 있어요. 창이 보이지 않으면 아래 버튼을 눌러 다시 열어주세요.
        </p>
        <button type="button" onClick={open} className="btn btn-acc btn-block">
          회원가입/상담 신청 열기
        </button>
        <div className="auth-alt">
          이미 계정이 있으신가요? <Link href="/login">로그인</Link>
          <div style={{ marginTop: 10 }}>
            <Link href="/">홈으로 돌아가기</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
