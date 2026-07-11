import { requireParentPage } from "@/lib/parent-page-auth";
import { prisma } from "@/lib/prisma";

import { AccountForms } from "./AccountForms";

export const dynamic = "force-dynamic";

export default async function ParentAccountPage() {
  const { parent } = await requireParentPage();

  const record = await prisma.parent.findUnique({
    where: { id: parent.id },
    select: { user: { select: { email: true } } },
  });
  const email = record?.user.email ?? "";

  return (
    <section className="page on" id="pg-account" data-screen-label="학부모 계정">
      <div className="crumb">/parent/account</div>
      <h1>계정</h1>
      <p className="sub">프로필과 보안을 관리합니다.</p>
      <AccountForms initialName={parent.name} initialPhone={parent.phone} email={email} />
    </section>
  );
}
