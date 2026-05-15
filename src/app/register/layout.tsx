import { PublicShell } from "@/components/layout/PublicShell";

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicShell>{children}</PublicShell>;
}
