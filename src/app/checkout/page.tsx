import { CheckoutContent } from "@/components/checkout/CheckoutContent";
import {
  parseSessionsParam,
  parseSubjectsParam,
  type SessionPlan,
  type SubjectCount,
} from "@/lib/order-pricing";

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

export default function CheckoutPage({ searchParams }: PageProps) {
  const tutorId = first(searchParams.tutor) ?? "1";
  const sessionsRaw = first(searchParams.sessions);
  const sessions: SessionPlan = parseSessionsParam(sessionsRaw);
  const subjects: SubjectCount = parseSubjectsParam(first(searchParams.subjects));
  const showFailBanner = first(searchParams.error) === "1";

  return (
    <>
      {showFailBanner ? (
        <div className="border-b border-accent/20 bg-accent/5 px-8 py-3 text-center text-sm text-text-primary">
          결제가 완료되지 않았습니다. 다시 시도하거나 다른 수단을 선택해 주세요.
        </div>
      ) : null}
      <CheckoutContent tutorId={tutorId} sessions={sessions} subjects={subjects} />
    </>
  );
}
