import { PublicShell } from "@/components/layout/PublicShell";

export const revalidate = 300;

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicShell>{children}</PublicShell>;
}
