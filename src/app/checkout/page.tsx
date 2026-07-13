import { auth } from "@/auth";
import { CmsEdit } from "@/components/admin/CmsEditOverlay";
import { CheckoutContent, type CheckoutChild } from "@/components/checkout/CheckoutContent";
import { getCmsSectionValue } from "@/lib/cms-page-defaults";
import {
  parseSessionsParam,
  parseSubjectsParam,
  type SessionPlan,
  type SubjectCount,
} from "@/lib/order-pricing";
import { listParentChildren } from "@/lib/parent-data";
import { shouldPromptParentPayment } from "@/lib/payment-payer";
import { getV2PlanById, PRICING_PLANS_V2 } from "@/lib/pricing-plans";
import { prisma } from "@/lib/prisma";
import { getGroupedSiteContentBySections } from "@/lib/site-content";

type Search = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export const metadata = {
  title: "결제",
};

type PageProps = {
  searchParams: Search;
};

/**
 * v1 (sessions, subjects) → v2 planId 매핑. 요금제 카드의 legacy href 폴백용.
 * PricingPlanCard.tsx가 여전히 legacy 파라미터로 링크를 생성한다.
 */
function legacyToV2PlanId(sessions: SessionPlan, subjects: SubjectCount): string {
  const weekly = sessions === 8 ? 2 : 1;
  const hours = subjects === 2 ? 3 : 2;
  return `high-w${weekly}h${hours}`;
}

export default async function CheckoutPage({ searchParams }: PageProps) {
  const [session, siteContent] = await Promise.all([
    auth(),
    getGroupedSiteContentBySections(["checkout_page"]),
  ]);
  const tutorId = first(searchParams.tutor) ?? "1";

  // Prefer v2 ?plan=<id>. Fall back to legacy ?sessions=&subjects=.
  const planParam = first(searchParams.plan);
  const sessionsRaw = first(searchParams.sessions);
  const sessions: SessionPlan = parseSessionsParam(sessionsRaw);
  const subjects: SubjectCount = parseSubjectsParam(first(searchParams.subjects));

  const resolvedV2 =
    (planParam && getV2PlanById(planParam)) || getV2PlanById(legacyToV2PlanId(sessions, subjects));
  const planId = resolvedV2?.id ?? PRICING_PLANS_V2[0]!.id;

  const role = session?.user?.role;
  const isParent = Boolean(session?.user?.id) && role === "PARENT";

  // ?studentId= 로 특정 자녀를 초기 선택(C2-3). 앱 subscribe.tsx / 학부모 결제 페이지가 전달.
  const requestedChildId = first(searchParams.studentId);

  // 학부모 세션이면 연결된 자녀 목록을 조회해 "자녀 명의 결제"로 분기한다.
  // 자녀가 있으면 가입 폼 없이 자녀 선택 UI를 노출한다(needsSignup=false).
  let parentChildren: CheckoutChild[] | undefined;
  if (isParent && session?.user?.id) {
    const parent = await prisma.parent.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (parent) {
      const children = await listParentChildren(parent.id);
      parentChildren = children.map((c) => ({
        id: c.id,
        name: c.name,
        grade: c.grade,
        hasActiveSubscription: c.subscription != null,
      }));
    } else {
      parentChildren = [];
    }
  }

  // 학부모가 연결된 학생 세션: 학부모 결제 동선을 기본 안내(C-2, 재심-8).
  // 미연결 학생은 false 그대로 — 기존 경로 완전 무변경.
  let studentHasLinkedParent = false;
  if (role === "STUDENT" && session?.user?.id) {
    const link = await prisma.parentStudent.findFirst({
      where: { student: { userId: session.user.id } },
      select: { id: true },
    });
    studentHasLinkedParent = shouldPromptParentPayment(role, link != null);
  }

  // 요청된 studentId가 실제 연결 자녀일 때만 초기 선택으로 사용(검증).
  const initialChildId =
    requestedChildId && parentChildren?.some((c) => c.id === requestedChildId)
      ? requestedChildId
      : undefined;

  // 비로그인·학생 외 세션은 가입 폼 필요. 단, 학부모는 자녀 명의 결제이므로 가입 폼 없음.
  const needsSignup = !isParent && (!session?.user?.id || role !== "STUDENT");
  const isEditMode = first(searchParams.cms_edit) === "1";
  const showFailBanner = first(searchParams.error) === "1";
  const failBannerText = getCmsSectionValue(
    siteContent,
    "checkout_page",
    "fail_banner",
    "결제가 완료되지 않았습니다. 다시 시도하거나 다른 수단을 선택해 주세요.",
  );

  return (
    <>
      {showFailBanner ? (
        <div style={{ padding: "16px 24px 0" }}>
          <CmsEdit active={isEditMode} section="checkout_page" cmsKey="fail_banner" type="text">
            <div
              role="alert"
              style={{
                maxWidth: 960,
                margin: "0 auto",
                border: "1px solid rgba(var(--acc-rgb),.35)",
                borderLeft: "4px solid rgba(var(--acc-rgb),1)",
                borderRadius: 12,
                background: "rgba(var(--acc-rgb),.08)",
                padding: "16px 20px",
                fontSize: 14,
                lineHeight: 1.6,
                color: "var(--fg)",
                boxShadow: "0 1px 3px rgba(0,0,0,.06)",
              }}
            >
              <strong style={{ display: "block", marginBottom: 4, fontSize: 15 }}>
                결제가 완료되지 않았습니다
              </strong>
              {failBannerText}
            </div>
          </CmsEdit>
        </div>
      ) : null}
      <CheckoutContent
        tutorId={tutorId}
        planId={planId}
        siteContent={siteContent}
        needsSignup={needsSignup}
        isEditMode={isEditMode}
        parentChildren={parentChildren}
        initialChildId={initialChildId}
        studentHasLinkedParent={studentHasLinkedParent}
      />
    </>
  );
}
