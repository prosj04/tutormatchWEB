import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type StudentBody = {
  name?: unknown;
  grade?: unknown;
  subjects?: unknown;
  phone?: unknown;
  email?: unknown;
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

  const { name, grade, subjects, phone, email, password } = body;

  if (
    !isNonEmptyString(name) ||
    !isNonEmptyString(grade) ||
    !isNonEmptyString(phone) ||
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
          role: "STUDENT",
          student: {
            create: {
              name,
              grade,
              subjects: subjectsCsv,
              phone,
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
