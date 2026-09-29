"use client";

import { useEffect, useRef, useState } from "react";

/* ─── 스크롤 등장 (.reveal → .in, 1회) ─── */
export function useReveal() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -6% 0px" },
    );
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
    return () => {
      io.disconnect();
    };
  }, []);
}

/** 탭 우선 잠금: 최근 탭 이후 이 시간(ms)동안 중앙 자동 활성화를 억제 */
const TAP_LOCK_MS = 1600;

/**
 * 모바일/태블릿: 스크롤 시 화면 중앙에 가장 가까운 항목을 자동 활성화.
 * hover가 없는 터치 기기에서 탭 선택이 곧바로 스크롤에 덮이지 않도록,
 * manualLockRef(최근 탭 시각)가 유효한 동안 중앙 감지를 건너뛴다(탭 우선).
 */
export function useMobileCenterActive(
  listRef: React.RefObject<HTMLElement | null>,
  setActive: React.Dispatch<React.SetStateAction<number>>,
  manualLockRef?: React.MutableRefObject<number>,
) {
  useEffect(() => {
    if (!window.matchMedia("(max-width: 760px)").matches) return;
    const list = listRef.current;
    if (!list) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        if (manualLockRef && Date.now() - manualLockRef.current < TAP_LOCK_MS) return;
        const mid = window.innerHeight / 2;
        let best = -1;
        let bestDist = Infinity;
        Array.from(list.children).forEach((el, i) => {
          const r = (el as HTMLElement).getBoundingClientRect();
          if (r.bottom < 0 || r.top > window.innerHeight) return;
          const d = Math.abs(r.top + r.height / 2 - mid);
          if (d < bestDist) {
            bestDist = d;
            best = i;
          }
        });
        if (best >= 0) setActive((prev) => (prev === best ? prev : best));
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [listRef, setActive, manualLockRef]);
}

/**
 * 목록 히트박스 좌우 확장: 컨테이너 위 세로 위치(clientY)로 어느 자식 행인지 계산해 활성화.
 * 가로 위치와 무관하게 같은 높이(행)면 인식된다. hover 가능한 기기에서만 동작(터치 탭 우선 보존).
 */
export function makeRowHoverMove(
  setActive: React.Dispatch<React.SetStateAction<number>>,
  manualLockRef?: React.MutableRefObject<number>,
  listRef?: React.RefObject<HTMLElement | null>,
) {
  return (e: React.MouseEvent<HTMLElement>) => {
    if (typeof window !== "undefined" && !window.matchMedia("(hover: hover)").matches) return;
    if (manualLockRef && Date.now() - manualLockRef.current < TAP_LOCK_MS) return;
    const list = listRef?.current ?? e.currentTarget;
    const y = e.clientY;
    const rows = list.children;
    for (let i = 0; i < rows.length; i++) {
      const r = (rows[i] as HTMLElement).getBoundingClientRect();
      if (y >= r.top && y <= r.bottom) {
        setActive((prev) => (prev === i ? prev : i));
        return;
      }
    }
  };
}

/**
 * 아코디언 상태: 기본 닫힘(null), 같은 항목 재클릭 시 닫힘, 영역 밖 클릭 시 닫힘. (오너 확정 규칙)
 * 터치 기기에서는 탭 잠금 시각을 기록해 스크롤 중앙 감지보다 탭을 우선한다.
 */
export function useAccordion(tapLockRef?: React.MutableRefObject<number>) {
  const [open, setOpen] = useState<number | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open === null) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      const root = rootRef.current;
      if (!root) return;
      if (e.target instanceof Node && root.contains(e.target)) return;
      setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    document.addEventListener("pointerdown", onDown as EventListener);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown as EventListener);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = (index: number) => {
    if (typeof window !== "undefined" && tapLockRef && window.matchMedia("(hover: none)").matches) {
      tapLockRef.current = Date.now();
    }
    setOpen((prev) => (prev === index ? null : index));
  };

  return { open, toggle, rootRef };
}
