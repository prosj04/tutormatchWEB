"use client";

import Image from "next/image";
import type { ReactNode } from "react";

import { CmsEdit } from "@/components/admin/CmsEditOverlay";
import { ConsultationApplyButton } from "@/components/consultation/ConsultationApplyButton";
import { formatCmsMultiline } from "@/lib/cms-page-defaults";
import type { LandingView } from "./landing-view";

/**
 * CMS 헤드라인의 줄바꿈 의도를 그대로 살리고(어절 중간 끊김 방지는 CSS text-wrap:balance·keep-all),
 * 강조어는 첫 "선생님" 한 곳만 액센트(.kw)로 — v3는 강조를 한 곳에만 둔다.
 */
function heroHeadline(text: string): ReactNode[] {
  const lines = formatCmsMultiline(text).split("\n");
  let used = false;
  return lines.map((line, lineIndex) => {
    const parts = line.split(/(선생님)/).map((part, partIndex) => {
      if (part === "선생님" && !used) {
        used = true;
        return (
          <span key={`kw-${lineIndex}-${partIndex}`} className="kw">
            {part}
          </span>
        );
      }
      return part;
    });
    return (
      <span key={`line-${lineIndex}-${line}`}>
        {parts}
        {lineIndex < lines.length - 1 ? <br /> : null}
      </span>
    );
  });
}

export function HeroEditorial({
  view,
  isEditMode,
}: {
  view: LandingView;
  isEditMode: boolean;
}) {
  const { getCmsValue, getCmsMultiline } = view;
  const caption = getCmsValue("hero", "model_caption", "").trim();

  return (
    <section className="lx-hero">
      <div className="wrap">
        <div className="grid-12 lx-hero-grid">
          <div className="lx-hero-copy">
            <span className="eyebrow reveal lx-fast">Concord Private Tutoring</span>
            <h1 className="display reveal lx-slow">
              <CmsEdit active={isEditMode} section="hero" cmsKey="headline" type="text">
                {heroHeadline(getCmsValue("hero", "headline", "학생마다 맞는\n선생님이 다릅니다"))}
              </CmsEdit>
            </h1>
            <p className="lede lx-hero-lede reveal lx-fast" style={{ whiteSpace: "pre-line" }}>
              <CmsEdit active={isEditMode} section="hero" cmsKey="subtext" type="text">
                {getCmsMultiline(
                  "hero",
                  "subtext",
                  "2학기를 뒤집는 여름방학, 잘 맞는 선생님에서 시작됩니다.",
                )}
              </CmsEdit>
            </p>

            <div className="lx-hero-cta reveal lx-fast">
              <ConsultationApplyButton className="btn btn-acc btn-lg" source="home_hero">
                <CmsEdit active={isEditMode} section="hero" cmsKey="cta_primary" type="text">
                  {getCmsValue("hero", "cta_primary", "선생님 추천받기")}
                </CmsEdit>
              </ConsultationApplyButton>
              <a href="#teachers" className="btn btn-text">
                <CmsEdit active={isEditMode} section="hero" cmsKey="cta_secondary" type="text">
                  {getCmsValue("hero", "cta_secondary", "선생님 둘러보기 →")}
                </CmsEdit>
              </a>
            </div>

            <p className="caption lx-hero-note reveal lx-fast">
              <CmsEdit active={isEditMode} section="hero" cmsKey="region_note" type="text">
                {getCmsValue("hero", "region_note", "서울 · 동탄 방문 수업")}
              </CmsEdit>
            </p>
          </div>

          <figure className="lx-hero-fig fig reveal lx-fast">
            <CmsEdit active={isEditMode} section="hero" cmsKey="model_image" type="image">
              <Image
                src={getCmsValue("hero", "model_image", "/images/placeholders/hero-thumbnail.png")}
                alt=""
                width={1448}
                height={1086}
                sizes="(max-width:960px) 92vw, 44vw"
                style={{ width: "100%", height: "auto" }}
                priority
              />
            </CmsEdit>
            {caption ? <figcaption className="caption">{caption}</figcaption> : null}
          </figure>
        </div>
      </div>
    </section>
  );
}
