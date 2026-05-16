import Image from "next/image";
import Link from "next/link";
import type { Tutor } from "@/lib/tutors-data";
import { TutorConsultSidebar } from "./TutorConsultSidebar";

function Stars({ value }: { value: number }) {
  const full = Math.min(5, Math.round(value));
  return (
    <span className="text-primary" aria-hidden>
      {Array.from({ length: full }).map((_, i) => (
        <span key={i}>★</span>
      ))}
    </span>
  );
}

function categoryLabel(c: Tutor["credentials"][0]["category"]) {
  switch (c) {
    case "학력":
      return "학력";
    case "경력":
      return "경력";
    case "자격증":
      return "자격증";
    default:
      return c;
  }
}

type TutorProfileProps = {
  tutor: Tutor;
};

export function TutorProfile({ tutor: t }: TutorProfileProps) {
  const credDegree = t.credentials.find((c) => c.category === "학력");
  const headlineCred = credDegree?.title ?? t.credentials[0]?.title ?? "";

  return (
    <article className="bg-neutral-90">
      <section className="border-b border-neutral-80 bg-neutral-100 text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-8 py-16 md:grid-cols-[0.85fr_1.15fr] md:gap-14 md:py-24">
          <div className="flex items-center justify-center">
            <div className="relative h-72 w-72 overflow-hidden rounded-full bg-gradient-to-br from-primary to-accent p-1 md:h-96 md:w-96">
              <div className="relative h-full w-full overflow-hidden rounded-full">
                <Image
                  src={t.image}
                  alt={t.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 288px, 384px"
                  priority
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col justify-center">
            <p className="text-xs font-black uppercase tracking-wider text-primary">
              Tutor profile
            </p>
            <h1 className="mt-4 text-5xl font-black leading-tight tracking-[-0.04em] text-white sm:text-7xl">
              {t.name} 선생님
            </h1>
            <p className="mt-5 text-2xl font-black leading-snug">
              {t.tagline} <span className="text-primary">전문가</span>
            </p>
            <p className="mt-6 text-sm font-medium leading-relaxed text-neutral-30">{headlineCred}</p>
            <div className="mt-6 flex flex-wrap items-center gap-4 text-sm font-bold text-neutral-30">
              <span className="flex items-center gap-2">
                <Stars value={t.rating} />
                <span className="font-bold text-white">{t.rating.toFixed(2)}</span>
              </span>
              <span className="h-3 w-px bg-neutral-80" aria-hidden />
              <span>{t.region}</span>
            </div>
            <Link
              href="/tutors"
              className="mt-10 inline-flex w-fit rounded-full border border-neutral-80 px-5 py-3 text-xs font-black uppercase tracking-wider text-white transition hover:border-primary hover:text-primary"
            >
              강사 목록
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-8 py-14 text-white md:py-20">
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-14 xl:grid-cols-[minmax(0,1fr)_22rem] xl:gap-16">
          <div className="space-y-16 lg:space-y-20">
            <section>
              <h2 className="text-2xl font-black text-white md:text-3xl">Credentials</h2>
              <p className="mt-2 text-sm text-neutral-30">학력 · 경력 · 자격증</p>
              <ol className="relative mt-12 space-y-0 border-l border-primary/40 pl-8 md:pl-10">
                {t.credentials.map((c, i) => (
                  <li key={`${c.year}-${i}`} className="relative pb-12 last:pb-0">
                    <span className="absolute -left-8 top-1 flex h-3 w-3 -translate-x-[5px] rounded-full border-2 border-primary bg-neutral-90 md:-left-10" />
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                      {categoryLabel(c.category)}
                    </p>
                    <p className="mt-2 text-xl font-bold text-white">{c.title}</p>
                    {c.detail ? (
                      <p className="mt-2 max-w-xl text-sm leading-relaxed text-neutral-30">{c.detail}</p>
                    ) : null}
                    <p className="mt-3 text-xs uppercase tracking-wider text-neutral-40">{c.year}</p>
                  </li>
                ))}
              </ol>
            </section>

            <section>
              <h2 className="text-2xl font-black text-white md:text-3xl">Teaching approach</h2>
              <p className="mt-2 text-sm text-neutral-30">수업 철학 및 방식</p>
              <div className="mt-10 max-w-3xl space-y-6 text-base leading-relaxed text-neutral-30">
                {t.teachingStyle.map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-black text-white md:text-3xl">Subjects & levels</h2>
              <p className="mt-2 text-sm text-neutral-30">지원 과목 및 단계</p>
              <div className="mt-8 flex flex-wrap gap-2">
                {t.subjectLevels.map((label) => (
                  <span
                    key={label}
                    className="rounded-full border border-neutral-80 bg-neutral-100 px-4 py-2 text-sm font-bold text-white"
                  >
                    {label}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {t.subjects.map((s) => (
                  <span
                    key={s}
                    className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-black text-white md:text-3xl">Student reviews</h2>
              <p className="mt-2 text-sm text-neutral-30">검증된 후기</p>
              <ul className="mt-10 space-y-6">
                {t.reviews.map((r, i) => (
                  <li
                    key={i}
                    className="rounded-[28px] border border-neutral-80 bg-neutral-100 p-6 shadow-sm md:p-8"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-bold text-white">{r.author}</p>
                        <p className="mt-1 text-xs uppercase tracking-wider text-neutral-40">
                          {r.role}
                        </p>
                      </div>
                      <span className="text-primary" aria-label={`${r.rating}점`}>
                        {Array.from({ length: r.rating }).map((_, j) => (
                          <span key={j}>★</span>
                        ))}
                        {Array.from({ length: 5 - r.rating }).map((_, j) => (
                          <span key={j} className="text-neutral-80">
                            ★
                          </span>
                        ))}
                      </span>
                    </div>
                    <p className="mt-5 text-sm leading-relaxed text-neutral-30 md:text-base">{r.text}</p>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <aside
            id="booking"
            className="mt-12 shrink-0 lg:sticky lg:top-24 lg:mt-0 lg:self-start"
          >
            <TutorConsultSidebar tutorId={t.id} />
          </aside>
        </div>
      </div>
    </article>
  );
}
