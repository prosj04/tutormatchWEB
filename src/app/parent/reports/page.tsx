import { listChildReports, listParentChildren } from "@/lib/parent-data";
import { requireParentPage } from "@/lib/parent-page-auth";

import { ReportsView, type ReportChild } from "./ReportsView";

export const dynamic = "force-dynamic";

export default async function ParentReportsPage() {
  const { parent } = await requireParentPage();
  const children = await listParentChildren(parent.id);

  const withReports: ReportChild[] = await Promise.all(
    children.map(async (c) => ({
      id: c.id,
      name: c.name,
      grade: c.grade,
      reports: await listChildReports(c.id),
    })),
  );

  return (
    <section className="page on" id="pg-reports" data-screen-label="학부모 리포트">
      <div className="crumb">/parent/reports</div>
      <h1>리포트</h1>
      <p className="sub">자녀별 월간 학습 리포트 — 선생님·매니저가 요약한 결과입니다.</p>

      {withReports.length === 0 ? (
        <div className="sec">
          <p className="sub">연결된 자녀가 없습니다. 자녀 연결에서 코드를 입력해 주세요.</p>
        </div>
      ) : (
        <ReportsView items={withReports} />
      )}
    </section>
  );
}
