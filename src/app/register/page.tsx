"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useConsultationSignup } from "@/components/providers/ConsultationSignupProvider";

export default function RegisterPage() {
  const router = useRouter();
  const { open } = useConsultationSignup();

  useEffect(() => {
    open();
    router.replace("/");
  }, [open, router]);

  return null;
}
