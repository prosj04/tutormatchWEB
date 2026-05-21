/**
 * 새 Supabase 프로젝트 Storage 버킷 생성.
 *
 * 필요 env:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY  (Dashboard → Settings → API → service_role)
 *
 * 실행: npm run setup-storage
 */
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

const FILE_SIZE_LIMIT_BYTES = 50 * 1024 * 1024; // 50MB

const BUCKETS = [
  { name: "teacher-documents", public: false },
  { name: "question-images", public: false },
  { name: "teacher-photos", public: true },
] as const;

function loadDotEnvFile(filePath: string): void {
  if (!existsSync(filePath)) return;

  const content = readFileSync(filePath, "utf8");
  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const eq = line.indexOf("=");
    if (eq <= 0) continue;

    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function requireEnv(key: string): string {
  const value = process.env[key]?.trim();
  if (!value) {
    console.error(`❌ ${key} 가 설정되지 않았습니다.`);
    console.error("   Supabase Dashboard → Settings → API → service_role (비밀 키)");
    process.exit(1);
  }
  return value;
}

loadDotEnvFile(resolve(process.cwd(), ".env"));
loadDotEnvFile(resolve(process.cwd(), ".env.local"));

const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function isAlreadyExistsError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("already exists") ||
    lower.includes("duplicate") ||
    lower.includes("already been created")
  );
}

async function main(): Promise<void> {
  console.log("==> Supabase Storage 버킷 설정\n");

  const { data: existing, error: listError } = await supabase.storage.listBuckets();
  if (listError) {
    console.error(`❌ 버킷 목록 조회 실패: ${listError.message}`);
    process.exit(1);
  }

  const existingNames = new Set((existing ?? []).map((b) => b.name));

  for (const bucket of BUCKETS) {
    if (existingNames.has(bucket.name)) {
      console.log(`⏭️  ${bucket.name}: 스킵 (이미 존재)`);
      continue;
    }

    const { error } = await supabase.storage.createBucket(bucket.name, {
      public: bucket.public,
      fileSizeLimit: FILE_SIZE_LIMIT_BYTES,
    });

    if (error) {
      if (isAlreadyExistsError(error.message)) {
        console.log(`⏭️  ${bucket.name}: 스킵 (이미 존재)`);
        continue;
      }
      console.error(`❌ ${bucket.name}: 생성 실패 — ${error.message}`);
      process.exit(1);
    }

    const visibility = bucket.public ? "public" : "private";
    console.log(`✅ ${bucket.name}: 생성 완료 (${visibility}, 50MB)`);
  }

  console.log("\n==> 완료");
}

main().catch((err) => {
  console.error("❌ 예기치 않은 오류:", err);
  process.exit(1);
});
