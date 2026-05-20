import Link from "next/link";
import { notFound } from "next/navigation";

import { PublicShell } from "@/components/layout/PublicShell";
import { getTutorPublicPhotoUrl } from "@/lib/cms-page-defaults";
import { prisma } from "@/lib/prisma";
import { getGroupedSiteContent } from "@/lib/site-content";
import {
  parseJsonArray,
  type CareerEntry,
  type CertificateEntry,
  type EducationEntry,
} from "@/lib/teacher-profile-types";

type PageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

function splitSubjects(value: string): string[] {
  return value
    .split(",")
    .map((subject) => subject.trim())
    .filter(Boolean);
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const teacher = await prisma.teacher.findFirst({
    where: { id, approved: true },
    select: { name: true },
  });

  return {
    title: teacher ? `${teacher.name} 선생님` : "강사 프로필",
  };
}

export default async function TutorProfilePage({ params }: PageProps) {
  const { id } = await params;
  const [teacher, siteContent] = await Promise.all([
    prisma.teacher.findFirst({
      where: {
        id,
        approved: true,
        user: { role: { in: ["TEACHER", "MANAGER"] } },
      },
      select: {
        id: true,
        name: true,
        subjects: true,
        bio: true,
        education: true,
        experience: true,
        gender: true,
        profile: {
          select: {
            photoUrl: true,
            intro: true,
            career: true,
            education: true,
            certificates: true,
          },
        },
      },
    }),
    getGroupedSiteContent(),
  ]);

  if (!teacher) notFound();

  const publicPhotoUrl = getTutorPublicPhotoUrl(teacher.gender, siteContent);

  const subjects = splitSubjects(teacher.subjects);
  const educationEntries = parseJsonArray<EducationEntry>(teacher.profile?.education);
  const careerEntries = parseJsonArray<CareerEntry>(teacher.profile?.career);
  const certificateEntries = parseJsonArray<CertificateEntry>(
    teacher.profile?.certificates,
  );

  return (
    <PublicShell>
      <main className="pb-24">
        <section className="border-b border-gray-100 bg-white px-6 py-16 md:py-20">
          <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[14rem_1fr] md:items-center">
            <div className="h-48 w-48 overflow-hidden rounded-3xl bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={publicPhotoUrl}
                alt={`${teacher.name} 프로필 사진`}
                className="h-full w-full object-cover"
              />
            </div>

            <div>
              <Link
                href="/tutors"
                className="text-sm font-bold text-text-muted underline-offset-4 hover:text-primary hover:underline"
              >
                ← 강사진 목록
              </Link>
              <h1 className="mt-5 text-4xl font-black tracking-[-0.04em] text-text-primary md:text-5xl">
                {teacher.name} 선생님
              </h1>
              <p className="mt-3 text-lg font-bold text-primary">
                {subjects.length > 0 ? subjects.join(" · ") : "담당 과목 협의"}
              </p>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-text-secondary">
                {teacher.profile?.intro || teacher.bio || "학생에게 맞는 수업을 설계합니다."}
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-6 px-6 py-12 md:grid-cols-2">
          <InfoBlock title="관리자 카드 정보">
            <InfoLine label="학력" value={teacher.education} />
            <InfoLine label="경력" value={teacher.experience} />
          </InfoBlock>

          <InfoBlock title="상세 프로필">
            {educationEntries.map((entry, index) => (
              <InfoLine
                key={`education-${index}`}
                label="학력"
                value={[entry.school, entry.major, entry.year].filter(Boolean).join(" · ")}
              />
            ))}
            {careerEntries.map((entry, index) => (
              <InfoLine
                key={`career-${index}`}
                label="경력"
                value={[entry.org, entry.role, entry.period].filter(Boolean).join(" · ")}
              />
            ))}
            {certificateEntries.map((entry, index) => (
              <InfoLine
                key={`certificate-${index}`}
                label="자격증"
                value={[entry.name, entry.year].filter(Boolean).join(" · ")}
              />
            ))}
          </InfoBlock>
        </section>
      </main>
    </PublicShell>
  );
}

function InfoBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-black text-text-primary">{title}</h2>
      <div className="mt-5 space-y-4">{children}</div>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  if (!value) return null;

  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-wider text-text-muted">{label}</dt>
      <dd className="mt-1 text-sm leading-relaxed text-text-secondary">{value}</dd>
    </div>
  );
}
