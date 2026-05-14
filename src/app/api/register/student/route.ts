import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  normalizePhoneDigits,
  studentSyntheticEmailFromDigits,
} from "@/lib/phone-login";

type StudentBody = {
  name?: unknown;
  grade?: unknown;
  subjects?: unknown;
  phone?: unknown;
  password?: unknown;
};

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

export async function POST(request: Request) {
  let body: StudentBody;
  try {
    body = (await request.json()) as StudentBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, grade, subjects, phone, password } = body;

  if (
    !isNonEmptyString(name) ||
    !isNonEmptyString(grade) ||
    !isNonEmptyString(phone) ||
    !isNonEmptyString(password)
  ) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const phoneDigits = normalizePhoneDigits(phone);
  if (phoneDigits.length < 10 || phoneDigits.length > 11) {
    return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
  }

  if (!Array.isArray(subjects) || subjects.length === 0) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const subjectStrings = subjects.filter(isNonEmptyString);
  if (subjectStrings.length !== subjects.length) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const subjectsCsv = subjectStrings.join(",");
  const email = studentSyntheticEmailFromDigits(phoneDigits);

  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { email },
        { student: { phone: phoneDigits } },
        { student: { phone: phone.trim() } },
      ],
    },
  });
  if (existing) {
    return NextResponse.json({ error: "Phone already registered" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const user = await prisma.$transaction(async (tx) => {
      return tx.user.create({
        data: {
          email,
          password: passwordHash,
          role: "STUDENT",
          student: {
            create: {
              name,
              grade,
              subjects: subjectsCsv,
              phone: phoneDigits,
            },
          },
        },
      });
    });

    return NextResponse.json({ id: user.id }, { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "Phone already registered" }, { status: 409 });
    }
    throw e;
  }
}
