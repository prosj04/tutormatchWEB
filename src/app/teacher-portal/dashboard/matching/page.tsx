import { ManagerMatchingPage } from "@/components/teacher-portal/ManagerMatchingPage";
import { getManagerMatchingData } from "@/lib/manager-portal-data";
import { requireManagerPage } from "@/lib/manager-page-auth";

export const metadata = { title: "매칭 관리" };

export default async function MatchingPage() {
  const { teacher } = await requireManagerPage();
  const initialData = await getManagerMatchingData(teacher.id);

  return (
    <ManagerMatchingPage
      initialStudents={initialData.students}
      initialTeachers={initialData.teachers}
    />
  );
}
