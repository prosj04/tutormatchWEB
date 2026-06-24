"use client";

import type { LandingCmsContent } from "@/lib/cms";
import { LandingPageV2 } from "@/components/landing/LandingPageV2";

type Props = {
  cms?: LandingCmsContent;
  isEditMode?: boolean;
};

export function LandingRoot({ cms }: Props) {
  return <LandingPageV2 cms={cms} />;
}
