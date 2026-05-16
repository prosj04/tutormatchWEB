import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTutorById, tutors } from "@/lib/tutors-data";
import { TutorProfile } from "@/components/tutors/TutorProfile";

export const dynamic = "force-static";
export const dynamicParams = false;

type PageProps = {
  params: { id: string };
};

export function generateStaticParams() {
  return tutors.map((t) => ({ id: t.id }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  const tutor = getTutorById(params.id);
  if (!tutor) return { title: "강사" };
  return {
    title: tutor.name,
    description: tutor.tagline,
  };
}

export default function TutorProfilePage({ params }: PageProps) {
  const tutor = getTutorById(params.id);
  if (!tutor) notFound();

  return <TutorProfile tutor={tutor} />;
}
