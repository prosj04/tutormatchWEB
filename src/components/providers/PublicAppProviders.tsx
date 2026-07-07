"use client";

import type { ReactNode } from "react";

import { AppSessionProvider } from "@/components/providers/AppSessionProvider";
import { ConsultationSignupProvider } from "@/components/providers/ConsultationSignupProvider";

export function PublicAppProviders({
  children,
  signupCopy,
}: {
  children: ReactNode;
  signupCopy?: Record<string, string>;
}) {
  return (
    <AppSessionProvider>
      <ConsultationSignupProvider copy={signupCopy}>{children}</ConsultationSignupProvider>
    </AppSessionProvider>
  );
}
