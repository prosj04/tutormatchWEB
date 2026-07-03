import type { Metadata } from "next";

import { ConcordPageHead } from "@/components/concord/ConcordPageHead";
import { LegalToc } from "@/components/concord/LegalToc";

export const metadata: Metadata = {
  title: "이용약관",
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
const mutedStyle: React.CSSProperties = { color: "var(--mut)" };

export default function TermsPage() {
  return (
    <main>
      <ConcordPageHead
        eyebrow="Legal"
        title="이용약관"
        description="수업 신청부터 환불까지, 이용에 필요한 약속을 투명하게 안내합니다."
      />
      <section className="sec" style={{ paddingTop: 0 }}>
        <div className="wrap" style={{ maxWidth: 720 }}>
          <div
            className="card"
            style={{ padding: "clamp(1.5rem, 4vw, 3rem)", lineHeight: 1.8 }}
          >
            <p style={mutedStyle}>
              본 약관은 콘코드(이하 &ldquo;회사&rdquo;)가 운영하는 1:1 프리미엄
              과외 매칭 구독 서비스(이하 &ldquo;서비스&rdquo;)의 이용과 관련하여
              회사와 이용자 간의 권리·의무 및 책임사항, 기타 필요한 사항을
              규정함을 목적으로 합니다.
            </p>

            <LegalToc
              items={[
                { id: "article-1", label: "제1조 (목적)" },
                { id: "article-2", label: "제2조 (정의)" },
                { id: "article-3", label: "제3조 (약관의 효력 및 변경)" },
                { id: "article-4", label: "제4조 (회원가입 및 이용계약 체결)" },
                { id: "article-5", label: "제5조 (서비스의 내용)" },
                { id: "article-6", label: "제6조 (이용요금 및 결제)" },
                { id: "article-7", label: "제7조 (계약 해지 및 환불)" },
                { id: "article-8", label: "제8조 (수업 취소 및 보강)" },
                { id: "article-9", label: "제9조 (회사와 선생님의 지위 및 책임 범위)" },
                { id: "article-10", label: "제10조 (직거래 금지)" },
                { id: "article-11", label: "제11조 (개인정보의 보호)" },
                { id: "article-12", label: "제12조 (이용자의 의무)" },
                { id: "article-13", label: "제13조 (면책)" },
                { id: "article-14", label: "제14조 (분쟁 해결 및 관할)" },
                { id: "article-appendix", label: "부칙" },
              ]}
            />

            <section style={sectionStyle}>
              <h2 id="article-1" style={headingStyle}>제1조 (목적)</h2>
              <p>
                본 약관은 회사가 제공하는 학생·학부모와 선생님 간의 과외 매칭,
                전담 매니저를 통한 상담, 수업 일정·과제·진도 관리 등 관련 부수
                서비스의 이용 조건 및 절차, 이용자와 회사 간의 권리·의무·책임
                사항을 정함을 목적으로 합니다.
              </p>
            </section>

            <section style={sectionStyle}>
              <h2 id="article-2" style={headingStyle}>제2조 (정의)</h2>
              <ul style={listStyle}>
                <li>
                  &ldquo;서비스&rdquo;란 회사가 제공하는 매칭, 상담, 수업 관리,
                  결제 및 이에 부수하는 일체의 온라인·오프라인 서비스를 말합니다.
                </li>
                <li>
                  &ldquo;이용자&rdquo;란 본 약관에 따라 회사가 제공하는 서비스를
                  이용하는 회원(학생, 학부모)을 말합니다.
                </li>
                <li>
                  &ldquo;학생&rdquo;이란 실제 수업을 수강하는 자를 말하며,
                  &ldquo;학부모&rdquo;란 학생을 대리하여 서비스 가입, 결제 및
                  계약 체결의 주체가 되는 법정대리인 또는 보호자를 말합니다.
                </li>
                <li>
                  &ldquo;선생님&rdquo;이란 회사의 매칭 및 관리 절차에 따라 학생에게
                  수업을 제공하는 자를 말합니다.
                </li>
                <li>
                  &ldquo;매니저&rdquo;란 회사에 소속되어 이용자의 상담·수업
                  관리·선생님 배정을 지원하는 자를 말합니다.
                </li>
                <li>
                  &ldquo;구독&rdquo;이란 월 단위로 결제되어 정해진 횟수의 수업을
                  제공받는 이용 계약을 말합니다.
                </li>
              </ul>
            </section>

            <section style={sectionStyle}>
              <h2 id="article-3" style={headingStyle}>제3조 (약관의 효력 및 변경)</h2>
              <ol style={listStyle}>
                <li>
                  본 약관은 서비스 화면 또는 연결화면에 게시하는 방법으로
                  공지하며, 이용자가 회원가입 시 동의함으로써 효력이 발생합니다.
                </li>
                <li>
                  회사는 관련 법령을 위배하지 않는 범위에서 본 약관을 개정할 수
                  있으며, 개정 시 적용일자 및 개정사유를 명시하여 최소 7일 전
                  (이용자에게 불리한 개정의 경우 30일 전)부터 적용일자까지
                  공지합니다.
                </li>
                <li>
                  회사가 개정 약관을 공지하면서 이용자에게 적용일자까지
                  의사표시를 하지 않으면 동의한 것으로 간주한다는 뜻을 명확히
                  고지하였음에도 이용자가 명시적으로 거부의 의사표시를 하지
                  아니한 경우 이용자가 개정 약관에 동의한 것으로 봅니다.
                </li>
                <li>
                  이용자가 개정 약관에 동의하지 않는 경우 이용계약을 해지할 수
                  있습니다.
                </li>
              </ol>
            </section>

            <section style={sectionStyle}>
              <h2 id="article-4" style={headingStyle}>제4조 (회원가입 및 이용계약 체결)</h2>
              <ol style={listStyle}>
                <li>
                  이용자는 회사가 정한 절차에 따라 필수 정보를 제공하고 본 약관
                  및 개인정보처리방침에 동의함으로써 회원가입을 신청합니다.
                </li>
                <li>
                  회사는 다음 각 호에 해당하는 신청에 대하여는 승낙을 거절하거나
                  사후에 이용계약을 해지할 수 있습니다.
                  <ul style={listStyle}>
                    <li>실명이 아니거나 타인의 명의를 이용한 경우</li>
                    <li>허위 정보를 기재하거나 회사가 요청하는 정보를 제공하지 않는 경우</li>
                    <li>부정한 목적 또는 관련 법령 위반 우려가 있는 경우</li>
                  </ul>
                </li>
                <li>
                  만 14세 미만 아동이 회원으로 가입하거나 서비스를 이용하고자
                  하는 경우, 반드시 법정대리인(보호자)의 동의를 얻어야 합니다.
                  회사는 법정대리인의 동의 여부를 확인할 수 있는 절차를
                  마련합니다.
                </li>
                <li>
                  본 서비스의 결제 및 이용계약의 당사자는 원칙적으로 성년인
                  학부모(법정대리인)이며, 미성년자인 학생은 실제 수업 수강자로서
                  본 약관의 관련 규정을 준수하여야 합니다.
                </li>
              </ol>
            </section>

            <section style={sectionStyle}>
              <h2 id="article-5" style={headingStyle}>제5조 (서비스의 내용)</h2>
              <ol style={listStyle}>
                <li>
                  회사는 다음 각 호의 서비스를 제공합니다.
                  <ul style={listStyle}>
                    <li>전담 매니저 배정 및 대면 상담</li>
                    <li>학생의 성향·학습 목표에 부합하는 선생님 매칭 제안</li>
                    <li>수업 일정 관리, 과제·진도 관리, 리포트 제공</li>
                    <li>결제 및 정산 처리</li>
                    <li>기타 회사가 정하는 부수 서비스</li>
                  </ul>
                </li>
                <li>
                  선생님 매칭은 회사가 후보를 제시한 뒤 학생(또는 법정대리인)의
                  명시적 수락이 있는 경우에만 확정됩니다. 학생은 매칭 제안을
                  수락하지 않을 권리가 있으며, 재매칭을 요청할 수 있습니다.
                </li>
                <li>
                  회사는 서비스의 원활한 제공을 위해 서비스 내용의 일부를 수정,
                  중단할 수 있으며, 이 경우 사전에 공지합니다. 다만 부득이한
                  사유가 있는 경우 사후에 공지할 수 있습니다.
                </li>
              </ol>
            </section>

            <section style={sectionStyle}>
              <h2 id="article-6" style={headingStyle}>제6조 (이용요금 및 결제)</h2>
              <ol style={listStyle}>
                <li>
                  서비스 이용요금은 다음과 같습니다.
                  <ul style={listStyle}>
                    <li>주 1회(월 4회) 상품: 회당 100,000원</li>
                    <li>주 2회 이상(월 8회) 상품: 회당 90,000원</li>
                    <li>과목 수에 따라 위 금액에 과목 수를 곱하여 산정합니다.</li>
                  </ul>
                </li>
                <li>
                  결제는 월 단위 선불 결제 방식이며, 회사가 지정한 결제대행사
                  (토스페이먼츠 등)를 통해 신용카드·계좌이체 등의 방법으로
                  이루어집니다.
                </li>
                <li>
                  현재 자동 갱신은 지원되지 않으며, 이용자는 매월 수동으로
                  재결제하여야 서비스가 지속됩니다.
                </li>
                <li>
                  회사는 요금 정책을 변경할 수 있으며, 변경 시 제3조에 따라
                  사전 공지합니다. 이미 결제 완료된 계약에는 변경된 요금이
                  적용되지 않습니다.
                </li>
              </ol>
            </section>

            <section style={sectionStyle}>
              <h2 id="article-7" style={headingStyle}>제7조 (계약 해지 및 환불)</h2>
              <ol style={listStyle}>
                <li>
                  이용자는 언제든지 서비스 이용을 중단하고 계약을 해지할 수
                  있으며, 결제 금액의 환불에 관한 사항은 회사가 별도로 정한
                  <a href="/refund" style={{ color: "var(--acc-text)" }}>
                    {" "}환불정책
                  </a>
                  을 따릅니다.
                </li>
                <li>
                  회사는 이용자가 본 약관을 중대하게 위반하거나 관련 법령을
                  위반한 경우 사전 통지 후 이용계약을 해지할 수 있습니다.
                </li>
                <li>
                  회원 탈퇴 시 개인정보는 즉시 익명화 처리되나, 관련 법령에 따라
                  보관이 요구되는 결제·계약 기록 등은 별도로 정한 기간 동안
                  보관됩니다(개인정보처리방침 참조).
                </li>
              </ol>
            </section>

            <section style={sectionStyle}>
              <h2 id="article-8" style={headingStyle}>제8조 (수업 취소 및 보강)</h2>
              <ol style={listStyle}>
                <li>
                  이용자가 예정된 수업을 취소하거나 일정 변경을 요청하는 경우,
                  수업 시작 시각으로부터 최소 24시간 전에 담당 매니저 또는
                  선생님에게 통보하여야 합니다. 24시간 전에 통보된 경우 보강
                  수업이 제공됩니다.
                </li>
                <li>
                  수업 시작 24시간 이내의 취소 또는 무단 결석의 경우, 해당 회차는
                  진행된 수업으로 간주되어 보강이 제공되지 않을 수 있습니다.
                  다만 질병, 재난 등 부득이한 사유가 있는 경우 회사와 협의하여
                  보강을 진행할 수 있습니다.
                </li>
                <li>
                  선생님의 사정으로 수업이 취소되는 경우 회사는 별도의 비용
                  청구 없이 보강 일정을 조율합니다.
                </li>
                <li>
                  월 이용 기간 내에 소진되지 않은 수업 회차의 이월 여부는 회사와
                  협의하여 결정하며, 원칙적으로 결제된 월 이용 기간 종료 시
                  소멸될 수 있습니다.
                </li>
              </ol>
            </section>

            <section style={sectionStyle}>
              <h2 id="article-9" style={headingStyle}>
                제9조 (회사와 선생님의 지위 및 책임 범위)
              </h2>
              <ol style={listStyle}>
                <li>
                  회사는 학생·학부모와 선생님 간의 과외 계약이 원활히 성립되고
                  이행되도록 매칭·상담·관리 서비스를 제공하는 자입니다.
                </li>
                <li>
                  선생님은 회사와 별도의 계약을 체결하여 수업을 제공하며,
                  회사는 선생님의 수업 품질 관리 및 이용자 보호를 위한 관리
                  책임을 부담합니다.
                </li>
                <li>
                  회사는 수업 중 발생한 학습적 성취, 성적 향상 등 결과에 대한
                  보증 책임을 부담하지 아니하나, 서비스 제공 과정에서 회사의
                  고의 또는 중대한 과실로 이용자에게 손해가 발생한 경우 관련
                  법령에 따라 책임을 부담합니다.
                </li>
              </ol>
            </section>

            <section style={sectionStyle}>
              <h2 id="article-10" style={headingStyle}>제10조 (직거래 금지)</h2>
              <ol style={listStyle}>
                <li>
                  이용자와 선생님은 회사의 플랫폼을 통하지 아니하고 직접
                  수업료를 수수하거나 별도의 과외 계약을 체결하여서는 아니
                  됩니다.
                </li>
                <li>
                  회사는 이용자 또는 선생님이 전항을 위반한 사실이 확인되는
                  경우 서비스 이용을 제한하거나 이용계약을 해지할 수 있으며,
                  이로 인해 회사에 손해가 발생한 경우 손해배상을 청구할 수
                  있습니다.
                </li>
                <li>
                  이용자는 직거래로 인해 발생한 분쟁·손해에 대하여 회사가
                  책임을 부담하지 아니함을 확인합니다.
                </li>
              </ol>
            </section>

            <section style={sectionStyle}>
              <h2 id="article-11" style={headingStyle}>제11조 (개인정보의 보호)</h2>
              <p>
                회사는 관련 법령이 정하는 바에 따라 이용자의 개인정보를 보호하기
                위해 노력합니다. 개인정보의 처리 및 보호에 관한 세부사항은
                별도로 정한{" "}
                <a href="/privacy" style={{ color: "var(--acc-text)" }}>
                  개인정보처리방침
                </a>
                을 따릅니다.
              </p>
            </section>

            <section style={sectionStyle}>
              <h2 id="article-12" style={headingStyle}>제12조 (이용자의 의무)</h2>
              <ul style={listStyle}>
                <li>이용자는 회원가입 시 정확한 정보를 제공하여야 합니다.</li>
                <li>
                  이용자는 서비스 이용 시 관련 법령, 본 약관, 회사가 공지한
                  사항을 준수하여야 합니다.
                </li>
                <li>
                  이용자는 자신의 계정 정보를 제3자에게 양도·대여할 수 없으며,
                  계정 관리 소홀로 인한 손해는 이용자가 부담합니다.
                </li>
                <li>
                  이용자는 선생님에 대한 존중과 예의를 지켜야 하며, 인격권을
                  침해하거나 법령을 위반하는 언동을 하여서는 아니 됩니다.
                </li>
              </ul>
            </section>

            <section style={sectionStyle}>
              <h2 id="article-13" style={headingStyle}>제13조 (면책)</h2>
              <ol style={listStyle}>
                <li>
                  회사는 천재지변, 전쟁, 정전, 통신망 장애 등 불가항력적 사유로
                  서비스를 제공할 수 없는 경우 책임을 지지 아니합니다.
                </li>
                <li>
                  회사는 이용자의 귀책사유로 인한 서비스 이용 장애 및 손해에
                  대하여 책임을 지지 아니합니다.
                </li>
                <li>
                  회사는 이용자가 서비스를 통해 얻은 정보 또는 자료로 인한
                  손해에 대하여 별도의 보증을 하지 아니합니다.
                </li>
              </ol>
            </section>

            <section style={sectionStyle}>
              <h2 id="article-14" style={headingStyle}>제14조 (분쟁 해결 및 관할)</h2>
              <ol style={listStyle}>
                <li>
                  회사와 이용자 간에 발생한 분쟁은 상호 협의를 통해 원만히 해결
                  하도록 노력합니다.
                </li>
                <li>
                  협의로 해결되지 아니한 분쟁에 대해서는 「전자상거래 등에서의
                  소비자보호에 관한 법률」 등 관련 법령에 따르며, 소송이 제기될
                  경우 민사소송법상의 관할법원을 제1심 관할법원으로 합니다.
                </li>
                <li>본 약관에 관해서는 대한민국 법을 준거법으로 합니다.</li>
              </ol>
            </section>

            <section style={sectionStyle}>
              <h2 id="article-appendix" style={headingStyle}>부칙</h2>
              <p>본 약관은 [시행일: 기재 예정]부터 시행합니다.</p>
              <p style={{ ...mutedStyle, marginTop: 12 }}>
                사업자 정보 — 상호: 콘코드 / 대표자: [기재 예정] /
                사업자등록번호: [기재 예정] / 통신판매업신고번호: [기재 예정] /
                사업장 주소: [기재 예정]
              </p>
            </section>

            <p style={{ ...mutedStyle, marginTop: 28 }}>
              문의:{" "}
              <a
                href="mailto:help@concordedu.kr"
                style={{ color: "var(--acc-text)" }}
              >
                help@concordedu.kr
              </a>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
