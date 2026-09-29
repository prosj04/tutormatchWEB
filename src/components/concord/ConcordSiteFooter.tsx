import Link from "next/link";

import { ConsultationApplyButton } from "@/components/consultation/ConsultationApplyButton";
import { getCmsSectionValue } from "@/lib/cms-page-defaults";
import { KAKAO_CHANNEL_CHAT_URL } from "@/lib/kakao-channel";
import type { GroupedSiteContent } from "@/lib/site-content";

/**
 * 공개 푸터 (디자인 시스템 v3) — 문구는 전부 footer CMS 키 그대로.
 */
export function ConcordSiteFooter({ siteContent }: { siteContent?: GroupedSiteContent }) {
  const get = (key: string, fb: string) => getCmsSectionValue(siteContent, "footer", key, fb);
  const copyright = get("copyright", "© {year} Concord Private Tutoring.").replace(
    "{year}",
    String(new Date().getFullYear()),
  );
  const phone = get("contact_phone", "").trim();
  const email = get("contact_email", "help@concordedu.kr");

  const isValidSnsUrl = (raw: string) => {
    const v = raw.trim();
    return v.length > 0 && v !== "#" && /^https?:\/\//i.test(v);
  };
  const snsLinks = [
    { label: "Instagram", href: get("sns_instagram", "") },
    { label: "YouTube", href: get("sns_youtube", "") },
    { label: "Blog", href: get("sns_blog", "") },
  ].filter((link) => isValidSnsUrl(link.href));

  return (
    <footer className="site">
      <div className="wrap">
        <div className="foot-top">
          <div className="foot-brand">
            <Link className="logo" href="/">
              Concord<span>.</span>
            </Link>
            <p>
              {get("hours_chat", "채팅문의 10:00~22:00")}
              <br />
              {get("hours_call", "전화문의 평일 10:00~19:00")}
              <br />
              <a className="link" href={`mailto:${email}`}>
                {email}
              </a>
              {phone ? (
                <>
                  {" · "}
                  <a className="link" href={`tel:${phone.replace(/[^0-9+]/g, "")}`}>
                    {phone}
                  </a>
                </>
              ) : null}
            </p>
          </div>
          <div className="foot-cols">
            <div className="foot-col">
              <h4>{get("col_service_title", "서비스")}</h4>
              <Link href="/tutors">{get("link_tutors", "강사진")}</Link>
              <Link href="/pricing">{get("link_pricing", "요금제")}</Link>
              <Link href="/faq">{get("link_faq", "FAQ")}</Link>
            </div>
            <div className="foot-col">
              <h4>{get("col_contact_title", "상담")}</h4>
              <ConsultationApplyButton className="foot-consult-link">{get("link_consult", "상담 신청")}</ConsultationApplyButton>
              <a href={KAKAO_CHANNEL_CHAT_URL} target="_blank" rel="noopener noreferrer">
                {get("link_kakao", "카카오톡 상담")}
              </a>
              <Link href="/teacher-portal">{get("label_teacher", "선생님이신가요?")}</Link>
            </div>
            {snsLinks.length > 0 ? (
              <div className="foot-col">
                <h4>{get("col_sns_title", "SNS")}</h4>
                {snsLinks.map((link) => (
                  <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer">
                    {link.label}
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        </div>
        <div className="foot-meta">
          <span>
            {get("company_name", "콘코드")} · {copyright}
          </span>
          <div className="legal">
            <Link href="/terms">{get("label_terms", "이용약관")}</Link>
            <Link href="/privacy">{get("label_privacy", "개인정보처리방침")}</Link>
            <Link href="/refund">{get("label_refund", "환불정책")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
