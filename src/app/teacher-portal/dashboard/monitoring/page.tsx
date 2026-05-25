import { ManagerMonitoringPage } from "@/components/teacher-portal/ManagerMonitoringPage";
import { getManagerMonitoringData } from "@/lib/manager-portal-data";
import { requireManagerPage } from "@/lib/manager-page-auth";

export const metadata = { title: "모니터링" };

export default async function MonitoringPage() {
  const { teacher } = await requireManagerPage();
  const initialData = await getManagerMonitoringData(teacher.id);

  return (
    <ManagerMonitoringPage
      initialOverview={initialData.overview}
      initialStudents={initialData.students}
    />
  );
}
