import { ManagerMatchingPage } from "@/components/teacher-portal/ManagerMatchingPage";
import { getManagerMatchingData } from "@/lib/manager-portal-data";
import { requireManagerPage } from "@/lib/manager-page-auth";

export const metadata = { title: "매칭 관리" };

export default async function MatchingPage(
  props: {
    searchParams?: Promise<{ student?: string | string[] }>;
  }
) {
  const searchParams = await props.searchParams;
  const { teacher } = await requireManagerPage();
  const initialData = await getManagerMatchingData(teacher.id);
  const studentParam = searchParams?.student;
  const initialSelectedId = Array.isArray(studentParam) ? studentParam[0] : studentParam;

  return (
    <ManagerMatchingPage
      initialStudents={initialData.students}
      initialTeachers={initialData.teachers}
      initialSelectedId={initialSelectedId ?? null}
    />
  );
}
