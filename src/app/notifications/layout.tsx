import "@/app/concord-portal.css";
import "@/app/concord-bridge.css";

import { StudentPortalShell } from "@/components/concord-portal/StudentPortalShell";

export const dynamic = "force-dynamic";

export default function NotificationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <StudentPortalShell>{children}</StudentPortalShell>;
}
