"use client";

import Image from "next/image";
import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

import { PublicCardLine, PublicCardMultiline } from "@/components/landing/PublicCardText";
import { PUBLIC_CARD } from "@/lib/public-card-sizes";
import {
  buildProcessPaginationSlots,
  processPaginationSizeClass,
} from "@/lib/process-pagination";

export type ProcessStepItem = {
  number: string;
  title: string;
  desc: string;
  img: string;
};

function processStepPageNumber(step: ProcessStepItem, index: number) {
  const parsed = Number.parseInt(step.number, 10);
  return Number.isFinite(parsed) ? parsed : index + 1;
}

export function ProcessStepsCarousel({
  steps,
  index,
  onIndexChange,
}: {
  steps: ProcessStepItem[];
  index: number;
  onIndexChange: (next: number) => void;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const total = steps.length;

  const scrollToIndex = useCallback((next: number, behavior: ScrollBehavior = "smooth") => {
    const viewport = viewportRef.current;
    const card = cardRefs.current[next];
    if (!viewport || !card) return;
    const left = card.offsetLeft - (viewport.clientWidth - card.clientWidth) / 2;
    viewport.scrollTo({ left, behavior });
  }, []);

  useLayoutEffect(() => {
    scrollToIndex(index, "auto");
  }, [index, scrollToIndex, steps.length]);

  useEffect(() => {
    const onResize = () => scrollToIndex(index, "auto");
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [index, scrollToIndex]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    let frameId = 0;
    const onScroll = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(() => {
        frameId = 0;
        const center = viewport.scrollLeft + viewport.clientWidth / 2;
        let bestIndex = 0;
        let bestDist = Number.POSITIVE_INFINITY;
        for (let i = 0; i < total; i++) {
          const card = cardRefs.current[i];
          if (!card) continue;
          const cardCenter = card.offsetLeft + card.clientWidth / 2;
          const dist = Math.abs(cardCenter - center);
          if (dist < bestDist) {
            bestDist = dist;
            bestIndex = i;
          }
        }
        if (bestIndex !== index) onIndexChange(bestIndex);
      });
    };
    viewport.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      if (frameId) window.cancelAnimationFrame(frameId);
      viewport.removeEventListener("scroll", onScroll);
    };
  }, [index, onIndexChange, total]);

  const goPrev = () => onIndexChange(index === 0 ? total - 1 : index - 1);
  const goNext = () => onIndexChange(index === total - 1 ? 0 : index + 1);

  return (
    <>
      <div ref={viewportRef} className="scrollbar-hide overflow-x-auto overscroll-x-contain">
        <div className="flex w-max snap-x snap-mandatory gap-6">
          <div className={`${PUBLIC_CARD.processSpacer} shrink-0`} aria-hidden />
          {steps.map((step, stepIndex) => (
            <article
              key={step.number}
              ref={(node) => {
                cardRefs.current[stepIndex] = node;
              }}
              className={`${PUBLIC_CARD.processWidth} shrink-0 snap-center overflow-hidden rounded-[20px] border border-neutral-20 bg-white shadow-sm`}
            >
              <div className={`relative w-full ${PUBLIC_CARD.processImageHeight}`}>
                <Image
                  src={step.img}
                  alt={step.title}
                  fill
                  className="object-cover"
                  sizes="380px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <span className="absolute bottom-4 left-5 text-4xl font-black leading-none text-white/20">
                  {step.number}
                </span>
              </div>
              <div className="min-w-0 p-6">
                <PublicCardLine className="text-xl font-black text-neutral-100">{step.title}</PublicCardLine>
                <div className="mt-2">
                  <PublicCardMultiline
                    text={step.desc}
                    lineClassName="text-sm font-medium text-neutral-80"
                  />
                </div>
              </div>
            </article>
          ))}
          <div className={`${PUBLIC_CARD.processSpacer} shrink-0`} aria-hidden />
        </div>
      </div>
      {total > 1 ? (
        <div className="mt-6 flex items-center justify-center gap-2 tabular-nums sm:gap-3">
          <button
            type="button"
            onClick={goPrev}
            className="px-1 py-1 text-xl font-black text-neutral-40 transition hover:text-primary sm:text-2xl"
            aria-label="이전 단계"
          >
            ‹
          </button>
          {buildProcessPaginationSlots(index, total).map((slot, slotIndex) => {
            if (slot.kind === "empty") {
              return (
                <span
                  key={slot.key}
                  className="min-w-[1.25rem] px-0.5 py-1 text-sm font-black text-transparent sm:text-base"
                  aria-hidden
                >
                  0
                </span>
              );
            }

            const step = steps[slot.stepIndex]!;
            const page = processStepPageNumber(step, slot.stepIndex);
            const isActive = slot.stepIndex === index;
            const distance = Math.abs(slot.stepIndex - index);

            return (
              <button
                key={`step-page-${step.number}-${slot.stepIndex}-${slotIndex}`}
                type="button"
                onClick={() => {
                  onIndexChange(slot.stepIndex);
                  scrollToIndex(slot.stepIndex);
                }}
                className={`min-w-[1.25rem] px-0.5 py-1 font-black transition hover:text-neutral-100 ${processPaginationSizeClass(
                  distance,
                  isActive,
                )}`}
                aria-label={`${page}번 단계`}
                aria-current={isActive ? "page" : undefined}
              >
                {page}
              </button>
            );
          })}
          <button
            type="button"
            onClick={goNext}
            className="px-1 py-1 text-xl font-black text-neutral-40 transition hover:text-primary sm:text-2xl"
            aria-label="다음 단계"
          >
            ›
          </button>
        </div>
      ) : null}
    </>
  );
}
