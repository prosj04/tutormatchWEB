"use client";

import { getEffectivePhotoUrl } from "@/lib/profile-gender";
import type { TeacherProfileFormData } from "@/lib/teacher-profile-types";

type CredentialItem = {
  category: "학력" | "경력" | "자격증";
  year: string;
  title: string;
  detail: string;
};

type TeacherProfilePreviewProps = {
  name: string;
  subjects: string[];
  gender: string | null;
  form: TeacherProfileFormData;
};

function buildCredentials(form: TeacherProfileFormData): CredentialItem[] {
  const items: CredentialItem[] = [];

  for (const e of form.education) {
    if (!e.school && !e.major && !e.year) continue;
    items.push({
      category: "학력",
      year: e.year || "—",
      title: [e.school, e.major].filter(Boolean).join(" · ") || "학력",
      detail: e.major && e.school ? e.major : "",
    });
  }

  for (const c of form.career) {
    if (!c.org && !c.role && !c.period) continue;
    items.push({
      category: "경력",
      year: c.period || "—",
      title: c.org || "경력",
      detail: c.role || "",
    });
  }

  for (const cert of form.certificates) {
    if (!cert.name && !cert.year) continue;
    items.push({
      category: "자격증",
      year: cert.year || "—",
      title: cert.name || "자격증",
      detail: "",
    });
  }

  return items;
}

function categoryLabel(c: CredentialItem["category"]) {
  return c;
}

export function TeacherProfilePreview({
  name,
  subjects,
  gender,
  form,
}: TeacherProfilePreviewProps) {
  const credentials = buildCredentials(form);
  const headlineCred = credentials.find((c) => c.category === "학력")?.title ?? "";
  const photoSrc =
    form.photoUrl?.startsWith("blob:") ?
      form.photoUrl
    : getEffectivePhotoUrl(form.photoUrl, gender);
  const introParagraphs = form.intro
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="sf-prev">
      <p className="sf-prev-cap">미리보기 · 선생님 프로필</p>

      <div className="sf-prev-card">
        <div className="sf-prev-head">
          <div className="sf-prev-photo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoSrc}
              alt={name}
              width={96}
              height={112}
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className="sf-prev-id">
            <p className="sf-prev-eyebrow">Tutor profile</p>
            <p className="sf-prev-name">{name}</p>
            <p className="sf-prev-subjects">
              {subjects.length > 0 ? subjects.join(" · ") : "담당 과목"}
            </p>
            {headlineCred ? <p className="sf-prev-cred-line">{headlineCred}</p> : null}
          </div>
        </div>

        {introParagraphs.length > 0 && (
          <section className="sf-prev-body">
            <h3>Teaching approach</h3>
            <div className="sf-prev-intro">
              {introParagraphs.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </section>
        )}

        {credentials.length > 0 && (
          <section className="sf-prev-body">
            <h3>Credentials</h3>
            <ol className="sf-prev-cred">
              {credentials.map((c, i) => (
                <li key={`${c.category}-${i}`}>
                  <span className="sf-prev-cat">{categoryLabel(c.category)}</span>
                  <span className="sf-prev-title">{c.title}</span>
                  <span className="sf-prev-year">{c.year}</span>
                  {c.detail ? <span className="sf-prev-detail">{c.detail}</span> : null}
                </li>
              ))}
            </ol>
          </section>
        )}

        {subjects.length > 0 && (
          <section className="sf-prev-body">
            <div className="tag-line">
              {subjects.map((s) => (
                <span key={s}>{s}</span>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
