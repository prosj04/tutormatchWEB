import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import {
  createSupabaseBrowserClient,
  TEACHER_DOCUMENT_BUCKET,
} from "@/lib/supabase-client";
import { parseJsonArray } from "@/lib/teacher-profile-types";

type RouteContext = { params: Promise<{ id: string }> };
type DocumentType = "resume" | "document";

function isDocumentType(value: unknown): value is DocumentType {
  return value === "resume" || value === "document";
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
  const supabase = createSupabaseBrowserClient();

  async function sign(url: string) {
    const path = storagePathFromUrl(url);
    const { data, error } = await supabase.storage
      .from(TEACHER_DOCUMENT_BUCKET)
      .createSignedUrl(path, 60 * 10);

    if (error) throw error;

    return {
      url,
      signedUrl: data.signedUrl,
      name: filenameFromPath(path),
    };
  }

  return {
    resumeFiles: await Promise.all(resumeUrls.map(sign)),
    documentFiles: await Promise.all(documentUrls.map(sign)),
  };
}

async function getDocumentPayload(teacherId: string) {
  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    select: {
      profile: { select: { resumeUrls: true, documentUrls: true } },
    },
  });

  if (!teacher) return null;

  const resumeUrls = parseJsonArray<string>(teacher.profile?.resumeUrls);
  const documentUrls = parseJsonArray<string>(teacher.profile?.documentUrls);

  return buildDocumentFiles(resumeUrls, documentUrls);
}

export async function GET(_request: Request, context: RouteContext) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;

  const { id } = await context.params;
  const payload = await getDocumentPayload(id);
  if (!payload) {
    return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
  }

  return NextResponse.json(payload);
}

export async function DELETE(request: Request, context: RouteContext) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;

  const { id } = await context.params;

  let body: { url?: unknown; type?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body.url !== "string" || !isDocumentType(body.type)) {
    return NextResponse.json({ error: "Invalid fields" }, { status: 400 });
  }

  const teacher = await prisma.teacher.findUnique({
    where: { id },
    select: {
      profile: { select: { resumeUrls: true, documentUrls: true } },
    },
  });

  if (!teacher) {
    return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
  }

  const resumeUrls = parseJsonArray<string>(teacher.profile?.resumeUrls);
  const documentUrls = parseJsonArray<string>(teacher.profile?.documentUrls);
  const nextResumeUrls =
    body.type === "resume" ? resumeUrls.filter((url) => url !== body.url) : resumeUrls;
  const nextDocumentUrls =
    body.type === "document"
      ? documentUrls.filter((url) => url !== body.url)
      : documentUrls;

  await prisma.teacherProfile.upsert({
    where: { teacherId: id },
    create: {
      teacherId: id,
      resumeUrls: JSON.stringify(nextResumeUrls),
      documentUrls: JSON.stringify(nextDocumentUrls),
    },
    update: {
      resumeUrls: JSON.stringify(nextResumeUrls),
      documentUrls: JSON.stringify(nextDocumentUrls),
    },
  });

  await createSupabaseBrowserClient()
    .storage
    .from(TEACHER_DOCUMENT_BUCKET)
    .remove([storagePathFromUrl(body.url)]);

  return NextResponse.json(await getDocumentPayload(id));
}
