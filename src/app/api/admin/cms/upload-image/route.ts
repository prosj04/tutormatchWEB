import { NextResponse } from "next/server";

import { requireChiefManagerOrAdmin } from "@/lib/admin-auth";
import { startPerfTimer, timeSync } from "@/lib/perf-timer";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";

const CMS_IMAGE_BUCKET = "cms-images";

function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120);
}

export async function POST(request: Request) {
  const authResult = await requireChiefManagerOrAdmin();
  if ("error" in authResult) return authResult.error;

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File) || !file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Image file is required" }, { status: 400 });
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
      return NextResponse.json({ error: created.error.message }, { status: 500 });
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
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
    });
  uploadTimer.end();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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
