"use client";

import dynamic from "next/dynamic";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const ConsultationSignupModal = dynamic(
  () =>
    import("@/components/auth/ConsultationSignupModal").then(
      (mod) => mod.ConsultationSignupModal,
    ),
  { ssr: false },
);

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

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => {
    setIsOpen(false);
    setInstantEnroll(false);
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("signup") !== "1") return;

    setIsOpen(true);
    setInstantEnroll(url.searchParams.get("instant") === "1");

    url.searchParams.delete("signup");
    url.searchParams.delete("instant");
    const nextHref = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState(window.history.state, "", nextHref || url.pathname);
  }, []);

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
      {isOpen ? (
        <ConsultationSignupModal open={isOpen} onClose={close} instantEnroll={instantEnroll} />
      ) : null}
    </ConsultationSignupContext.Provider>
  );
}
