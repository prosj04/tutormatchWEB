import { ManagerConsultationsPage } from "@/components/teacher-portal/ManagerConsultationsPage";
import { requireManagerPage } from "@/lib/manager-page-auth";

export const metadata = { title: "상담 관리" };

export default async function ConsultationsPage() {
  await requireManagerPage();
  return <ManagerConsultationsPage />;
}
