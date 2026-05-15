import { ManagerMatchingPage } from "@/components/teacher-portal/ManagerMatchingPage";
import { requireManagerPage } from "@/lib/manager-page-auth";

export const metadata = { title: "매칭 관리" };

export default async function MatchingPage() {
  await requireManagerPage();
  return <ManagerMatchingPage />;
}
