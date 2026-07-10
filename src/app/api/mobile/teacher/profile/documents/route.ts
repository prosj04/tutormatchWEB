import { NextResponse } from "next/server";

import { requireMobileTeacherAllowPending } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { TEACHER_DOCUMENT_BUCKET } from "@/lib/supabase-client";
import { parseJsonArray } from "@/lib/teacher-profile-types";

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
  const supabase = createSupabaseAdminClient();

  async function sign(url: string) {
    const path = storagePathFromUrl(url);
    const { data, error } = await supabase.storage
      .from(TEACHER_DOCUMENT_BUCKET)
      .createSignedUrl(path, 60 * 10);
    if (error) throw error;
    return { url, signedUrl: data.signedUrl, name: filenameFromPath(path) };
  }

  const [resumeFiles, documentFiles] = await Promise.all([
    Promise.all(resumeUrls.map(sign)),
    Promise.all(documentUrls.map(sign)),
  ]);

  return { resumeFiles, documentFiles };
}

async function getDocumentPayload(teacherId: string) {
  const profile = await prisma.teacherProfile.findUnique({
    where: { teacherId },
    select: { resumeUrls: true, documentUrls: true },
  });
  const resumeUrls = parseJsonArray<string>(profile?.resumeUrls);
  const documentUrls = parseJsonArray<string>(profile?.documentUrls);
  return buildDocumentFiles(resumeUrls, documentUrls);
}

/** GET /api/mobile/teacher/profile/documents — 이력서·서류 목록(서명 URL) */
export async function GET(request: Request) {
  const authResult = await requireMobileTeacherAllowPending(request);
  if ("error" in authResult) return authResult.error;
  return NextResponse.json(await getDocumentPayload(authResult.teacher.id));
}

/** POST /api/mobile/teacher/profile/documents — 서류 업로드. multipart(file, type) */
export async function POST(request: Request) {
  const authResult = await requireMobileTeacherAllowPending(request);
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

  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const storagePath = `${teacher.id}/${type}/${Date.now()}.${ext}`;
  const { data: uploadData, error: uploadError } = await createSupabaseAdminClient()
    .storage.from(TEACHER_DOCUMENT_BUCKET)
    .upload(storagePath, file, { contentType: file.type, upsert: false });
  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }
  const uploadedUrl = uploadData.path;

  const existing = await prisma.teacherProfile.findUnique({
    where: { teacherId: teacher.id },
    select: { resumeUrls: true, documentUrls: true },
  });
  const resumeUrls = parseJsonArray<string>(existing?.resumeUrls);
  const documentUrls = parseJsonArray<string>(existing?.documentUrls);

  if (type === "resume") {
    resumeUrls.push(uploadedUrl);
  } else {
    documentUrls.push(uploadedUrl);
  }

  await prisma.teacherProfile.upsert({
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
  });

  return NextResponse.json(await getDocumentPayload(teacher.id));
}

/** DELETE /api/mobile/teacher/profile/documents — 서류 삭제. JSON(url, type) */
export async function DELETE(request: Request) {
  const authResult = await requireMobileTeacherAllowPending(request);
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

  const existing = await prisma.teacherProfile.findUnique({
    where: { teacherId: teacher.id },
    select: { resumeUrls: true, documentUrls: true },
  });
  const resumeUrls = parseJsonArray<string>(existing?.resumeUrls);
  const documentUrls = parseJsonArray<string>(existing?.documentUrls);
  const nextResumeUrls =
    body.type === "resume" ? resumeUrls.filter((url) => url !== body.url) : resumeUrls;
  const nextDocumentUrls =
    body.type === "document"
      ? documentUrls.filter((url) => url !== body.url)
      : documentUrls;

  await prisma.teacherProfile.upsert({
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
  });

  await createSupabaseAdminClient()
    .storage.from(TEACHER_DOCUMENT_BUCKET)
    .remove([storagePathFromUrl(body.url)]);

  return NextResponse.json(await getDocumentPayload(teacher.id));
}
