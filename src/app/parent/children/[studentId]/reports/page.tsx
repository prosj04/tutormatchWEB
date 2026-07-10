import Link from "next/link";
import { notFound } from "next/navigation";

import { listChildReports } from "@/lib/parent-data";
import { parentOwnsStudent, requireParentPage } from "@/lib/parent-page-auth";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ studentId: string }> };

export default async function ChildReportsPage({ params }: PageProps) {
  const { parent } = await requireParentPage();
  const { studentId } = await params;

  if (!(await parentOwnsStudent(parent.id, studentId))) {
    notFound();
  }

  const reports = await listChildReports(studentId);

  return (
    <div className="flex flex-col gap-4">
      <Link href="/parent" className="text-sm text-blue-700 hover:underline">
        ← 자녀 목록
      </Link>
      <h2 className="text-base font-semibold">월간 리포트</h2>
      {reports.length === 0 ? (
        <p className="text-sm text-gray-500">아직 등록된 리포트가 없습니다.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {reports.map((r) => (
            <li key={r.month} className="rounded border p-4">
              <p className="font-medium">{r.month}</p>
              {r.summary && (
                <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                  {r.summary}
                </p>
              )}
              {r.weakTypes.length > 0 && (
                <p className="mt-2 text-sm text-gray-500">
                  취약 유형: {r.weakTypes.join(", ")}
                </p>
              )}
              {r.detail && (
                <p className="mt-2 whitespace-pre-wrap text-sm text-gray-600">
                  {r.detail}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
