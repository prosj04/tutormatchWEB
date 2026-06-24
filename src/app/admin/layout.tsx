import "../portal-design.css";

import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/AdminShell";
import { PortalDesignProvider } from "@/components/providers/PortalDesignProvider";
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
    <PortalDesignProvider>
      <AdminShell email={session.user.email ?? ""}>{children}</AdminShell>
    </PortalDesignProvider>
  );
}
