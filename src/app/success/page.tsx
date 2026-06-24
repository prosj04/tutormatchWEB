import Link from "next/link";

import { CmsEdit } from "@/components/admin/CmsEditOverlay";
import { ConcordPageHead } from "@/components/concord/ConcordPageHead";
import { ConsultationApplyButton } from "@/components/consultation/ConsultationApplyButton";
import { SuccessPaymentComplete } from "@/components/success/SuccessPaymentComplete";
import { getCmsSectionValue } from "@/lib/cms-page-defaults";
import { formatKRW } from "@/lib/format-won";
import { getGroupedSiteContentBySections } from "@/lib/site-content";

type Search = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export const metadata = {
  title: "결제 완료",
};

type PageProps = {
  searchParams: Search;
};

export default async function SuccessPage({ searchParams }: PageProps) {
  const isEditMode = first(searchParams.cms_edit) === "1";
  const siteContent = await getGroupedSiteContentBySections(["success_page"]);
  const s = (key: string, fb: string) => getCmsSectionValue(siteContent, "success_page", key, fb);

  const paymentKey = first(searchParams.paymentKey);
  const orderId = first(searchParams.orderId);
  const amountRaw = first(searchParams.amount);
  const amount = amountRaw ? Number(amountRaw) : NaN;

  return (
    <main>
      {orderId ? (
        <SuccessPaymentComplete
          orderId={orderId}
          paymentKey={paymentKey}
          amount={Number.isFinite(amount) ? amount : undefined}
        />
      ) : null}

      <ConcordPageHead
        eyebrow={s("kicker", "Payment")}
        title={s("title", "결제가 완료되었습니다")}
        description={s("body", "주문이 정상적으로 접수되었습니다. 담당 매니저가 곧 연락드릴 예정입니다.")}
      />

      <section className="sec" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <article className="card panel-card" style={{ maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
            {paymentKey && orderId && Number.isFinite(amount) ? (
              <dl style={{ marginTop: 8, textAlign: "left" }}>
                <div className="kv-row">
                  <CmsEdit active={isEditMode} section="success_page" cmsKey="label_order" type="text">
                    <dt>{s("label_order", "주문번호")}</dt>
                  </CmsEdit>
                  <dd style={{ fontFamily: "monospace", fontSize: 12, wordBreak: "break-all" }}>{orderId}</dd>
                </div>
                <div className="kv-row">
                  <CmsEdit active={isEditMode} section="success_page" cmsKey="label_payment_key" type="text">
                    <dt>{s("label_payment_key", "결제키")}</dt>
                  </CmsEdit>
                  <dd style={{ fontFamily: "monospace", fontSize: 12, wordBreak: "break-all" }}>{paymentKey}</dd>
                </div>
                <div className="kv-row total">
                  <CmsEdit active={isEditMode} section="success_page" cmsKey="label_amount" type="text">
                    <dt>{s("label_amount", "승인 금액")}</dt>
                  </CmsEdit>
                  <dd>{formatKRW(amount)}</dd>
                </div>
              </dl>
            ) : (
              <CmsEdit active={isEditMode} section="success_page" cmsKey="missing_payment_info" type="text">
                <p className="panel-note" style={{ marginTop: 8 }}>
                  {s(
                    "missing_payment_info",
                    "결제 확인 정보가 URL에 포함되지 않았습니다. 매니저 확인용 메일을 확인해 주세요.",
                  )}
                </p>
              </CmsEdit>
            )}

            <div className="form-actions" style={{ justifyContent: "center", marginTop: 32 }}>
              <CmsEdit active={isEditMode} section="success_page" cmsKey="link_home" type="text">
                <Link href="/" className="btn btn-ghost">
                  {s("link_home", "홈으로")}
                </Link>
              </CmsEdit>
              <CmsEdit active={isEditMode} section="success_page" cmsKey="link_consultation" type="text">
                <ConsultationApplyButton className="btn btn-acc">
                  {s("link_consultation", "상담 신청")}
                </ConsultationApplyButton>
              </CmsEdit>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
