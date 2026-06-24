import { TutorsListing } from "@/components/tutors/TutorsListing";
import { startPerfTimer, timeAsync } from "@/lib/perf-timer";
import { getTutorPublicPhotoUrl } from "@/lib/cms-page-defaults";
import { getPublicTeachers } from "@/lib/public-teachers-cache";
import { getGroupedSiteContentBySections } from "@/lib/site-content";

export const metadata = {
  title: "강사진",
};

export const revalidate = 300;

type SearchParams = { cms_edit?: string | string[] };

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function splitSubjects(value: string): string[] {
  return value
    .split(",")
    .map((subject) => subject.trim())
    .filter(Boolean);
}

export default async function TutorsPage({ searchParams }: { searchParams?: SearchParams }) {
  const timer = startPerfTimer("page.tutors.total");
  const isEditMode = first(searchParams?.cms_edit) === "1";
  const [siteContent, teachers] = await Promise.all([
    getGroupedSiteContentBySections(["tutors_page", "spacing"]),
    timeAsync("cache.publicTeachers.list", () => getPublicTeachers()),
  ]);

  const tutors = teachers.map((teacher) => ({
    id: teacher.id,
    name: teacher.name,
    subjects: splitSubjects(teacher.subjects),
    bio: teacher.profile?.intro || teacher.bio,
    education: teacher.education,
    experience: teacher.experience,
    photoUrl: getTutorPublicPhotoUrl(teacher.gender, siteContent, teacher.profile?.photoUrl),
  }));

  const page = <TutorsListing tutors={tutors} siteContent={siteContent} isEditMode={isEditMode} />;
  timer.end({ tutorCount: tutors.length });
  return page;
}
