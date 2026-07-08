import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { TEACHER_DOCUMENT_BUCKET } from "@/lib/supabase-client";

type DocumentType = "resume" | "document";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function isDocumentType(value: unknown): value is DocumentType {
  return value === "resume" || value === "document";
}

function detectAllowedFileType(bytes: Uint8Array): string | null {
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 4 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "image/png";
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  if (
    bytes.length >= 4 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46
  ) {
    return "application/pdf";
  }
  return null;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "TEACHER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!teacher) {
    return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
  }
  const teacherId = teacher.id;

  const formData = await request.formData();
  const file = formData.get("file");
  const type = formData.get("type");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File is required" }, { status: 400 });
  }
  if (!isDocumentType(type)) {
    return NextResponse.json({ error: "Invalid document type" }, { status: 400 });
  }
  if (file.type !== "application/pdf" && !file.type.startsWith("image/")) {
    return NextResponse.json({ error: "PDF 또는 이미지 파일만 업로드 가능합니다." }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "파일 크기는 10MB 이하만 업로드 가능합니다." }, { status: 400 });
  }

  const fileBuffer = await file.arrayBuffer();
  const detectedType = detectAllowedFileType(new Uint8Array(fileBuffer));
  if (!detectedType || detectedType !== file.type) {
    return NextResponse.json({ error: "파일 형식이 올바르지 않습니다." }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const path = `${teacherId}/${type}/${Date.now()}.${ext}`;

  const { data, error } = await createSupabaseAdminClient()
    .storage
    .from(TEACHER_DOCUMENT_BUCKET)
    .upload(path, fileBuffer, { contentType: file.type, upsert: false });

  if (error) {
    console.error("[teacher/documents] upload failed:", error.message);
    return NextResponse.json({ error: "업로드에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({ path: data.path });
}
