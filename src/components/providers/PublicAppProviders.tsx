"use client";

import type { ReactNode } from "react";

import { AppSessionProvider } from "@/components/providers/AppSessionProvider";
import { ConsultationSignupProvider } from "@/components/providers/ConsultationSignupProvider";

export function PublicAppProviders({ children }: { children: ReactNode }) {
  return (
    <AppSessionProvider>
      <ConsultationSignupProvider>{children}</ConsultationSignupProvider>
    </AppSessionProvider>
  );
}
