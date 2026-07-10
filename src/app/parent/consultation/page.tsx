import { listParentChildren } from "@/lib/parent-data";
import { requireParentPage } from "@/lib/parent-page-auth";

import { ConsultationForm } from "./ConsultationForm";

export const dynamic = "force-dynamic";

export default async function ParentConsultationPage() {
  const { parent } = await requireParentPage();
  const children = await listParentChildren(parent.id);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-base font-semibold">상담 신청</h2>
      <ConsultationForm
        students={children.map((c) => ({ id: c.id, name: c.name }))}
      />
    </div>
  );
}
