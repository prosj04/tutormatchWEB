import Link from "next/link";
import { notFound } from "next/navigation";

import { getTutorPublicPhotoUrl } from "@/lib/cms-page-defaults";
import { getPublicTeacherById, getPublicTeacherIds } from "@/lib/public-teachers-cache";
import { startPerfTimer, timeAsync } from "@/lib/perf-timer";
import { getGroupedSiteContentBySections } from "@/lib/site-content";
import {
  parseJsonArray,
  type CareerEntry,
  type CertificateEntry,
  type EducationEntry,
} from "@/lib/teacher-profile-types";

type PageProps = {
  params: Promise<{ id: string }>;
};

export const revalidate = 300;

export async function generateStaticParams() {
  const ids = await getPublicTeacherIds();
  return ids.map((id) => ({ id }));
}

function splitSubjects(value: string): string[] {
  return value
    .split(",")
    .map((subject) => subject.trim())
    .filter(Boolean);
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const teacher = await timeAsync("cache.publicTeacher.metadata", () => getPublicTeacherById(id), {
    teacherId: id,
  });

  return {
    title: teacher ? `${teacher.name} 선생님` : "강사 프로필",
  };
}

export default async function TutorProfilePage({ params }: PageProps) {
  const timer = startPerfTimer("page.tutorProfile.total");
  const { id } = await params;
  const [siteContent, teacher] = await Promise.all([
    getGroupedSiteContentBySections(["tutors_page"]),
    timeAsync("cache.publicTeacher.detail", () => getPublicTeacherById(id), {
      teacherId: id,
    }),
  ]);

  if (!teacher) {
    timer.end({ notFound: true });
    notFound();
  }

  const publicPhotoUrl = getTutorPublicPhotoUrl(
    teacher.gender,
    siteContent,
    teacher.profile?.photoUrl,
  );

  const subjects = splitSubjects(teacher.subjects);
  const educationEntries = parseJsonArray<EducationEntry>(teacher.profile?.education);
  const careerEntries = parseJsonArray<CareerEntry>(teacher.profile?.career);
  const certificateEntries = parseJsonArray<CertificateEntry>(
    teacher.profile?.certificates,
  );

  const page = (
    <main>
      <section className="sec-sm" style={{ paddingBottom: 0 }}>
        <div className="wrap">
          <div className="profile-hero">
            <div className="profile-photo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={publicPhotoUrl} alt={`${teacher.name} 프로필 사진`} />
            </div>

            <div>
              <Link href="/tutors" className="profile-back">
                ← 강사진 목록
              </Link>
              <h1 style={{ marginTop: 16, fontSize: "clamp(2rem,4vw,2.75rem)", fontWeight: 800, letterSpacing: "-.04em" }}>
                {teacher.name} 선생님
              </h1>
              <p className="profile-subjects">
                {subjects.length > 0 ? subjects.join(" · ") : "담당 과목 협의"}
              </p>
              <p className="profile-intro">
                {teacher.profile?.intro || teacher.bio || "학생에게 맞는 수업을 설계합니다."}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="sec-sm">
        <div className="wrap detail-grid">
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
        </div>
      </section>
    </main>
  );
  timer.end({
    teacherId: teacher.id,
    educationCount: educationEntries.length,
    careerCount: careerEntries.length,
    certificateCount: certificateEntries.length,
  });
  return page;
}

function InfoBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article className="card panel-card">
      <h2 className="panel-title">{title}</h2>
      <dl style={{ marginTop: 20 }}>{children}</dl>
    </article>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  if (!value) return null;

  return (
    <div className="info-line">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
