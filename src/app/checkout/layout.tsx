import { PublicShell } from "@/components/layout/PublicShell";

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicShell>{children}</PublicShell>;
}
