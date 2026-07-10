import Link from "next/link";

import { listParentChildren } from "@/lib/parent-data";
import { requireParentPage } from "@/lib/parent-page-auth";

import { LinkChildForm } from "./LinkChildForm";

export const dynamic = "force-dynamic";

export default async function ParentHomePage() {
  const { parent } = await requireParentPage();
  const children = await listParentChildren(parent.id);

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">연결된 자녀</h2>
        {children.length === 0 ? (
          <p className="text-sm text-gray-500">
            아직 연결된 자녀가 없습니다. 아래에서 연결 코드를 입력해 주세요.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {children.map((child) => (
              <li key={child.id} className="rounded border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{child.name}</p>
                    <p className="text-sm text-gray-500">
                      {child.grade || "학년 미정"}
                      {child.subjects ? ` · ${child.subjects}` : ""}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {child.subscription ? child.subscription.status : "구독 없음"}
                  </span>
                </div>
                <div className="mt-3 flex gap-4 text-sm">
                  <Link
                    href={`/parent/children/${child.id}/reports`}
                    className="text-blue-700 hover:underline"
                  >
                    리포트{child.latestReportMonth ? ` (${child.latestReportMonth})` : ""}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded border p-4">
        <LinkChildForm />
      </section>
    </div>
  );
}
