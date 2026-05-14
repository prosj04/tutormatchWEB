import { PublicShell } from "@/components/layout/PublicShell";

export default function SuccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicShell>{children}</PublicShell>;
}
