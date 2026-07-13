import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  normalizePhoneDigits,
  teacherSyntheticEmailFromDigits,
} from "@/lib/phone-login";
import { parseProfileGender } from "@/lib/profile-gender";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";

type TeacherBody = {
  name?: unknown;
  phone?: unknown;
  subjects?: unknown;
  bio?: unknown;
  education?: unknown;
  experience?: unknown;
  password?: unknown;
  gender?: unknown;
  careerEntries?: unknown;
};

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

export async function POST(request: Request) {
  if (!checkRateLimit("register", clientIp(request), { windowMs: 10 * 60_000, max: 5 })) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: TeacherBody;
  try {
    body = (await request.json()) as TeacherBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, phone, subjects, bio, education, experience, password } = body;

  if (
    !isNonEmptyString(name) ||
    !isNonEmptyString(phone)
  ) {
    return NextResponse.json({ error: "필수 항목을 모두 입력해 주세요." }, { status: 400 });
  }
  if (!isNonEmptyString(password) || password.length < 8) {
    return NextResponse.json({ error: "비밀번호는 8자 이상이어야 합니다." }, { status: 400 });
  }

  const phoneDigits = normalizePhoneDigits(phone);
  if (phoneDigits.length < 10 || phoneDigits.length > 11) {
    return NextResponse.json({ error: "올바른 휴대전화 번호를 입력해 주세요." }, { status: 400 });
  }

  if (!Array.isArray(subjects) || subjects.length === 0) {
    return NextResponse.json({ error: "지도 과목을 한 개 이상 선택해 주세요." }, { status: 400 });
  }

  const subjectStrings = subjects.filter(isNonEmptyString);
  if (subjectStrings.length !== subjects.length) {
    return NextResponse.json({ error: "지도 과목을 한 개 이상 선택해 주세요." }, { status: 400 });
  }

  const subjectsCsv = subjectStrings.join(",");
  const bioValue = isNonEmptyString(bio) ? bio.trim() : "";
  const educationValue = isNonEmptyString(education) ? education.trim() : "";
  const experienceValue = isNonEmptyString(experience) ? experience.trim() : "";
  const email = teacherSyntheticEmailFromDigits(phoneDigits);
  const gender = parseProfileGender(body.gender);
  if (!gender) {
    return NextResponse.json({ error: "성별을 선택해 주세요." }, { status: 400 });
  }

  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { email },
        { teacher: { phone: phoneDigits } },
        { teacher: { phone: phone.trim() } },
      ],
    },
  });
  if (existing) {
    return NextResponse.json({ error: "이미 가입된 전화번호입니다." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const user = await prisma.$transaction(async (tx) => {
      return tx.user.create({
        data: {
          email,
          password: passwordHash,
          role: "TEACHER",
          teacher: {
            create: {
              name,
              phone: phoneDigits,
              subjects: subjectsCsv,
              bio: bioValue,
              education: educationValue,
              experience: experienceValue,
              gender,
              approved: false,
              profile: {
                create: {
                  intro: bioValue,
                  education: JSON.stringify([
                    {
                      school: educationValue,
                      major: "",
                      year: "",
                    },
                  ]),
                  career: JSON.stringify(
                    Array.isArray(body.careerEntries)
                      ? body.careerEntries
                      : [
                          {
                            org: experienceValue,
                            role: "",
                            period: "",
                          },
                        ],
                  ),
                  certificates: JSON.stringify([]),
                  resumeUrls: JSON.stringify([]),
                  documentUrls: JSON.stringify([]),
                },
              },
            },
          },
        },
        include: { teacher: { select: { id: true } } },
      });
    });

    return NextResponse.json(
      { id: user.id, email: user.email, teacherId: user.teacher?.id },
      { status: 201 },
    );
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "이미 가입된 전화번호입니다." }, { status: 409 });
    }
    throw e;
  }
}

export async function PATCH(request: Request) {
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

  let body: {
    resumeUrls?: unknown;
    documentUrls?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const resumeUrls = Array.isArray(body.resumeUrls)
    ? body.resumeUrls.filter(isNonEmptyString)
    : [];
  const documentUrls = Array.isArray(body.documentUrls)
    ? body.documentUrls.filter(isNonEmptyString)
    : [];

  await prisma.teacherProfile.upsert({
    where: { teacherId: teacher.id },
    create: {
      teacherId: teacher.id,
      resumeUrls: JSON.stringify(resumeUrls),
      documentUrls: JSON.stringify(documentUrls),
    },
    update: {
      resumeUrls: JSON.stringify(resumeUrls),
      documentUrls: JSON.stringify(documentUrls),
    },
  });

  return NextResponse.json({ ok: true });
}
