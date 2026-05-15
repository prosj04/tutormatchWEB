import { ManagerMonitoringPage } from "@/components/teacher-portal/ManagerMonitoringPage";
import { requireManagerPage } from "@/lib/manager-page-auth";

export const metadata = { title: "모니터링" };

export default async function MonitoringPage() {
  await requireManagerPage();
  return <ManagerMonitoringPage />;
}
