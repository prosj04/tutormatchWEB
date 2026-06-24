/**
 * 서울(신) DB 샘플 데이터 — 관리자·매니저·선생님·학생
 * 실행: npm run seed:sample
 *
 * 표시: 이름 앞 [sample]
 * 비밀번호: 학생·선생님 11111111 / 관리자·매니저 Sample1234! (별도)
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

import {
  normalizePhoneDigits,
  studentSyntheticEmailFromDigits,
  teacherSyntheticEmailFromDigits,
} from "../src/lib/phone-login";

const prisma = new PrismaClient();

const SAMPLE_PREFIX = "[sample]";
const PORTAL_PASSWORD = "11111111";
const STAFF_PASSWORD = "Sample1234!";

function sampleName(base: string): string {
  const trimmed = base.trim();
  if (trimmed.startsWith(SAMPLE_PREFIX)) return trimmed;
  return `${SAMPLE_PREFIX} ${trimmed}`;
}

const ADMIN = {
  email: "admin@admin",
  password: STAFF_PASSWORD,
};

const MANAGER = {
  name: sampleName("Chief_manager"),
  phone: "01090001000",
  subjects: "상담,매칭",
  bio: `${SAMPLE_PREFIX} 대표 학습 매니저`,
  education: "서울대학교 교육학과",
  experience: "10년",
  gender: "MALE" as const,
};

const TEACHERS = [
  {
    name: sampleName("김도현"),
    phone: "01090002001",
    subjects: ["수학"],
    gender: "MALE" as const,
    approved: true,
    bio: "수학 내신·수능 전문",
    education: "서울대학교 수리과학부",
    experience: "7년",
  },
  {
    name: sampleName("김서연"),
    phone: "01090002002",
    subjects: ["영어"],
    gender: "FEMALE" as const,
    approved: true,
    bio: "수학 내신·수능 전문",
    education: "성균관대학교 기계공학과",
    experience: "5년",
  },
  {
    name: sampleName("박준호"),
    phone: "01090002003",
    subjects: ["물리", "수학"],
    gender: "MALE" as const,
    approved: true,
    bio: "물리·수학 통합 지도",
    education: "KAIST 물리학과",
    experience: "6년",
  },
  {
    name: sampleName("최지우"),
    phone: "01090002004",
    subjects: ["국어"],
    gender: "FEMALE" as const,
    approved: false,
    bio: "국어 논술·내신 (승인 대기 샘플)",
    education: "고려대학교 국어국문학과",
    experience: "4년",
  },
  {
    name: sampleName("이지현"),
    phone: "01090002005",
    subjects: ["영어"],
    gender: "FEMALE" as const,
    approved: true,
    bio: "영어 회화·내신",
    education: "연세대학교 영어영문학과",
    experience: "5년",
  },
];

const STUDENTS = [
  {
    name: sampleName("홍서준"),
    phone: "01090003001",
    grade: "고2",
    subjects: ["수학", "영어"],
    gender: "MALE" as const,
  },
  {
    name: sampleName("김하은"),
    phone: "01090003002",
    grade: "고1",
    subjects: ["국어", "수학"],
    gender: "FEMALE" as const,
  },
  {
    name: sampleName("이민재"),
    phone: "01090003003",
    grade: "중3",
    subjects: ["영어"],
    gender: "MALE" as const,
  },
  {
    name: sampleName("박유나"),
    phone: "01090003004",
    grade: "고3",
    subjects: ["물리", "수학"],
    gender: "FEMALE" as const,
  },
];

const ALL_SAMPLE_PHONES = [
  MANAGER.phone,
  ...TEACHERS.map((t) => t.phone),
  ...STUDENTS.map((s) => s.phone),
];

async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

/** 0109000* 샘플 계정만 삭제 후 재생성 */
async function clearSampleAccounts() {
  const phones = ALL_SAMPLE_PHONES.map((p) => normalizePhoneDigits(p));
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { email: ADMIN.email },
        { student: { phone: { in: phones } } },
        { teacher: { phone: { in: phones } } },
      ],
    },
    select: { id: true, email: true },
  });
  if (users.length === 0) return;
  await prisma.user.deleteMany({
    where: { id: { in: users.map((u) => u.id) } },
  });
  console.log(`  🗑️  기존 샘플 계정 ${users.length}건 삭제`);
}

async function createTeacher(
  row: (typeof TEACHERS)[number],
  passwordHash: string,
) {
  const digits = normalizePhoneDigits(row.phone);
  const email = teacherSyntheticEmailFromDigits(digits);

  const user = await prisma.user.create({
    data: {
      email,
      password: passwordHash,
      role: "TEACHER",
      teacher: {
        create: {
          name: row.name,
          phone: digits,
          subjects: row.subjects.join(","),
          bio: row.bio,
          education: row.education,
          experience: row.experience,
          gender: row.gender,
          approved: row.approved,
          profile: {
            create: {
              intro: row.bio,
              education: JSON.stringify([{ school: row.education, major: "", year: "" }]),
              career: JSON.stringify([{ org: row.experience, role: "과외", period: "" }]),
              certificates: JSON.stringify([]),
              resumeUrls: JSON.stringify([]),
              documentUrls: JSON.stringify([]),
            },
          },
        },
      },
    },
    include: { teacher: true },
  });
  console.log(`  선생님 ${row.name} (${digits}) — ${row.approved ? "승인" : "미승인"}`);
  return user.teacher!.id;
}

async function createStudent(
  row: (typeof STUDENTS)[number],
  passwordHash: string,
  managerTeacherId: string | null,
) {
  const digits = normalizePhoneDigits(row.phone);
  const email = studentSyntheticEmailFromDigits(digits);

  const user = await prisma.user.create({
    data: {
      email,
      password: passwordHash,
      role: "STUDENT",
      student: {
        create: {
          name: row.name,
          grade: row.grade,
          subjects: row.subjects.join(","),
          phone: digits,
          gender: row.gender,
        },
      },
    },
    include: { student: true },
  });
  const studentId = user.student!.id;

  if (managerTeacherId) {
    const now = new Date();
    await prisma.consultationBooking.create({
      data: {
        studentId,
        managerId: managerTeacherId,
        preferredTimes: "[]",
        visitPreferredTimes: "{}",
        status: "ASSIGNED",
        note: `${SAMPLE_PREFIX} 샘플 데이터`,
        assignedAt: now,
      },
    });
    await prisma.managerStudent.create({
      data: { managerId: managerTeacherId, studentId },
    });
  }

  console.log(`  학생 ${row.name} (${digits})${managerTeacherId ? " — 매니저 배정" : ""}`);
  return studentId;
}

async function main() {
  console.log("==> 샘플 계정 초기화");
  await clearSampleAccounts();

  const portalHash = await hashPassword(PORTAL_PASSWORD);
  const staffHash = await hashPassword(STAFF_PASSWORD);

  console.log("\n==> 매니저·관리자");
  const managerDigits = normalizePhoneDigits(MANAGER.phone);
  const managerEmail = teacherSyntheticEmailFromDigits(managerDigits);

  const managerUser = await prisma.user.create({
    data: {
      email: managerEmail,
      password: staffHash,
      role: "MANAGER",
      teacher: {
        create: {
          name: MANAGER.name,
          phone: managerDigits,
          subjects: MANAGER.subjects,
          bio: MANAGER.bio,
          education: MANAGER.education,
          experience: MANAGER.experience,
          gender: MANAGER.gender,
          approved: true,
          profile: {
            create: {
              intro: MANAGER.bio,
              education: JSON.stringify([{ school: MANAGER.education, major: "", year: "" }]),
              career: JSON.stringify([]),
              certificates: JSON.stringify([]),
              resumeUrls: JSON.stringify([]),
              documentUrls: JSON.stringify([]),
            },
          },
        },
      },
    },
    include: { teacher: true },
  });
  const managerTeacherId = managerUser.teacher!.id;
  console.log(`  ✅ 매니저 ${MANAGER.name} (${managerDigits})`);

  await prisma.user.create({
    data: {
      email: ADMIN.email,
      password: staffHash,
      role: "ADMIN",
    },
  });
  console.log(`  ✅ 관리자 ${ADMIN.email}`);

  console.log("\n==> 선생님 샘플");
  for (const t of TEACHERS) {
    await createTeacher(t, portalHash);
  }

  console.log("\n==> 학생 샘플");
  for (const s of STUDENTS) {
    await createStudent(s, portalHash, managerTeacherId);
  }

  const teachers = await prisma.teacher.count({
    where: { name: { startsWith: SAMPLE_PREFIX } },
  });
  const students = await prisma.student.count({
    where: { name: { startsWith: SAMPLE_PREFIX } },
  });

  console.log("\n==> 완료");
  console.log(`  [sample] 선생님 ${teachers}명 · 학생 ${students}명`);
  console.log("\n  로그인 비밀번호:");
  console.log(`  학생·선생님: ${PORTAL_PASSWORD}`);
  console.log(`  관리자·매니저: ${STAFF_PASSWORD}`);
  console.log(`  관리자: ${ADMIN.email}`);
  console.log(`  매니저: ${managerDigits}`);
  console.log("  학생: 01090003001 ~ 01090003004");
  console.log("  선생님: 01090002001 ~ 01090002004");
}

main()
  .catch((e) => {
    console.error("❌ 시드 실패:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
