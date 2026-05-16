"use client";

import Link from "next/link";

import { LikeButton } from "./LikeButton";

type TutorConsultSidebarProps = {
  tutorId: string;
};

export function TutorConsultSidebar({ tutorId }: TutorConsultSidebarProps) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
      <h2 className="text-center font-display text-xl font-bold text-navy">
        이 선생님이 마음에 드셨나요?
      </h2>
      <div className="mt-6 flex justify-center">
        <LikeButton tutorId={tutorId} size="lg" label showCount />
      </div>
      <hr className="my-8 border-gray-100" />
      <p className="text-center text-sm leading-relaxed text-text-mid">
        매니저와 상담 후 이 선생님을 요청해보세요
      </p>
      <Link
        href="/dashboard/consultation"
        className="mt-6 flex w-full items-center justify-center rounded-2xl bg-gold py-4 text-sm font-semibold text-navy transition hover:bg-gold/90"
      >
        무료 상담 예약하기
      </Link>
    </div>
  );
}
