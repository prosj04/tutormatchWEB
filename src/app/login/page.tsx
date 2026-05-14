import { Suspense } from "react";

import { LoginForm } from "./LoginForm";

function LoginFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-navy px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-10 shadow-[0_24px_60px_rgba(15,30,60,0.18)]">
        <p className="text-center text-sm text-navy/50">불러오는 중…</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
