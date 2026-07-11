import { listParentChildren } from "@/lib/parent-data";
import { requireParentPage } from "@/lib/parent-page-auth";

import { LinkChildForm, type LinkedChild } from "../LinkChildForm";

export const dynamic = "force-dynamic";

export default async function ParentLinkPage() {
  const { parent } = await requireParentPage();
  const children = await listParentChildren(parent.id);

  const linked: LinkedChild[] = children.map((c) => ({
    id: c.id,
    name: c.name,
    grade: c.grade,
    linkedVia: c.linkedVia,
  }));

  return (
    <section className="page on" id="pg-link" data-screen-label="자녀 연결">
      <div className="crumb">/parent/link</div>
      <h1>자녀 연결</h1>
      <p className="sub">자녀 앱의 MY → 학부모 연결에 표시된 코드를 입력하세요.</p>
      <LinkChildForm linked={linked} />
    </section>
  );
}
