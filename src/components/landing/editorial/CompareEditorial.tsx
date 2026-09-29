"use client";

import { CmsEdit } from "@/components/admin/CmsEditOverlay";
import type { CompareTableRow } from "@/lib/compare-cms";
import type { LandingView } from "./landing-view";

/**
 * 비교표 — 헤어라인 표. Concord 열만 옅은 액센트 틴트 + 액센트 텍스트 헤더.
 * ✓/× 텍스트 병기는 v2와 동일하게 유지한다(문구·판정 로직 불변).
 */
export function CompareEditorial({
  view,
  rows,
  isEditMode,
}: {
  view: LandingView;
  rows: CompareTableRow[];
  isEditMode: boolean;
}) {
  const { getCmsValue, kickers } = view;

  return (
    <section id="compare" className="sec ruled">
      <div className="wrap">
        <div className="sec-head">
          <span className="eyebrow reveal lx-fast">{kickers.compare}</span>
          <div className="sec-head-body">
            <h2 className="h2 reveal lx-slow">
              <CmsEdit active={isEditMode} section="compare" cmsKey="table_title" type="text">
                {getCmsValue("compare", "table_title", "개인 과외와 이렇게 다릅니다")}
              </CmsEdit>
            </h2>
            <p className="lede reveal lx-fast">
              맞지 않는 선생님으로 1~2달을 낭비하지 않도록, 처음부터 핏을 맞춥니다.
            </p>
          </div>
        </div>

        <div className="lx-cmp-wrap reveal lx-fast">
          <table className="lx-cmp">
            <thead>
              <tr>
                <th>비교 항목</th>
                <th>개인 과외</th>
                <th className="lx-cc">Concord</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.rowIndex}>
                  <td>
                    <CmsEdit
                      active={isEditMode}
                      section="compare"
                      cmsKey={`row${row.rowIndex}_feature`}
                      type="text"
                    >
                      {row.feature}
                    </CmsEdit>
                  </td>
                  <td data-lx-col="개인 과외">
                    {/✗|없음/.test(row.other) ? (
                      <span className="lx-no">✗</span>
                    ) : (
                      <CmsEdit
                        active={isEditMode}
                        section="compare"
                        cmsKey={`row${row.rowIndex}_other`}
                        type="text"
                      >
                        {row.other}
                      </CmsEdit>
                    )}
                  </td>
                  <td className="lx-cc" data-lx-col="Concord">
                    <span className="lx-ok" aria-hidden="true">
                      ✓
                    </span>
                    <CmsEdit
                      active={isEditMode}
                      section="compare"
                      cmsKey={`row${row.rowIndex}_concord`}
                      type="text"
                    >
                      {row.concord.replace(/^✓\s*/, "")}
                    </CmsEdit>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
