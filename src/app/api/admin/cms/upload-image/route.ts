import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { createSupabaseBrowserClient } from "@/lib/supabase-client";

const CMS_IMAGE_BUCKET = "cms-images";

function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120);
}

export async function POST(request: Request) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File) || !file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Image file is required" }, { status: 400 });
  }

  const supabase = createSupabaseBrowserClient();
  const bucket = await supabase.storage.getBucket(CMS_IMAGE_BUCKET);

  if (bucket.error) {
    const created = await supabase.storage.createBucket(CMS_IMAGE_BUCKET, {
      public: true,
    });

    if (created.error) {
      return NextResponse.json({ error: created.error.message }, { status: 500 });
    }
  }

  const filename = sanitizeFilename(file.name || "image");
  const path = `${Date.now()}-${filename}`;

  const { data, error } = await supabase.storage
    .from(CMS_IMAGE_BUCKET)
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: publicData } = supabase.storage
    .from(CMS_IMAGE_BUCKET)
    .getPublicUrl(data.path);

  return NextResponse.json({ imageUrl: publicData.publicUrl });
}
