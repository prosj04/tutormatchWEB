import { SuccessPageActions } from "@/components/success/SuccessPageActions";
import { SuccessPaymentComplete } from "@/components/success/SuccessPaymentComplete";
import { getCmsSectionValue } from "@/lib/cms-page-defaults";
import { formatKRW } from "@/lib/format-won";
import { getGroupedSiteContent } from "@/lib/site-content";

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
  const siteContent = await getGroupedSiteContent();
  const s = (key: string, fb: string) => getCmsSectionValue(siteContent, "success_page", key, fb);

  const paymentKey = first(searchParams.paymentKey);
  const orderId = first(searchParams.orderId);
  const amountRaw = first(searchParams.amount);
  const amount = amountRaw ? Number(amountRaw) : NaN;

  return (
    <div className="bg-background px-4 py-12 sm:px-6 md:px-8 md:py-20 lg:py-28">
      {orderId ? (
        <SuccessPaymentComplete
          orderId={orderId}
          paymentKey={paymentKey}
          amount={Number.isFinite(amount) ? amount : undefined}
        />
      ) : null}
      <div className="mx-auto max-w-6xl">
        <div className="rounded-2xl border border-gray-100 bg-white px-5 py-10 text-center shadow-sm sm:px-8 sm:py-12 md:px-12 md:py-16">
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">{s("kicker", "Payment")}</p>
          <h1 className="mt-3 text-3xl font-black leading-tight text-text-primary sm:mt-4 sm:text-4xl md:text-5xl lg:text-6xl">
            {s("title", "결제가 완료되었습니다")}
          </h1>
          <p className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-text-secondary">
            {s("body", "주문이 정상적으로 접수되었습니다. 담당 매니저가 곧 연락드릴 예정입니다.")}
          </p>

          {paymentKey && orderId && Number.isFinite(amount) ? (
            <dl className="mx-auto mt-10 max-w-md space-y-3 border-t border-gray-100 pt-10 text-left text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-text-muted">{s("label_order", "주문번호")}</dt>
                <dd className="break-all font-mono text-xs text-text-primary">{orderId}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-text-muted">{s("label_payment_key", "결제키")}</dt>
                <dd className="break-all font-mono text-xs text-text-primary">{paymentKey}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-text-muted">{s("label_amount", "승인 금액")}</dt>
                <dd className="font-bold text-primary">{formatKRW(amount)}</dd>
              </div>
            </dl>
          ) : (
            <p className="mt-10 text-sm text-text-muted">
              {s(
                "missing_payment_info",
                "결제 확인 정보가 URL에 포함되지 않았습니다. 매니저 확인용 메일을 확인해 주세요.",
              )}
            </p>
          )}

          <SuccessPageActions
            homeLabel={s("link_home", "홈으로")}
            consultationLabel={s("link_consultation", "상담 신청")}
          />
        </div>
      </div>
    </div>
  );
}
