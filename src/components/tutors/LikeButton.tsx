"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";

import { isLiked, mockLikeCount, toggleLike } from "@/lib/liked-tutors";

type LikeButtonProps = {
  tutorId: string;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
  className?: string;
  label?: boolean;
};

export function LikeButton({
  tutorId,
  size = "md",
  showCount = false,
  className = "",
  label = false,
}: LikeButtonProps) {
  const router = useRouter();
  const { status } = useSession();
  const [liked, setLiked] = useState(false);
  const [tooltip, setTooltip] = useState(false);

  useEffect(() => {
    setLiked(isLiked(tutorId));
  }, [tutorId]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (status !== "authenticated") {
        setTooltip(true);
        window.setTimeout(() => {
          setTooltip(false);
          router.push("/login");
        }, 1200);
        return;
      }

      setLiked(toggleLike(tutorId));
    },
    [status, tutorId, router],
  );

  const iconSize =
    size === "lg" ? "h-8 w-8" : size === "sm" ? "h-5 w-5" : "h-6 w-6";
  const btnPad =
    size === "lg" ? "p-4" : size === "sm" ? "p-1.5" : "p-2";

  return (
    <div className={`relative inline-flex flex-col items-center ${className}`}>
      {tooltip ? (
        <span className="absolute -top-10 left-1/2 z-10 w-max max-w-[200px] -translate-x-1/2 rounded-lg bg-navy px-2 py-1 text-center text-xs text-white shadow-md">
          로그인 후 찜하기 가능합니다
        </span>
      ) : null}
      <button
        type="button"
        onClick={handleClick}
        aria-label={liked ? "찜 해제" : "찜하기"}
        aria-pressed={liked}
        className={`rounded-full transition ${btnPad} ${
          liked ? "bg-gold/15 text-gold" : "bg-white/90 text-text-mid hover:text-gold"
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill={liked ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="2"
          className={iconSize}
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </button>
      {label ? (
        <span className="mt-2 text-sm font-medium text-text-dark">
          {liked ? "찜 완료" : "찜하기"}
        </span>
      ) : null}
      {showCount ? (
        <span className="mt-1 text-xs text-text-mid">
          {mockLikeCount(tutorId)}명이 찜함
        </span>
      ) : null}
    </div>
  );
}
