import { ManagerConsultationsPage } from "@/components/teacher-portal/ManagerConsultationsPage";
import { getManagerWaitingConsultations } from "@/lib/manager-portal-data";
import { requireManagerPage } from "@/lib/manager-page-auth";

export const metadata = { title: "상담 관리" };

export default async function ConsultationsPage() {
  await requireManagerPage();
  const initialWaiting = await getManagerWaitingConsultations();

  return (
    <ManagerConsultationsPage
      initialWaiting={initialWaiting}
      initialMine={[]}
      initialMineLoaded={false}
    />
  );
}
