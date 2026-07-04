import { NextResponse } from "next/server";

import { PUBLIC_TEACHERS_CACHE_TAG, revalidatePublicCms } from "@/lib/public-cms-cache";
import { prisma } from "@/lib/prisma";
import {
  type CareerEntry,
  type CertificateEntry,
  type EducationEntry,
  parseJsonArray,
} from "@/lib/teacher-profile-types";
import { requireTeacherAllowPending } from "@/lib/teacher-auth";

function serializeEntries<T>(entries: T[]): string {
  return JSON.stringify(entries);
}

export async function GET() {
  const authResult = await requireTeacherAllowPending();
  if ("error" in authResult) return authResult.error;
  const { teacher } = authResult;

  const profile = await prisma.teacherProfile.findUnique({
    where: { teacherId: teacher.id },
  });

  return NextResponse.json({
    teacher: {
      id: teacher.id,
      name: teacher.name,
      subjects: teacher.subjects,
      bio: teacher.bio,
    },
    profile: profile
      ? {
          photoUrl: profile.photoUrl,
          intro: profile.intro,
          education: parseJsonArray<EducationEntry>(profile.education),
          career: parseJsonArray<CareerEntry>(profile.career),
          certificates: parseJsonArray<CertificateEntry>(profile.certificates),
          resumeUrls: parseJsonArray<string>(profile.resumeUrls),
          documentUrls: parseJsonArray<string>(profile.documentUrls),
          updatedAt: profile.updatedAt,
        }
      : null,
  });
}

export async function PATCH(request: Request) {
  const authResult = await requireTeacherAllowPending();
  if ("error" in authResult) return authResult.error;
  const { teacher } = authResult;

  let body: {
    photoUrl?: unknown;
    intro?: unknown;
    career?: unknown;
    education?: unknown;
    certificates?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const photoUrl =
    body.photoUrl === null || body.photoUrl === undefined
      ? undefined
      : typeof body.photoUrl === "string"
        ? body.photoUrl
        : null;

  const intro = typeof body.intro === "string" ? body.intro : "";

  const education = Array.isArray(body.education)
    ? (body.education as EducationEntry[])
    : [];
  const career = Array.isArray(body.career) ? (body.career as CareerEntry[]) : [];
  const certificates = Array.isArray(body.certificates)
    ? (body.certificates as CertificateEntry[])
    : [];

  const profile = await prisma.teacherProfile.upsert({
    where: { teacherId: teacher.id },
    create: {
      teacherId: teacher.id,
      photoUrl: photoUrl ?? null,
      intro,
      education: serializeEntries(education),
      career: serializeEntries(career),
      certificates: serializeEntries(certificates),
    },
    update: {
      ...(photoUrl !== undefined ? { photoUrl } : {}),
      intro,
      education: serializeEntries(education),
      career: serializeEntries(career),
      certificates: serializeEntries(certificates),
    },
  });

  revalidatePublicCms(PUBLIC_TEACHERS_CACHE_TAG);
  return NextResponse.json({
    profile: {
      photoUrl: profile.photoUrl,
      intro: profile.intro,
      education: parseJsonArray<EducationEntry>(profile.education),
      career: parseJsonArray<CareerEntry>(profile.career),
      certificates: parseJsonArray<CertificateEntry>(profile.certificates),
      resumeUrls: parseJsonArray<string>(profile.resumeUrls),
      documentUrls: parseJsonArray<string>(profile.documentUrls),
      updatedAt: profile.updatedAt,
    },
  });
}
