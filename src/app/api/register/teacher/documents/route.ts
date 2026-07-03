import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { TEACHER_DOCUMENT_BUCKET } from "@/lib/supabase-client";

type DocumentType = "resume" | "document";

function isDocumentType(value: unknown): value is DocumentType {
  return value === "resume" || value === "document";
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
