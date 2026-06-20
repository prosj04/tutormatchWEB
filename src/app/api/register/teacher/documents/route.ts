import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { TEACHER_DOCUMENT_BUCKET } from "@/lib/supabase-client";

type DocumentType = "resume" | "document";

function isDocumentType(value: unknown): value is DocumentType {
  return value === "resume" || value === "document";
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");
  const type = formData.get("type");
  const teacherId = formData.get("teacherId");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File is required" }, { status: 400 });
  }
  if (!isDocumentType(type)) {
    return NextResponse.json({ error: "Invalid document type" }, { status: 400 });
  }
  if (typeof teacherId !== "string" || !teacherId) {
    return NextResponse.json({ error: "teacherId is required" }, { status: 400 });
  }
  if (file.type !== "application/pdf" && !file.type.startsWith("image/")) {
    return NextResponse.json({ error: "PDF 또는 이미지 파일만 업로드 가능합니다." }, { status: 400 });
  }

  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    select: { id: true },
  });
  if (!teacher) {
    return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const path = `${teacherId}/${type}/${Date.now()}.${ext}`;

  const { data, error } = await createSupabaseAdminClient()
    .storage
    .from(TEACHER_DOCUMENT_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ path: data.path });
}
