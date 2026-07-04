import type { Metadata } from "next";

import { ConcordPageHead } from "@/components/concord/ConcordPageHead";
import { ConcordReveal } from "@/components/concord/ConcordReveal";
import { LegalToc } from "@/components/concord/LegalToc";

export const metadata: Metadata = {
  title: "개인정보처리방침",
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
const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  marginTop: 8,
  fontSize: "0.94rem",
};
const cellStyle: React.CSSProperties = {
  border: "1px solid var(--bd, #e5e7eb)",
  padding: "8px 10px",
  textAlign: "left",
  verticalAlign: "top",
};
const mutedStyle: React.CSSProperties = { color: "var(--mut)" };

export default function PrivacyPage() {
  return (
    <main>
      <ConcordPageHead
        eyebrow="Legal"
        title="개인정보처리방침"
        description="수집하는 정보와 보관 기간, 보호 절차를 숨김없이 공개합니다."
      />
      <section className="sec" style={{ paddingTop: 0 }}>
        <div className="wrap" style={{ maxWidth: 720 }}>
          <ConcordReveal
            className="card"
            style={{ padding: "clamp(1.5rem, 4vw, 3rem)", lineHeight: 1.8 }}
          >
            <p style={mutedStyle}>
              콘코드(이하 &ldquo;회사&rdquo;)는 「개인정보 보호법」 등 관련
              법령에 따라 정보주체의 개인정보를 보호하고 이와 관련한 고충을
              신속하고 원활하게 처리하기 위해 다음과 같은 개인정보처리방침을
              두고 있습니다.
            </p>

            <LegalToc
              items={[
                { id: "privacy-1", label: "1. 수집하는 개인정보의 항목" },
                { id: "privacy-2", label: "2. 개인정보의 수집 방법" },
                { id: "privacy-3", label: "3. 개인정보의 이용 목적" },
                { id: "privacy-4", label: "4. 개인정보의 보유 및 이용 기간" },
                { id: "privacy-5", label: "5. 개인정보 처리 위탁" },
                { id: "privacy-6", label: "6. 개인정보의 제3자 제공" },
                { id: "privacy-7", label: "7. 정보주체의 권리 및 행사 방법" },
                { id: "privacy-8", label: "8. 만 14세 미만 아동의 개인정보" },
                { id: "privacy-9", label: "9. 개인정보의 안전성 확보 조치" },
                { id: "privacy-10", label: "10. 쿠키의 운영 및 거부" },
                { id: "privacy-11", label: "11. 개인정보보호책임자" },
                { id: "privacy-12", label: "12. 고지의 의무" },
              ]}
            />

            <section style={sectionStyle}>
              <h2 id="privacy-1" style={headingStyle}>1. 수집하는 개인정보의 항목</h2>
              <p>회사는 서비스 제공을 위하여 다음의 개인정보를 수집합니다.</p>
              <ul style={listStyle}>
                <li>
                  <strong>필수 항목</strong> — 학생: 이름, 학년, 학교, 연락처
                  (휴대전화번호), 이메일, 학습 정보(과목·목표·성적 등)
                </li>
                <li>
                  <strong>필수 항목</strong> — 보호자: 이름, 보호자와의 관계,
                  연락처(휴대전화번호), 이메일
                </li>
                <li>
                  <strong>결제 관련</strong> — 결제 수단 정보(카드사·승인번호 등),
                  결제 기록, 환불 계좌 정보(환불 시)
                </li>
                <li>
                  <strong>자동 수집</strong> — 서비스 이용 기록, 접속 로그,
                  쿠키, IP 주소, 기기 정보(브라우저 종류, OS 등)
                </li>
                <li>
                  <strong>선택 항목</strong> — 학습 목표·희망 사항 등 상담 시
                  제공되는 부가 정보
                </li>
              </ul>
            </section>

            <section style={sectionStyle}>
              <h2 id="privacy-2" style={headingStyle}>2. 개인정보의 수집 방법</h2>
              <ul style={listStyle}>
                <li>홈페이지 및 앱을 통한 회원가입, 상담 신청, 결제 절차</li>
                <li>대면·유선 상담 과정에서의 정보 제공</li>
                <li>서비스 이용 과정에서 자동 생성되는 로그·쿠키 등</li>
                <li>결제대행사(토스페이먼츠) 등 제휴사로부터의 제공</li>
              </ul>
            </section>

            <section style={sectionStyle}>
              <h2 id="privacy-3" style={headingStyle}>3. 개인정보의 이용 목적</h2>
              <ul style={listStyle}>
                <li>회원 관리, 본인 확인, 부정 이용 방지</li>
                <li>매니저 배정, 상담 진행, 선생님 매칭 및 수업 관리</li>
                <li>수업 일정·과제·진도·리포트 관리 및 안내</li>
                <li>결제 처리, 요금 정산, 환불</li>
                <li>공지사항 전달, 고객 문의 응대, 민원 처리</li>
                <li>
                  서비스 개선, 통계 분석, 신규 서비스 개발(개인 식별이 불가능한
                  형태로 처리)
                </li>
              </ul>
            </section>

            <section style={sectionStyle}>
              <h2 id="privacy-4" style={headingStyle}>4. 개인정보의 보유 및 이용 기간</h2>
              <p>
                회원 탈퇴 요청 시 회사는 지체 없이 해당 정보주체의 개인정보를
                익명화(soft-delete) 처리하여 개인 식별이 불가능한 상태로
                변환합니다. 다만 관련 법령에 따라 보관이 요구되는 정보는 아래
                기간 동안 보관합니다.
              </p>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={cellStyle}>보관 항목</th>
                    <th style={cellStyle}>근거 법령</th>
                    <th style={cellStyle}>보관 기간</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={cellStyle}>계약 또는 청약철회 등에 관한 기록</td>
                    <td style={cellStyle}>전자상거래법</td>
                    <td style={cellStyle}>5년</td>
                  </tr>
                  <tr>
                    <td style={cellStyle}>대금결제 및 재화 등의 공급에 관한 기록</td>
                    <td style={cellStyle}>전자상거래법</td>
                    <td style={cellStyle}>5년</td>
                  </tr>
                  <tr>
                    <td style={cellStyle}>소비자 불만 또는 분쟁 처리 기록</td>
                    <td style={cellStyle}>전자상거래법</td>
                    <td style={cellStyle}>3년</td>
                  </tr>
                  <tr>
                    <td style={cellStyle}>표시·광고에 관한 기록</td>
                    <td style={cellStyle}>전자상거래법</td>
                    <td style={cellStyle}>6개월</td>
                  </tr>
                  <tr>
                    <td style={cellStyle}>웹사이트 접속 기록</td>
                    <td style={cellStyle}>통신비밀보호법</td>
                    <td style={cellStyle}>3개월</td>
                  </tr>
                </tbody>
              </table>
            </section>

            <section style={sectionStyle}>
              <h2 id="privacy-5" style={headingStyle}>5. 개인정보 처리 위탁</h2>
              <p>
                회사는 원활한 서비스 제공을 위해 다음과 같이 개인정보 처리 업무를
                외부에 위탁하고 있으며, 위탁 계약 시 개인정보 보호법 제26조에
                따라 필요한 사항을 규정하고 관리·감독하고 있습니다.
              </p>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={cellStyle}>수탁사</th>
                    <th style={cellStyle}>위탁 업무</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={cellStyle}>㈜토스페이먼츠</td>
                    <td style={cellStyle}>결제 처리 및 결제 관련 부가 서비스</td>
                  </tr>
                  <tr>
                    <td style={cellStyle}>Supabase Inc.</td>
                    <td style={cellStyle}>데이터베이스 호스팅 및 운영</td>
                  </tr>
                  <tr>
                    <td style={cellStyle}>Vercel Inc.</td>
                    <td style={cellStyle}>웹 서비스 호스팅 및 운영</td>
                  </tr>
                  <tr>
                    <td style={cellStyle}>㈜솔라피(Solapi)</td>
                    <td style={cellStyle}>안내 문자(SMS) 발송</td>
                  </tr>
                </tbody>
              </table>
            </section>

            <section style={sectionStyle}>
              <h2 id="privacy-6" style={headingStyle}>6. 개인정보의 제3자 제공</h2>
              <p>
                회사는 원칙적으로 정보주체의 개인정보를 제3자에게 제공하지
                않습니다. 다만 다음의 경우에는 예외로 합니다.
              </p>
              <ul style={listStyle}>
                <li>정보주체로부터 별도의 사전 동의를 받은 경우</li>
                <li>
                  법령의 규정에 의하거나 수사기관의 요구가 있는 경우 등 법령에서
                  정한 절차와 방법에 따르는 경우
                </li>
              </ul>
            </section>

            <section style={sectionStyle}>
              <h2 id="privacy-7" style={headingStyle}>7. 정보주체의 권리 및 행사 방법</h2>
              <ol style={listStyle}>
                <li>
                  정보주체는 언제든지 자신의 개인정보에 대하여 다음의 권리를
                  행사할 수 있습니다.
                  <ul style={listStyle}>
                    <li>개인정보 열람 요구</li>
                    <li>오류가 있을 경우 정정 요구</li>
                    <li>삭제 요구</li>
                    <li>처리 정지 요구</li>
                  </ul>
                </li>
                <li>
                  권리 행사는 서비스 내 &lsquo;계정 삭제&rsquo; 기능을 이용하거나,
                  개인정보보호책임자에게 서면·전자우편 등의 방법으로 요청할 수
                  있으며, 회사는 이에 대해 지체 없이 조치합니다.
                </li>
                <li>
                  만 14세 미만 아동의 경우, 위 권리는 법정대리인이 대리하여
                  행사할 수 있습니다.
                </li>
                <li>
                  회원 탈퇴는 서비스 내 계정 삭제 기능을 통해 진행하거나,
                  <a
                    href="mailto:help@concordedu.kr"
                    style={{ color: "var(--acc-text)" }}
                  >
                    {" "}help@concordedu.kr
                  </a>
                  로 요청할 수 있습니다.
                </li>
              </ol>
            </section>

            <section style={sectionStyle}>
              <h2 id="privacy-8" style={headingStyle}>8. 만 14세 미만 아동의 개인정보</h2>
              <p>
                회사는 만 14세 미만 아동의 개인정보를 수집·이용·제공하고자
                하는 경우, 법정대리인의 동의를 받아야 합니다. 회사는 법정대리인의
                동의 여부를 확인할 수 있는 절차를 갖추고 있으며, 법정대리인은
                아동의 개인정보에 대한 열람·정정·삭제·처리정지를 요청할 수
                있습니다.
              </p>
            </section>

            <section style={sectionStyle}>
              <h2 id="privacy-9" style={headingStyle}>9. 개인정보의 안전성 확보 조치</h2>
              <ul style={listStyle}>
                <li>
                  <strong>관리적 조치</strong> — 개인정보 취급 직원의 최소화 및
                  정기 교육, 내부 관리 계획 수립·시행
                </li>
                <li>
                  <strong>기술적 조치</strong> — 접근권한 관리, 접근통제 시스템
                  설치, 개인정보 암호화(HTTPS 전 구간, 저장 시 암호화), 보안
                  프로그램 설치·갱신
                </li>
                <li>
                  <strong>물리적 조치</strong> — 전산실·자료보관실 등의 접근
                  통제
                </li>
              </ul>
            </section>

            <section style={sectionStyle}>
              <h2 id="privacy-10" style={headingStyle}>10. 쿠키의 운영 및 거부</h2>
              <p>
                회사는 서비스 이용 편의를 위해 쿠키를 사용할 수 있습니다.
                정보주체는 브라우저 설정을 통해 쿠키 저장을 거부할 수 있으나,
                이 경우 일부 서비스 이용에 제한이 있을 수 있습니다.
              </p>
            </section>

            <section style={sectionStyle}>
              <h2 id="privacy-11" style={headingStyle}>11. 개인정보보호책임자</h2>
              <p>
                회사는 정보주체의 개인정보를 보호하고 개인정보와 관련한 불만을
                처리하기 위하여 아래와 같이 개인정보보호책임자를 지정하고
                있습니다.
              </p>
              <ul style={listStyle}>
                <li>개인정보보호책임자: [기재 예정]</li>
                <li>소속/직책: [기재 예정]</li>
                <li>
                  연락처:{" "}
                  <a
                    href="mailto:help@concordedu.kr"
                    style={{ color: "var(--acc-text)" }}
                  >
                    help@concordedu.kr
                  </a>
                </li>
              </ul>
              <p style={mutedStyle}>
                기타 개인정보 침해에 대한 신고나 상담이 필요한 경우 아래 기관에
                문의하실 수 있습니다.
              </p>
              <ul style={listStyle}>
                <li>개인정보분쟁조정위원회 (kopico.go.kr / 1833-6972)</li>
                <li>개인정보침해신고센터 (privacy.kisa.or.kr / 118)</li>
                <li>대검찰청 사이버범죄수사단 (spo.go.kr / 1301)</li>
                <li>경찰청 사이버안전국 (cyberbureau.police.go.kr / 182)</li>
              </ul>
            </section>

            <section style={sectionStyle}>
              <h2 id="privacy-12" style={headingStyle}>12. 고지의 의무</h2>
              <p>
                본 방침이 변경되는 경우 회사는 변경 사항의 시행 7일 전부터
                공지사항을 통해 고지합니다. 다만, 정보주체의 권리에 중대한 변경이
                발생하는 경우에는 최소 30일 전에 고지합니다.
              </p>
              <p style={{ ...mutedStyle, marginTop: 12 }}>
                시행일: [기재 예정]
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
          </ConcordReveal>
        </div>
      </section>
    </main>
  );
}
