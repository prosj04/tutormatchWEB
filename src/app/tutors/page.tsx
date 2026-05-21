import { PublicShell } from "@/components/layout/PublicShell";
import { TutorsListing } from "@/components/tutors/TutorsListing";
import { prisma } from "@/lib/prisma";
import { getTutorPublicPhotoUrl } from "@/lib/cms-page-defaults";
import { getGroupedSiteContent } from "@/lib/site-content";

export const metadata = {
  title: "강사진",
};

export const dynamic = "force-dynamic";

function splitSubjects(value: string): string[] {
  return value
    .split(",")
    .map((subject) => subject.trim())
    .filter(Boolean);
}

export default async function TutorsPage() {
  const siteContent = await getGroupedSiteContent();
  const teachers = await prisma.teacher.findMany({
    where: {
      approved: true,
      user: { role: { in: ["TEACHER", "MANAGER"] } },
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      subjects: true,
      bio: true,
      education: true,
      experience: true,
      gender: true,
      profile: { select: { photoUrl: true, intro: true } },
    },
  });

  const tutors = teachers.map((teacher) => ({
    id: teacher.id,
    name: teacher.name,
    subjects: splitSubjects(teacher.subjects),
    bio: teacher.profile?.intro || teacher.bio,
    education: teacher.education,
    experience: teacher.experience,
    photoUrl: getTutorPublicPhotoUrl(teacher.gender, siteContent),
  }));

  return (
    <PublicShell>
      <TutorsListing tutors={tutors} siteContent={siteContent} />
    </PublicShell>
  );
}
