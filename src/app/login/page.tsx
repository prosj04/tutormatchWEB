import { Suspense } from "react";

import { LoginForm } from "./LoginForm";

function LoginFallback() {
  return (
    <main>
      <div className="auth-wrap">
        <div className="auth-bg" />
        <div className="auth-card reveal in">
          <div className="brand">
            Concord<span>.</span>
          </div>
          <h1>다시 오신 것을 환영해요</h1>
          <p className="sub">학습 플래너와 상담 내역을 확인하세요.</p>
        </div>
      </div>
    </main>
  );
}

export const metadata = {
  title: "로그인",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
