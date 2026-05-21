/**
 * 서울(신) DB 샘플 데이터 — 관리자·매니저·선생님·학생
 * 실행: npm run seed:sample
 * 로그인 비밀번호(공통): Sample1234!
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

import {
  normalizePhoneDigits,
  studentSyntheticEmailFromDigits,
  teacherSyntheticEmailFromDigits,
} from "../src/lib/phone-login";

const prisma = new PrismaClient();

const SAMPLE_PASSWORD = "Sample1234!";

const ADMIN = {
  email: "admin@concord.local",
  password: SAMPLE_PASSWORD,
  name: "관리자",
};

const MANAGER = {
  name: "Chief_manager",
  phone: "01090001000",
  subjects: "상담,매칭",
  bio: "대표 학습 매니저",
  education: "서울대학교 교육학과",
  experience: "10년",
  gender: "MALE" as const,
};

const TEACHERS = [
  {
    name: "김도현",
    phone: "01090002001",
    subjects: ["수학"],
    gender: "MALE" as const,
    approved: true,
    bio: "수학 내신·수능 전문",
    education: "서울대학교 수리과학부",
    experience: "7년",
  },
  {
    name: "이서연",
    phone: "01090002002",
    subjects: ["영어"],
    gender: "FEMALE" as const,
    approved: true,
    bio: "영어 회화·내신",
    education: "연세대학교 영어영문학과",
    experience: "5년",
  },
  {
    name: "박준호",
    phone: "01090002003",
    subjects: ["물리", "수학"],
    gender: "MALE" as const,
    approved: true,
    bio: "물리·수학 통합 지도",
    education: "KAIST 물리학과",
    experience: "6년",
  },
  {
    name: "최지우",
    phone: "01090002004",
    subjects: ["국어"],
    gender: "FEMALE" as const,
    approved: false,
    bio: "국어 논술·내신 (승인 대기 샘플)",
    education: "고려대학교 국어국문학과",
    experience: "4년",
  },
];

const STUDENTS = [
  {
    name: "홍서준",
    phone: "01090003001",
    grade: "고2",
    subjects: ["수학", "영어"],
    gender: "MALE" as const,
  },
  {
    name: "김하은",
    phone: "01090003002",
    grade: "고1",
    subjects: ["국어", "수학"],
    gender: "FEMALE" as const,
  },
  {
    name: "이민재",
    phone: "01090003003",
    grade: "중3",
    subjects: ["영어"],
    gender: "MALE" as const,
  },
  {
    name: "박유나",
    phone: "01090003004",
    grade: "고3",
    subjects: ["물리", "수학"],
    gender: "FEMALE" as const,
  },
];

async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

async function createTeacher(
  row: (typeof TEACHERS)[number],
  passwordHash: string,
) {
  const digits = normalizePhoneDigits(row.phone);
  const email = teacherSyntheticEmailFromDigits(digits);
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { teacher: { phone: digits } }] },
  });
  if (existing) {
    console.log(`  ⏭️  선생님 ${row.name} (${digits}) — 이미 있음`);
    return existing.teacher?.id ?? null;
  }

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
  console.log(`  ✅ 선생님 ${row.name} (${digits}) — ${row.approved ? "승인" : "미승인"}`);
  return user.teacher!.id;
}

async function createStudent(
  row: (typeof STUDENTS)[number],
  passwordHash: string,
) {
  const digits = normalizePhoneDigits(row.phone);
  const email = studentSyntheticEmailFromDigits(digits);
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { student: { phone: digits } }] },
  });
  if (existing?.student) {
    console.log(`  ⏭️  학생 ${row.name} (${digits}) — 이미 있음`);
    return existing.student.id;
  }

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

  const manager = await prisma.teacher.findFirst({
    where: { name: MANAGER.name, user: { role: "MANAGER" } },
    select: { id: true },
  });
  if (manager) {
    const now = new Date();
    await prisma.consultationBooking.upsert({
      where: { studentId },
      create: {
        studentId,
        managerId: manager.id,
        preferredTimes: "[]",
        visitPreferredTimes: "{}",
        status: "ASSIGNED",
        note: "샘플 데이터",
        assignedAt: now,
      },
      update: {
        managerId: manager.id,
        status: "ASSIGNED",
        assignedAt: now,
        note: "샘플 데이터",
      },
    });
    await prisma.managerStudent.upsert({
      where: {
        managerId_studentId: { managerId: manager.id, studentId },
      },
      create: { managerId: manager.id, studentId },
      update: {},
    });
  }

  console.log(`  ✅ 학생 ${row.name} (${digits})${manager ? " — 매니저 배정" : ""}`);
  return studentId;
}

async function main() {
  const [teacherCount, studentCount] = await Promise.all([
    prisma.teacher.count(),
    prisma.student.count(),
  ]);

  console.log("==> DB 현황");
  console.log(`  선생님: ${teacherCount}명, 학생: ${studentCount}명`);

  if (teacherCount > 0) {
    console.log("\n  선생님 데이터가 이미 있습니다. 그대로 두었습니다 (삭제하지 않음).");
  } else {
    console.log("\n==> 선생님 샘플 생성");
    const passwordHash = await hashPassword(SAMPLE_PASSWORD);
    for (const t of TEACHERS) {
      await createTeacher(t, passwordHash);
    }
  }

  const passwordHash = await hashPassword(SAMPLE_PASSWORD);

  console.log("\n==> 매니저·관리자");
  const managerDigits = normalizePhoneDigits(MANAGER.phone);
  const managerEmail = teacherSyntheticEmailFromDigits(managerDigits);
  let managerUser = await prisma.user.findFirst({
    where: { OR: [{ email: managerEmail }, { teacher: { phone: managerDigits } }] },
    include: { teacher: true },
  });
  if (!managerUser) {
    managerUser = await prisma.user.create({
      data: {
        email: managerEmail,
        password: passwordHash,
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
    console.log(`  ✅ 매니저 ${MANAGER.name} (${managerDigits})`);
  } else if (managerUser.role !== "MANAGER") {
    await prisma.user.update({
      where: { id: managerUser.id },
      data: { role: "MANAGER" },
    });
    console.log(`  ✅ ${MANAGER.name} — MANAGER 역할로 갱신`);
  } else {
    console.log(`  ⏭️  매니저 ${MANAGER.name} — 이미 있음`);
  }

  let admin = await prisma.user.findUnique({ where: { email: ADMIN.email } });
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        email: ADMIN.email,
        password: passwordHash,
        role: "ADMIN",
      },
    });
    console.log(`  ✅ 관리자 ${ADMIN.email}`);
  } else {
    console.log(`  ⏭️  관리자 ${ADMIN.email} — 이미 있음`);
  }

  console.log("\n==> 학생 샘플 생성");
  for (const s of STUDENTS) {
    await createStudent(s, passwordHash);
  }

  const approvedTeacher = await prisma.teacher.count({ where: { approved: true } });
  const activeStudents = await prisma.student.count();

  console.log("\n==> 완료");
  console.log(`  승인 선생님 ${approvedTeacher}명 · 학생 ${activeStudents}명`);
  console.log("\n  로그인 (전화번호 또는 이메일 + 비밀번호):");
  console.log(`  비밀번호: ${SAMPLE_PASSWORD}`);
  console.log(`  관리자: ${ADMIN.email}`);
  console.log(`  매니저: ${managerDigits} (전화) / ${managerEmail}`);
  console.log("  학생: 01090003001 ~ 01090003004");
  console.log("  선생님: 01090002001 ~ 01090002004");
}

main()
  .catch((e) => {
    console.error("❌ 시드 실패:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
