import { PublicShell } from "@/components/layout/PublicShell";

export const dynamic = "force-dynamic";

export default function SuccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicShell>{children}</PublicShell>;
}
