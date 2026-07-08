import { NextResponse } from "next/server";

import { requireChiefManagerOrAdmin } from "@/lib/admin-auth";
import { startPerfTimer, timeSync } from "@/lib/perf-timer";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

const CMS_IMAGE_BUCKET = "cms-images";
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120);
}

function detectAllowedImageType(bytes: Uint8Array): string | null {
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
  return null;
}

export async function POST(request: Request) {
  const authResult = await requireChiefManagerOrAdmin();
  if ("error" in authResult) return authResult.error;

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File) || !file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Image file is required" }, { status: 400 });
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return NextResponse.json({ error: "이미지 크기는 5MB 이하만 업로드 가능합니다." }, { status: 400 });
  }

  const fileBuffer = await file.arrayBuffer();
  const detectedType = detectAllowedImageType(new Uint8Array(fileBuffer));
  if (!detectedType || detectedType !== file.type) {
    return NextResponse.json({ error: "이미지 파일 형식이 올바르지 않습니다." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const bucketTimer = startPerfTimer("supabase.cmsImages.getBucket", {
    bucket: CMS_IMAGE_BUCKET,
  });
  const bucket = await supabase.storage.getBucket(CMS_IMAGE_BUCKET);
  bucketTimer.end();

  if (bucket.error) {
    const createBucketTimer = startPerfTimer("supabase.cmsImages.createBucket", {
      bucket: CMS_IMAGE_BUCKET,
    });
    const created = await supabase.storage.createBucket(CMS_IMAGE_BUCKET, {
      public: true,
    });
    createBucketTimer.end();

    if (created.error) {
      console.error("CMS image bucket creation failed", created.error);
      return NextResponse.json({ error: "업로드에 실패했습니다" }, { status: 500 });
    }
  }

  const filename = sanitizeFilename(file.name || "image");
  const path = `${Date.now()}-${filename}`;

  const uploadTimer = startPerfTimer("supabase.cmsImages.upload", {
    bucket: CMS_IMAGE_BUCKET,
    path,
    fileName: file.name,
  });
  const { data, error } = await supabase.storage
    .from(CMS_IMAGE_BUCKET)
    .upload(path, fileBuffer, {
      contentType: file.type,
      upsert: false,
    });
  uploadTimer.end();

  if (error) {
    console.error("CMS image upload failed", error);
    return NextResponse.json({ error: "업로드에 실패했습니다" }, { status: 500 });
  }

  const publicData = timeSync(
    "supabase.cmsImages.getPublicUrl",
    () =>
      supabase.storage
        .from(CMS_IMAGE_BUCKET)
        .getPublicUrl(data.path).data,
    { path: data.path },
  );

  return NextResponse.json({ imageUrl: publicData.publicUrl });
}
