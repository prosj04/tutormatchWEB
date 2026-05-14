import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type TeacherBody = {
  name?: unknown;
  phone?: unknown;
  subjects?: unknown;
  bio?: unknown;
  education?: unknown;
  experience?: unknown;
  email?: unknown;
  password?: unknown;
};

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

export async function POST(request: Request) {
  let body: TeacherBody;
  try {
    body = (await request.json()) as TeacherBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, phone, subjects, bio, education, experience, email, password } = body;

  if (
    !isNonEmptyString(name) ||
    !isNonEmptyString(phone) ||
    !isNonEmptyString(bio) ||
    !isNonEmptyString(education) ||
    !isNonEmptyString(experience) ||
    !isNonEmptyString(email) ||
    !isNonEmptyString(password)
  ) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!Array.isArray(subjects) || subjects.length === 0) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const subjectStrings = subjects.filter(isNonEmptyString);
  if (subjectStrings.length !== subjects.length) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const subjectsCsv = subjectStrings.join(",");

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
              phone,
              subjects: subjectsCsv,
              bio,
              education,
              experience,
              approved: false,
            },
          },
        },
      });
    });

    return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }
    throw e;
  }
}
