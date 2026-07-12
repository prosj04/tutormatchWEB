"use client";

import { useCallback, useEffect, useState } from "react";
import type { PricingSchoolTier } from "@/lib/pricing-plans";

const STORAGE_KEY = "premium-tutoring-pricing-school-tier";

function readStoredTier(): PricingSchoolTier | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw === "middle" || raw === "high") return raw;
  } catch {
    /* ignore */
  }
  return null;
}

/** 홈·요금제 페이지에서 학년 탭 상태를 통일 (세션 저장) */
export function usePricingSchoolTier(): [PricingSchoolTier, (next: PricingSchoolTier) => void] {
  const [tier, setTierState] = useState<PricingSchoolTier>("high");

  useEffect(() => {
    const stored = readStoredTier();
    if (stored !== null) setTierState(stored);
  }, []);

  const setTier = useCallback((next: PricingSchoolTier) => {
    setTierState(next);
    try {
      sessionStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  return [tier, setTier];
}
