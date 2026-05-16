"use client";

import Link from "next/link";

import { LikeButton } from "./LikeButton";

type TutorConsultSidebarProps = {
  tutorId: string;
};

export function TutorConsultSidebar({ tutorId }: TutorConsultSidebarProps) {
  return (
    <div className="rounded-[28px] border border-neutral-80 bg-neutral-100 p-8 text-white shadow-sm">
      <h2 className="text-center font-sans text-xl font-black text-white">
        이 선생님이 마음에 드셨나요?
      </h2>
      <div className="mt-6 flex justify-center">
        <LikeButton tutorId={tutorId} size="lg" label showCount />
      </div>
      <hr className="my-8 border-neutral-80" />
      <p className="text-center text-sm font-medium leading-relaxed text-neutral-30">
        매니저와 상담 후 이 선생님을 요청해보세요
      </p>
      <Link
        href="/dashboard/consultation"
        className="mt-6 flex w-full items-center justify-center rounded-2xl bg-primary py-4 text-sm font-black text-white transition hover:bg-primary/90"
      >
        무료 상담 예약하기
      </Link>
    </div>
  );
}
