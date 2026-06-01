"use client";

import Image from "next/image";
import { useCallback, useRef, type TouchEvent } from "react";

import { PublicCardLine, PublicCardMultiline } from "@/components/landing/PublicCardText";
import { PUBLIC_CARD } from "@/lib/public-card-sizes";
import { circularStepDistance, processPaginationSizeClass } from "@/lib/process-pagination";

const PROCESS_CARD_WIDTH_PX = 380;
const CYLINDER_STAGE_HEIGHT_PX = 500;

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

function cylinderRadius(total: number) {
  if (total <= 1) return 0;
  return Math.round(PROCESS_CARD_WIDTH_PX / (2 * Math.tan(Math.PI / total)) + 72);
}

export function ProcessStepsCylinder({
  steps,
  index,
  onIndexChange,
}: {
  steps: ProcessStepItem[];
  index: number;
  onIndexChange: (next: number) => void;
}) {
  const total = steps.length;
  const touchStartX = useRef(0);
  const angleStep = total > 0 ? 360 / total : 0;
  const radius = cylinderRadius(total);

  const goPrev = useCallback(() => {
    onIndexChange(index === 0 ? total - 1 : index - 1);
  }, [index, onIndexChange, total]);

  const goNext = useCallback(() => {
    onIndexChange(index === total - 1 ? 0 : index + 1);
  }, [index, onIndexChange, total]);

  const onTouchStart = (event: TouchEvent) => {
    touchStartX.current = event.touches[0]?.clientX ?? 0;
  };

  const onTouchEnd = (event: TouchEvent) => {
    const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = endX - touchStartX.current;
    if (delta > 48) goPrev();
    else if (delta < -48) goNext();
  };

  if (total === 0) return null;

  if (total === 1) {
    const step = steps[0]!;
    return (
      <div className="mx-auto flex max-w-[380px] flex-col items-center">
        <ProcessStepFace step={step} stepIndex={0} />
      </div>
    );
  }

  return (
    <div className="relative select-none">
      <button
        type="button"
        onClick={goPrev}
        className="absolute left-2 top-[42%] z-10 -translate-y-1/2 px-1 py-1 text-xl font-black text-neutral-40 transition hover:text-primary sm:left-4 sm:text-2xl"
        aria-label="이전 단계"
      >
        ‹
      </button>
      <button
        type="button"
        onClick={goNext}
        className="absolute right-2 top-[42%] z-10 -translate-y-1/2 px-1 py-1 text-xl font-black text-neutral-40 transition hover:text-primary sm:right-4 sm:text-2xl"
        aria-label="다음 단계"
      >
        ›
      </button>
      <div
        className="relative mx-auto touch-pan-y overflow-hidden px-10 sm:px-14"
        style={{ height: CYLINDER_STAGE_HEIGHT_PX, maxWidth: "100%" }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="absolute left-1/2 top-[42%] w-0"
          style={{
            perspective: "1400px",
            perspectiveOrigin: "50% 50%",
          }}
        >
          <div
            className="motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-out motion-reduce:transition-none"
            style={{
              transformStyle: "preserve-3d",
              transform: `translate(-50%, -50%) rotateY(${-index * angleStep}deg)`,
            }}
          >
            {steps.map((step, stepIndex) => {
              const distance = circularStepDistance(stepIndex, index, total);
              const page = processStepPageNumber(step, stepIndex);
              const isActive = distance === 0;
              const faceOpacity = distance === 0 ? 1 : distance === 1 ? 0.88 : 0.45;

              return (
                <div
                  key={step.number}
                  className="absolute left-1/2 top-0 motion-safe:transition-[opacity,filter] motion-safe:duration-500 motion-reduce:transition-none"
                  style={{
                    width: PROCESS_CARD_WIDTH_PX,
                    marginLeft: -PROCESS_CARD_WIDTH_PX / 2,
                    transformStyle: "preserve-3d",
                    transform: `rotateY(${stepIndex * angleStep}deg) translateZ(${radius}px)`,
                    backfaceVisibility: "hidden",
                    opacity: faceOpacity,
                    filter: isActive ? "none" : `brightness(${distance === 1 ? 0.97 : 0.92})`,
                    pointerEvents: distance <= 1 ? "auto" : "none",
                  }}
                >
                  <div className="flex flex-col items-center">
                    <ProcessStepFace step={step} stepIndex={stepIndex} />
                    <button
                      type="button"
                      onClick={() => onIndexChange(stepIndex)}
                      className={`mt-5 min-w-[1.25rem] px-0.5 py-1 font-black tabular-nums transition hover:text-neutral-100 ${processPaginationSizeClass(
                        distance,
                        isActive,
                      )}`}
                      aria-label={`${page}번 단계`}
                      aria-current={isActive ? "page" : undefined}
                    >
                      {page}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProcessStepFace({ step, stepIndex }: { step: ProcessStepItem; stepIndex: number }) {
  return (
    <article
      className={`${PUBLIC_CARD.processWidth} overflow-hidden rounded-[20px] border border-neutral-20 bg-white shadow-sm`}
    >
      <div className={`relative w-full ${PUBLIC_CARD.processImageHeight}`}>
        <Image
          src={step.img}
          alt={step.title}
          fill
          className="object-cover"
          sizes="380px"
          priority={stepIndex === 0}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <span className="absolute bottom-4 left-5 text-4xl font-black leading-none text-white/20">
          {step.number}
        </span>
      </div>
      <div className="min-w-0 p-6">
        <PublicCardLine className="text-xl font-black text-neutral-100">{step.title}</PublicCardLine>
        <div className="mt-2">
          <PublicCardMultiline text={step.desc} lineClassName="text-sm font-medium text-neutral-80" />
        </div>
      </div>
    </article>
  );
}
