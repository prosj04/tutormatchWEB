"use client";

import { DefaultAvatar } from "@/components/ui/DefaultAvatar";
import type { TeacherProfileFormData } from "@/lib/teacher-profile-types";

type CredentialItem = {
  category: "학력" | "경력" | "자격증";
  year: string;
  title: string;
  detail: string;
};

type TeacherProfilePreviewProps = {
  teacherId: string;
  name: string;
  subjects: string[];
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
  form,
}: TeacherProfilePreviewProps) {
  const credentials = buildCredentials(form);
  const headlineCred = credentials.find((c) => c.category === "학력")?.title ?? "";
  const photoSrc = form.photoUrl;
  const introParagraphs = form.intro
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <p className="border-b border-gray-100 bg-background px-4 py-2 text-xs font-medium text-text-secondary">
        미리보기 · 선생님 프로필
      </p>

      <div className="border-b border-gray-100 bg-background p-4">
        <div className="flex gap-4">
          <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-xl bg-gray-100">
            {photoSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoSrc}
                alt={name}
                width={96}
                height={112}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <DefaultAvatar size={64} />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
              Tutor profile
            </p>
            <h2 className="mt-1 text-xl font-black text-text-primary">{name}</h2>
            <p className="mt-1 text-sm text-text-secondary">
              {subjects.length > 0 ? subjects.join(" · ") : "담당 과목"}
            </p>
            {headlineCred ? (
              <p className="mt-2 text-xs text-text-muted">{headlineCred}</p>
            ) : null}
          </div>
        </div>
      </div>

      {introParagraphs.length > 0 && (
        <section className="border-b border-gray-100 p-4">
          <h3 className="text-sm font-bold text-text-primary">Teaching approach</h3>
          <div className="mt-3 space-y-2 text-xs leading-relaxed text-text-secondary">
            {introParagraphs.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </section>
      )}

      {credentials.length > 0 && (
        <section className="p-4">
          <h3 className="text-sm font-bold text-text-primary">Credentials</h3>
          <ol className="relative mt-4 space-y-0 border-l border-primary/30 pl-6">
            {credentials.map((c, i) => (
              <li key={`${c.category}-${i}`} className="relative pb-6 last:pb-0">
                <span className="absolute -left-6 top-1 h-2 w-2 -translate-x-[3px] rounded-full border border-primary bg-white" />
                <p className="text-[10px] font-semibold uppercase text-primary">
                  {categoryLabel(c.category)}
                </p>
                <p className="mt-1 text-sm font-bold text-text-primary">{c.title}</p>
                {c.detail ? <p className="mt-0.5 text-xs text-text-secondary">{c.detail}</p> : null}
                <p className="mt-1 text-[10px] uppercase text-text-muted">{c.year}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      {subjects.length > 0 && (
        <section className="border-t border-gray-100 p-4">
          <div className="flex flex-wrap gap-1.5">
            {subjects.map((s) => (
              <span
                key={s}
                className="rounded-full bg-accent px-2.5 py-1 text-[10px] font-semibold text-white"
              >
                {s}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
