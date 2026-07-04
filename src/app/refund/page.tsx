import type { Metadata } from "next";

import { ConcordPageHead } from "@/components/concord/ConcordPageHead";
import { ConcordReveal } from "@/components/concord/ConcordReveal";
import { LegalToc } from "@/components/concord/LegalToc";

export const metadata: Metadata = {
  title: "환불정책",
};

const sectionStyle: React.CSSProperties = { marginTop: 28 };
const headingStyle: React.CSSProperties = {
  fontSize: "1.05rem",
  fontWeight: 700,
  marginBottom: 10,
  scrollMarginTop: "90px",
};
const listStyle: React.CSSProperties = {
  paddingLeft: "1.25rem",
  margin: "6px 0",
};
const calloutStyle: React.CSSProperties = {
  border: "1px solid var(--bd, #e5e7eb)",
  borderRadius: 12,
  padding: "14px 16px",
  marginTop: 10,
  background: "var(--surface-2, rgba(0,0,0,0.02))",
};
const mutedStyle: React.CSSProperties = { color: "var(--mut)" };

export default function RefundPage() {
  return (
    <main>
      <ConcordPageHead
        eyebrow="Legal"
        title="환불정책"
        description="첫 수업이 마음에 들지 않으면 100% 환불 — 위약금 없이 약속합니다."
      />
      <section className="sec" style={{ paddingTop: 0 }}>
        <div className="wrap" style={{ maxWidth: 720 }}>
          <ConcordReveal
            className="card"
            style={{ padding: "clamp(1.5rem, 4vw, 3rem)", lineHeight: 1.8 }}
          >
            <p style={mutedStyle}>
              콘코드는 「전자상거래 등에서의 소비자보호에 관한 법률」 및 관련
              법령에 따라 이용자의 청약철회 및 계약 해지 권리를 보장합니다. 본
              환불정책은 회사가 제공하는 1:1 프리미엄 과외 매칭 구독 서비스에
              적용됩니다.
            </p>

            <LegalToc
              items={[
                { id: "refund-1", label: "1. 첫 수업 100% 환불 보장" },
                { id: "refund-2", label: "2. 수업 시작 전 환불" },
                { id: "refund-3", label: "3. 월 중도 해지 및 정산" },
                { id: "refund-4", label: "4. 환불이 제한되는 경우" },
                { id: "refund-5", label: "5. 회사 사유로 인한 환불" },
                { id: "refund-6", label: "6. 환불 절차 및 소요 기간" },
                { id: "refund-7", label: "7. 문의 채널" },
              ]}
            />

            <section style={sectionStyle}>
              <h2 id="refund-1" style={headingStyle}>1. 첫 수업 100% 환불 보장</h2>
              <div style={calloutStyle}>
                <p>
                  <strong>
                    첫 수업 진행 후 서비스에 만족하지 못하신 경우, 위약금이나
                    어떠한 불이익 없이 결제하신 금액 전액을 환불해 드립니다.
                  </strong>
                </p>
              </div>
              <ul style={listStyle}>
                <li>
                  적용 대상: 콘코드를 통해 최초로 결제한 이용자의 첫 회차 수업
                </li>
                <li>
                  신청 방법: 첫 수업 종료 후 3일(72시간) 이내에 담당 매니저 또는
                  고객센터로 환불을 요청
                </li>
                <li>
                  환불 금액: 결제하신 월 이용료 전액 (진행된 첫 수업분 포함)
                </li>
                <li>
                  첫 수업 환불 보장은 학생 1인당 최초 가입 시 1회에 한하여 적용됩니다.
                </li>
                <li>
                  환불 후 재가입하는 경우 첫 수업 환불 보장은 적용되지 않습니다.
                </li>
                <li>
                  동일 세대(형제·자매 등)의 반복적인 보장 악용이 확인되는 경우 회사는
                  보장 적용을 제한할 수 있습니다.
                </li>
              </ul>
            </section>

            <section style={sectionStyle}>
              <h2 id="refund-2" style={headingStyle}>2. 수업 시작 전 환불</h2>
              <ul style={listStyle}>
                <li>
                  결제 후 첫 수업이 진행되기 전까지 이용자는 언제든지 계약을
                  철회할 수 있으며, 이 경우 결제 금액 전액이 환불됩니다.
                </li>
                <li>
                  결제 완료 후 7일 이내이며 수업이 개시되지 않은 경우, 「전자
                  상거래법」 제17조에 따른 청약철회권이 보장됩니다.
                </li>
              </ul>
            </section>

            <section style={sectionStyle}>
              <h2 id="refund-3" style={headingStyle}>3. 월 중도 해지 및 정산</h2>
              <p>
                이용자는 언제든지 서비스 이용을 중단할 수 있으며, 월 중도
                해지 시 이미 진행된 수업 회차의 정가를 결제 금액에서 공제한 후
                잔액을 환불해 드립니다. 정가는 콘코드의 공시 요금표를 기준으로
                합니다.
              </p>
              <ul style={listStyle}>
                <li>주 1회(월 4회) 상품: 회당 정가 100,000원</li>
                <li>주 2회 이상(월 8회) 상품: 회당 정가 90,000원</li>
                <li>과목 수에 따라 위 금액에 과목 수를 곱하여 산정합니다.</li>
              </ul>

              <div style={calloutStyle}>
                <p>
                  <strong>계산 예시</strong>
                </p>
                <p>
                  월 8회(주 2회) · 1과목 상품을 결제하고 3회 수업을 이미 진행한
                  뒤 해지를 요청한 경우:
                </p>
                <ul style={listStyle}>
                  <li>결제 금액: 90,000원 × 8회 × 1과목 = <strong>720,000원</strong></li>
                  <li>이용 회차 공제: 90,000원 × 3회 = <strong>270,000원</strong></li>
                  <li>
                    환불 금액: 720,000원 − 270,000원 =
                    {" "}<strong>450,000원</strong>
                  </li>
                </ul>
                <p style={mutedStyle}>
                  * 결제대행사 수수료 등이 환불 금액에서 차감될 수 있으며,
                  차감 시 사전에 안내합니다.
                </p>
              </div>
            </section>

            <section style={sectionStyle}>
              <h2 id="refund-4" style={headingStyle}>4. 환불이 제한되는 경우</h2>
              <ul style={listStyle}>
                <li>이미 진행된 수업 회차의 이용료 (첫 수업 100% 환불 보장 대상은 예외)</li>
                <li>
                  이용자가 본 서비스 약관 또는 관련 법령을 중대하게 위반하여
                  이용계약이 해지된 경우
                </li>
                <li>
                  이용자의 사유로 사전 통지 없이 수업에 결석하거나 수업 시작
                  24시간 이내에 취소하여 회사가 보강을 제공할 수 없는 회차
                </li>
                <li>
                  플랫폼 외 직거래 등 부정한 방법으로 서비스를 이용한 사실이
                  확인된 경우
                </li>
              </ul>
            </section>

            <section style={sectionStyle}>
              <h2 id="refund-5" style={headingStyle}>5. 회사 사유로 인한 환불</h2>
              <p>
                다음의 경우, 회사는 이용자가 이용하지 못한 회차에 대해 전액을
                환불하거나 이용자의 선택에 따라 대체 서비스를 제공합니다.
              </p>
              <ul style={listStyle}>
                <li>선생님 사정으로 수업이 취소되었으나 합리적 기간 내 보강이 불가능한 경우</li>
                <li>회사가 서비스 제공을 중단하거나 불가능하게 된 경우</li>
                <li>기타 회사의 귀책사유로 서비스가 정상적으로 제공되지 못한 경우</li>
              </ul>
            </section>

            <section style={sectionStyle}>
              <h2 id="refund-6" style={headingStyle}>6. 환불 절차 및 소요 기간</h2>
              <ol style={listStyle}>
                <li>
                  담당 매니저 또는 아래 고객센터로 환불을 요청합니다.
                </li>
                <li>
                  회사는 요청 접수 후 이용 회차·환불 금액을 확인하여 이용자에게
                  안내합니다.
                </li>
                <li>
                  환불 금액 확정 후 영업일 기준 3~5일 이내에 결제 수단으로 환불
                  처리합니다. 카드 결제의 경우 카드사 사정에 따라 실제 환급까지
                  추가 기간이 소요될 수 있습니다.
                </li>
                <li>
                  계좌 환불이 필요한 경우, 이용자로부터 환불 계좌 정보를 제공
                  받은 뒤 처리합니다.
                </li>
              </ol>
            </section>

            <section style={sectionStyle}>
              <h2 id="refund-7" style={headingStyle}>7. 문의 채널</h2>
              <ul style={listStyle}>
                <li>
                  이메일:{" "}
                  <a
                    href="mailto:help@concordedu.kr"
                    style={{ color: "var(--acc-text)" }}
                  >
                    help@concordedu.kr
                  </a>
                </li>
                <li>서비스 내 담당 매니저 채팅</li>
              </ul>
              <p style={mutedStyle}>
                본 환불정책에 명시되지 아니한 사항은 이용약관 및 관련 법령을
                따릅니다.
              </p>
              <p style={{ ...mutedStyle, marginTop: 12 }}>
                시행일: [기재 예정]
              </p>
            </section>
          </ConcordReveal>
        </div>
      </section>
    </main>
  );
}
