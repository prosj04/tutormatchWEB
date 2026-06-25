import type { Metadata } from "next";

import { ConcordPageHead } from "@/components/concord/ConcordPageHead";

export const metadata: Metadata = {
  title: "개인정보처리방침",
};

export default function PrivacyPage() {
  return (
    <main>
      <ConcordPageHead eyebrow="Legal" title="개인정보처리방침" description="수집하는 개인정보의 항목, 수집 목적 및 이용에 관한 방침입니다." />
      <section className="sec" style={{ paddingTop: 0 }}>
        <div className="wrap" style={{ maxWidth: 720 }}>
          <div className="card" style={{ padding: "clamp(1.5rem, 4vw, 3rem)", lineHeight: 1.8 }}>
            <p style={{ color: "var(--mut)" }}>
              개인정보처리방침 내용이 준비 중입니다. 빠른 시일 내에 업데이트하겠습니다.
            </p>
            <p style={{ color: "var(--mut)", marginTop: 16 }}>
              문의: <a href="mailto:help@concordedu.kr" style={{ color: "var(--acc-text)" }}>help@concordedu.kr</a>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
