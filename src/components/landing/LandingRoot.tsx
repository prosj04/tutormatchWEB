"use client";

import type { LandingCmsContent } from "@/lib/cms";
import { LandingEditorial } from "@/components/landing/LandingEditorial";

type Props = {
  cms?: LandingCmsContent;
  isEditMode?: boolean;
};

export function LandingRoot({ cms, isEditMode = false }: Props) {
  return <LandingEditorial cms={cms} isEditMode={isEditMode} />;
}
