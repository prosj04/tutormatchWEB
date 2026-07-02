import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireTeacherStudentMatch } from "@/lib/teacher-student-match";
import { requireTeacher } from "@/lib/teacher-auth";

type RequestBody = {
  name?: unknown;
  days?: unknown;
  tasks?: unknown;
  studentId?: unknown;
};

function parseTasks(raw: unknown) {
  if (Array.isArray(raw)) {
    return raw
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean);
  }
  if (typeof raw !== "string") return [];
  return raw
    .split("\n")
    .map((line) => line.replace(/^[-*•\d.)\s]+/, "").trim())
    .filter(Boolean);
}

export async function GET(request: Request) {
  const authResult = await requireTeacher();
  if ("error" in authResult) return authResult.error;
  const { teacher } = authResult;

  const studentId = new URL(request.url).searchParams.get("studentId") || undefined;

  if (studentId) {
    const matchResult = await requireTeacherStudentMatch(teacher.id, studentId);
    if ("error" in matchResult) return matchResult.error;
  }

  const templates = await prisma.homeworkTemplate.findMany({
    where: {
      teacherId: teacher.id,
      OR: studentId ? [{ studentId: null }, { studentId }] : [{ studentId: null }],
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ templates });
}

export async function POST(request: Request) {
  const authResult = await requireTeacher();
  if ("error" in authResult) return authResult.error;
  const { teacher } = authResult;

  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name || name.length > 80) {
    return NextResponse.json({ error: "name must be 1-80 characters" }, { status: 400 });
  }

  const days = body.days === 4 ? 4 : body.days === 7 ? 7 : null;
  if (!days) {
    return NextResponse.json({ error: "days must be 4 or 7" }, { status: 400 });
  }

  const tasks = parseTasks(body.tasks);
  if (tasks.length === 0 || tasks.length > 100) {
    return NextResponse.json({ error: "tasks must contain 1-100 items" }, { status: 400 });
  }

  const studentId = typeof body.studentId === "string" && body.studentId ? body.studentId : null;
  if (studentId) {
    const matchResult = await requireTeacherStudentMatch(teacher.id, studentId);
    if ("error" in matchResult) return matchResult.error;
  }

  const template = await prisma.homeworkTemplate.create({
    data: {
      teacherId: teacher.id,
      studentId,
      name,
      days,
      tasks: tasks.join("\n"),
    },
  });

  return NextResponse.json({ template }, { status: 201 });
}
