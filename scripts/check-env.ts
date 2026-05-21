/**
 * 배포 전 필수 환경변수 검사.
 * 로컬: 프로젝트 루트 .env 를 읽은 뒤 process.env 와 병합합니다.
 */
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

const REQUIRED_KEYS = [
  "DATABASE_URL",
  "DIRECT_URL",
  "AUTH_SECRET",
  "NEXTAUTH_URL",
  "ADMIN_SETUP_SECRET",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "CRON_SECRET",
  "ANTHROPIC_API_KEY",
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

function isSet(key: string): boolean {
  const value = process.env[key];
  return typeof value === "string" && value.trim().length > 0;
}

function warn(message: string): void {
  console.warn(`⚠️  ${message}`);
}

loadDotEnvFile(resolve(process.cwd(), ".env"));
loadDotEnvFile(resolve(process.cwd(), ".env.local"));

const missing = REQUIRED_KEYS.filter((key) => !isSet(key));

if (missing.length > 0) {
  console.error("❌ 누락된 환경변수:");
  for (const key of missing) {
    console.error(`   - ${key}`);
  }
  process.exit(1);
}

const databaseUrl = process.env.DATABASE_URL!.trim();
const directUrl = process.env.DIRECT_URL!.trim();

if (!databaseUrl.includes("pgbouncer=true")) {
  warn(
    "DATABASE_URL에 pgbouncer=true 가 없습니다. Supabase 런타임(Prisma)은 pooler(6543) URL을 권장합니다.",
  );
}

const directLooksPooled =
  directUrl.includes("pgbouncer=true") ||
  directUrl.includes("pooler.supabase.com") ||
  directUrl.includes(":6543/");

if (directLooksPooled) {
  warn(
    "DIRECT_URL이 pooler/pgbouncer 형태로 보입니다. prisma migrate deploy 는 Direct(5432, db.*.supabase.co) 연결을 사용해야 합니다.",
  );
}

if (!directUrl.includes(":5432")) {
  warn(
    "DIRECT_URL 포트가 5432가 아닙니다. Direct connection 문자열인지 대시보드 Connect 패널을 다시 확인하세요.",
  );
}

console.log("✅ 환경변수 모두 확인됨");
