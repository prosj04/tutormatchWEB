import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/AdminShell";
import { auth } from "@/auth";

export const metadata = {
  title: "관리자 패널",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <AdminShell email={session.user.email ?? ""}>{children}</AdminShell>
  );
}
