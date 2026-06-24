"use client";

import { useTheme } from "@/hooks/useTheme";
import type { LandingCmsContent } from "@/lib/cms";
import { LandingPage } from "@/components/landing/LandingPage";
import { LandingPageThemed } from "@/components/landing/LandingPageThemed";

type Props = {
  cms?: LandingCmsContent;
  isEditMode?: boolean;
};

export function LandingRoot({ cms, isEditMode }: Props) {
  const [theme] = useTheme();

  if (theme === "light-lime" || theme === "dark-blue") {
    return <LandingPageThemed cms={cms} isEditMode={isEditMode} />;
  }

  return <LandingPage cms={cms} isEditMode={isEditMode} />;
}
