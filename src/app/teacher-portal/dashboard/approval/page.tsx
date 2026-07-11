import { ManagerApprovalPage } from "@/components/teacher-portal/ManagerApprovalPage";
import { requireManagerPage } from "@/lib/manager-page-auth";

export const metadata = { title: "선생님 승인" };

export default async function ApprovalPage() {
  await requireManagerPage();

  return <ManagerApprovalPage />;
}
