import { PublicShell } from "@/components/layout/PublicShell";
import { TutorsListing } from "@/components/tutors/TutorsListing";
import { startPerfTimer, timeAsync } from "@/lib/perf-timer";
import { getTutorPublicPhotoUrl } from "@/lib/cms-page-defaults";
import { getPublicTeachers } from "@/lib/public-teachers-cache";
import { getGroupedSiteContent } from "@/lib/site-content";

export const metadata = {
  title: "강사진",
};

export const revalidate = 300;

function splitSubjects(value: string): string[] {
  return value
    .split(",")
    .map((subject) => subject.trim())
    .filter(Boolean);
}

export default async function TutorsPage() {
  const timer = startPerfTimer("page.tutors.total");
  const siteContent = await getGroupedSiteContent();
  const teachers = await timeAsync("cache.publicTeachers.list", () => getPublicTeachers());

  const tutors = teachers.map((teacher) => ({
    id: teacher.id,
    name: teacher.name,
    subjects: splitSubjects(teacher.subjects),
    bio: teacher.profile?.intro || teacher.bio,
    education: teacher.education,
    experience: teacher.experience,
    photoUrl: getTutorPublicPhotoUrl(teacher.gender, siteContent),
  }));

  const page = (
    <PublicShell>
      <TutorsListing tutors={tutors} siteContent={siteContent} />
    </PublicShell>
  );
  timer.end({ tutorCount: tutors.length });
  return page;
}
