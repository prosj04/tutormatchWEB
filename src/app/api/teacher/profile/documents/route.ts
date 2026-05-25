import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  createSupabaseBrowserClient,
  TEACHER_DOCUMENT_BUCKET,
  uploadTeacherDocument,
} from "@/lib/supabase-client";
import { startPerfTimer, timeAsync } from "@/lib/perf-timer";
import { parseJsonArray } from "@/lib/teacher-profile-types";
import { requireTeacher } from "@/lib/teacher-auth";

type DocumentType = "resume" | "document";

function isDocumentType(value: unknown): value is DocumentType {
  return value === "resume" || value === "document";
}

function serializeUrls(urls: string[]): string {
  return JSON.stringify(urls);
}

function filenameFromPath(path: string): string {
  return decodeURIComponent(path.split("/").pop() || "첨부파일");
}

function storagePathFromUrl(url: string): string {
  const marker = `/${TEACHER_DOCUMENT_BUCKET}/`;
  const index = url.indexOf(marker);
  if (index === -1) return url;
  return decodeURIComponent(url.slice(index + marker.length).split("?")[0]);
}

async function buildDocumentFiles(resumeUrls: string[], documentUrls: string[]) {
  const totalTimer = startPerfTimer("api.teacherProfile.documents.buildSignedUrls", {
    resumeCount: resumeUrls.length,
    documentCount: documentUrls.length,
  });
  const supabase = createSupabaseBrowserClient();

  async function sign(url: string) {
    const path = storagePathFromUrl(url);
    const timer = startPerfTimer("supabase.teacherDocuments.createSignedUrl", { path });
    const { data, error } = await supabase.storage
      .from(TEACHER_DOCUMENT_BUCKET)
      .createSignedUrl(path, 60 * 10);
    timer.end();

    if (error) throw error;

    return {
      url,
      signedUrl: data.signedUrl,
      name: filenameFromPath(path),
    };
  }

  const [resumeFiles, documentFiles] = await Promise.all([
    Promise.all(resumeUrls.map(sign)),
    Promise.all(documentUrls.map(sign)),
  ]);
  totalTimer.end();

  return { resumeFiles, documentFiles };
}

async function getDocumentPayload(teacherId: string) {
  const profile = await timeAsync(
    "prisma.teacherProfile.findUnique.documents",
    () =>
      prisma.teacherProfile.findUnique({
        where: { teacherId },
        select: { resumeUrls: true, documentUrls: true },
      }),
    { teacherId },
  );

  const resumeUrls = parseJsonArray<string>(profile?.resumeUrls);
  const documentUrls = parseJsonArray<string>(profile?.documentUrls);

  return buildDocumentFiles(resumeUrls, documentUrls);
}

export async function GET() {
  const authResult = await requireTeacher();
  if ("error" in authResult) return authResult.error;
  const { teacher } = authResult;

  return NextResponse.json(
    await timeAsync("api.teacherProfile.documents.GET", () => getDocumentPayload(teacher.id), {
      teacherId: teacher.id,
    }),
  );
}

export async function POST(request: Request) {
  const authResult = await requireTeacher();
  if ("error" in authResult) return authResult.error;
  const { teacher } = authResult;

  const formData = await request.formData();
  const file = formData.get("file");
  const type = formData.get("type");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File is required" }, { status: 400 });
  }
  if (!isDocumentType(type)) {
    return NextResponse.json({ error: "Invalid document type" }, { status: 400 });
  }

  const uploadedUrl = await uploadTeacherDocument(teacher.id, file, type);

  const existing = await timeAsync(
    "prisma.teacherProfile.findUnique.documentsExisting",
    () =>
      prisma.teacherProfile.findUnique({
        where: { teacherId: teacher.id },
        select: { resumeUrls: true, documentUrls: true },
      }),
    { teacherId: teacher.id },
  );

  const resumeUrls = parseJsonArray<string>(existing?.resumeUrls);
  const documentUrls = parseJsonArray<string>(existing?.documentUrls);

  if (type === "resume") {
    resumeUrls.push(uploadedUrl);
  } else {
    documentUrls.push(uploadedUrl);
  }

  await timeAsync(
    "prisma.teacherProfile.upsert.documents",
    () =>
      prisma.teacherProfile.upsert({
        where: { teacherId: teacher.id },
        create: {
          teacherId: teacher.id,
          resumeUrls: serializeUrls(resumeUrls),
          documentUrls: serializeUrls(documentUrls),
        },
        update: {
          resumeUrls: serializeUrls(resumeUrls),
          documentUrls: serializeUrls(documentUrls),
        },
      }),
    { teacherId: teacher.id, type },
  );

  return NextResponse.json(await getDocumentPayload(teacher.id));
}

export async function DELETE(request: Request) {
  const authResult = await requireTeacher();
  if ("error" in authResult) return authResult.error;
  const { teacher } = authResult;

  let body: { url?: unknown; type?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body.url !== "string" || !isDocumentType(body.type)) {
    return NextResponse.json({ error: "Invalid fields" }, { status: 400 });
  }

  const existing = await timeAsync(
    "prisma.teacherProfile.findUnique.documentsDelete",
    () =>
      prisma.teacherProfile.findUnique({
        where: { teacherId: teacher.id },
        select: { resumeUrls: true, documentUrls: true },
      }),
    { teacherId: teacher.id, type: body.type },
  );

  const resumeUrls = parseJsonArray<string>(existing?.resumeUrls);
  const documentUrls = parseJsonArray<string>(existing?.documentUrls);
  const nextResumeUrls =
    body.type === "resume" ? resumeUrls.filter((url) => url !== body.url) : resumeUrls;
  const nextDocumentUrls =
    body.type === "document"
      ? documentUrls.filter((url) => url !== body.url)
      : documentUrls;

  await timeAsync(
    "prisma.teacherProfile.upsert.documentsDelete",
    () =>
      prisma.teacherProfile.upsert({
        where: { teacherId: teacher.id },
        create: {
          teacherId: teacher.id,
          resumeUrls: serializeUrls(nextResumeUrls),
          documentUrls: serializeUrls(nextDocumentUrls),
        },
        update: {
          resumeUrls: serializeUrls(nextResumeUrls),
          documentUrls: serializeUrls(nextDocumentUrls),
        },
      }),
    { teacherId: teacher.id, type: body.type },
  );

  const removeTimer = startPerfTimer("supabase.teacherDocuments.remove", {
    teacherId: teacher.id,
    type: body.type,
  });
  await createSupabaseBrowserClient()
    .storage
    .from(TEACHER_DOCUMENT_BUCKET)
    .remove([storagePathFromUrl(body.url)]);
  removeTimer.end();

  return NextResponse.json(await getDocumentPayload(teacher.id));
}
