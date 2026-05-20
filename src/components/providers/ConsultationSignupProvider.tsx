"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { ConsultationSignupModal } from "@/components/auth/ConsultationSignupModal";

type ConsultationSignupContextValue = {
  open: () => void;
  close: () => void;
  isOpen: boolean;
};

const ConsultationSignupContext = createContext<ConsultationSignupContextValue | null>(null);

export function useConsultationSignup() {
  const ctx = useContext(ConsultationSignupContext);
  if (!ctx) {
    throw new Error("useConsultationSignup must be used within ConsultationSignupProvider");
  }
  return ctx;
}

export function ConsultationSignupProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [instantEnroll, setInstantEnroll] = useState(false);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => {
    setIsOpen(false);
    setInstantEnroll(false);
  }, []);

  useEffect(() => {
    if (searchParams.get("signup") === "1") {
      setIsOpen(true);
      setInstantEnroll(searchParams.get("instant") === "1");
      const params = new URLSearchParams(searchParams.toString());
      params.delete("signup");
      params.delete("instant");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }
  }, [searchParams, pathname, router]);

  const value = useMemo(
    () => ({
      open,
      close,
      isOpen,
    }),
    [open, close, isOpen],
  );

  return (
    <ConsultationSignupContext.Provider value={value}>
      {children}
      <ConsultationSignupModal open={isOpen} onClose={close} instantEnroll={instantEnroll} />
    </ConsultationSignupContext.Provider>
  );
}
