import { listParentChildren } from "@/lib/parent-data";
import { requireParentPage } from "@/lib/parent-page-auth";

import { ConsultationForm } from "./ConsultationForm";

export const dynamic = "force-dynamic";

export default async function ParentConsultationPage() {
  const { parent } = await requireParentPage();
  const children = await listParentChildren(parent.id);

  return (
    <section className="page on" id="pg-consult" data-screen-label="학부모 상담">
      <div className="crumb">/parent/consultation</div>
      <h1>상담</h1>
      <p className="sub">자녀 관련 방문 상담을 신청하고 예약을 관리합니다.</p>
      <div className="sec grid2">
        <div className="card" style={{ padding: "20px" }}>
          <ConsultationForm
            students={children.map((c) => ({ id: c.id, name: c.name, grade: c.grade }))}
          />
        </div>
        <div className="card" style={{ padding: "20px" }}>
          <h2 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "14px" }}>상담 안내</h2>
          <div className="banner info">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
            <span>
              상담을 신청하면 담당 매니저가 방문 일정을 조율해 연락드립니다. 대면 상담에서 자녀에게
              맞는 선생님을 배정합니다.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
