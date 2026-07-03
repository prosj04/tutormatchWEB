import Link from "next/link";

import { ConsultationApplyButton } from "@/components/consultation/ConsultationApplyButton";
import { getCmsSectionValue } from "@/lib/cms-page-defaults";
import type { GroupedSiteContent } from "@/lib/site-content";

export function ConcordSiteFooter({ siteContent }: { siteContent?: GroupedSiteContent }) {
  const get = (key: string, fb: string) => getCmsSectionValue(siteContent, "footer", key, fb);
  const copyright = get("copyright", "© {year} Concord Private Tutoring.").replace(
    "{year}",
    String(new Date().getFullYear()),
  );

  return (
    <footer className="site">
      <div className="wrap">
        <div className="foot-top">
          <div>
            <Link className="logo" href="/">
              Concord<span>.</span>
            </Link>
            <div className="foot-meta">
              {get("hours_chat", "채팅문의 10:00~22:00")} · {get("hours_call", "전화문의 평일 10:00~19:00")}
            </div>
          </div>
          <div className="foot-cols">
            <div className="foot-col">
              <h4>서비스</h4>
              <Link href="/tutors">강사진</Link>
              <Link href="/pricing">요금제</Link>
              <Link href="/faq">FAQ</Link>
              <ConsultationApplyButton className="foot-consult-link">상담 신청</ConsultationApplyButton>
            </div>
            {(() => {
              const isValidSnsUrl = (raw: string) => {
                const v = raw.trim();
                return v.length > 0 && v !== "#" && /^https?:\/\//i.test(v);
              };
              const snsLinks = [
                { label: "Instagram", href: get("sns_instagram", "") },
                { label: "YouTube", href: get("sns_youtube", "") },
                { label: "Blog", href: get("sns_blog", "") },
              ].filter((link) => isValidSnsUrl(link.href));
              if (snsLinks.length === 0) return null;
              return (
                <div className="foot-col">
                  <h4>SNS</h4>
                  {snsLinks.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
        <div className="foot-meta">
          {get("company_name", "콘코드")}
          <br />
          <div className="legal">
            <Link href="/terms">{get("label_terms", "이용약관")}</Link>
            <Link href="/privacy">{get("label_privacy", "개인정보처리방침")}</Link>
            <Link href="/refund">{get("label_refund", "환불정책")}</Link>
          </div>
          <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between" }}>
            <span>{copyright}</span>
            <Link href="/teacher-portal" style={{ color: "var(--mut-2)", fontSize: 13 }}>
              {get("label_teacher", "선생님이신가요?")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
