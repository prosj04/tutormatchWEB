import { PublicShell } from "@/components/layout/PublicShell";

export const revalidate = 300;

export default function TutorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicShell>{children}</PublicShell>;
}
