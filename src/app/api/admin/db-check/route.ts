import { NextResponse } from "next/server";

import { requireChiefManagerOrAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const LEGACY_REF = "orvqtnrdxlfyyoscejqf";
const SEOUL_REF = "phesslrefylwlvdsoljm";

function refFromPostgresUrl(url: string): string | null {
  const match = url.match(/postgres\.([a-z0-9]+):/i);
  return match?.[1] ?? null;
}

function refFromSupabaseUrl(url: string): string | null {
  const match = url.match(/https:\/\/([a-z0-9]+)\.supabase\.co/i);
  return match?.[1] ?? null;
}

export async function GET() {
  const authResult = await requireChiefManagerOrAdmin();
  if ("error" in authResult) return authResult.error;

  const databaseUrl = process.env.DATABASE_URL ?? "";
  const directUrl = process.env.DIRECT_URL ?? "";
  const supabasePublicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

  const databaseRef = refFromPostgresUrl(databaseUrl);
  const directRef = refFromPostgresUrl(directUrl);
  const supabaseRef = refFromSupabaseUrl(supabasePublicUrl);

  let dbReachable = false;
  let studentCount = 0;
  let sampleStudentCount = 0;
  let latestStudentName: string | null = null;
  let dbError: string | null = null;

  try {
    studentCount = await prisma.student.count();
    sampleStudentCount = await prisma.student.count({
      where: { name: { startsWith: "[sample]" } },
    });
    const latest = await prisma.student.findFirst({
      orderBy: { user: { createdAt: "desc" } },
      select: { name: true },
    });
    latestStudentName = latest?.name ?? null;
    dbReachable = true;
  } catch (error) {
    dbError = error instanceof Error ? error.message : String(error);
  }

  const isSeoul = databaseRef === SEOUL_REF;
  const isLegacy = databaseRef === LEGACY_REF;

  let interpretation: string;
  if (!dbReachable) {
    interpretation =
      "DB 연결 실패. Vercel DATABASE_URL 비밀번호·ref·%21 인코딩을 확인하세요.";
  } else if (isLegacy) {
    interpretation = "연결 문자열이 구(인도네시아) 프로젝트를 가리킵니다.";
  } else if (isSeoul && sampleStudentCount > 0) {
    interpretation = "서울(신) DB에 연결됨. 샘플 시드 데이터가 있습니다.";
  } else if (isSeoul && studentCount > 0) {
    interpretation =
      "서울(신) DB에 연결됨. [sample] 없음 — 구 DB 데이터 이전본이거나 실사용자만 있는 상태입니다.";
  } else if (isSeoul) {
    interpretation = "서울(신) DB에 연결됨. 학생 데이터 없음.";
  } else {
    interpretation = "DB 연결됨. 프로젝트 ref를 수동으로 확인하세요.";
  }

  return NextResponse.json({
    deployment: {
      vercel: process.env.VERCEL === "1",
      vercelEnv: process.env.VERCEL_ENV ?? null,
    },
    configuredRefs: {
      databaseUrl: databaseRef,
      directUrl: directRef,
      supabasePublic: supabaseRef,
      allMatch: databaseRef === directRef && databaseRef === supabaseRef,
      isSeoulProject: isSeoul,
      isLegacyIndonesiaProject: isLegacy,
    },
    dataSnapshot: dbReachable
      ? { studentCount, sampleStudentCount, latestStudentName }
      : null,
    dbError,
    interpretation,
    refs: { legacy: LEGACY_REF, seoul: SEOUL_REF },
  });
}
