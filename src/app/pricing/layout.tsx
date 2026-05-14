import { PublicShell } from "@/components/layout/PublicShell";

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicShell>{children}</PublicShell>;
}
