"use client";

import Link from "next/link";
import { useState } from "react";

type Plan = "4" | "8";

const prices: Record<Plan, string> = {
  "4": "40만원",
  "8": "72만원",
};

type TutorBookingSidebarProps = {
  tutorId: string;
};

export function TutorBookingSidebar({ tutorId }: TutorBookingSidebarProps) {
  const [plan, setPlan] = useState<Plan>("4");

  const href = `/checkout?tutor=${tutorId}&sessions=${plan}`;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wider text-text-mid">
        Enrollment
      </p>
      <h2 className="mt-3 text-xl font-black text-text-dark">수업 플랜</h2>

      <div className="mt-8 space-y-3">
        <button
          type="button"
          onClick={() => setPlan("4")}
          className={`flex w-full items-center justify-between rounded-xl border px-4 py-3.5 text-left text-sm transition ${
            plan === "4"
              ? "border-primary bg-primary/5 text-text-dark"
              : "border-gray-200 text-text-mid hover:border-gray-300"
          }`}
        >
          <span className="font-semibold">4회 패키지</span>
          <span className="text-lg font-black text-primary">40만원</span>
        </button>
        <button
          type="button"
          onClick={() => setPlan("8")}
          className={`flex w-full items-center justify-between rounded-xl border px-4 py-3.5 text-left text-sm transition ${
            plan === "8"
              ? "border-primary bg-primary/5 text-text-dark"
              : "border-gray-200 text-text-mid hover:border-gray-300"
          }`}
        >
          <span className="font-semibold">8회 패키지</span>
          <span className="text-lg font-black text-primary">72만원</span>
        </button>
      </div>

      <div className="mt-8 border-t border-gray-100 pt-6">
        <p className="text-xs uppercase tracking-wider text-text-light">선택 금액</p>
        <p className="mt-2 text-3xl font-black tracking-tight text-text-dark">{prices[plan]}</p>
        <p className="mt-2 text-xs leading-relaxed text-text-light">
          VAT 별도 · 매니저 배정 후 일정 확정
        </p>
      </div>

      <Link
        href={href}
        className="mt-8 flex w-full items-center justify-center rounded-2xl bg-primary py-4 text-sm font-semibold tracking-wide text-white transition hover:bg-primary/90"
      >
        수업 신청하기
      </Link>
    </div>
  );
}
