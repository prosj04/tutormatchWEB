import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/teacher-auth";

type RequestBody = {
  title?: unknown;
  name?: unknown;
  subject?: unknown;
  defaultDays?: unknown;
  days?: unknown;
  tasks?: unknown;
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

export async function GET() {
  const authResult = await requireTeacher();
  if ("error" in authResult) return authResult.error;
  const { teacher } = authResult;

  const templates = await prisma.homeworkTemplate.findMany({
    where: {
      teacherId: teacher.id,
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

  const rawTitle = body.title ?? body.name;
  const title = typeof rawTitle === "string" ? rawTitle.trim() : "";
  if (!title || title.length > 80) {
    return NextResponse.json({ error: "title must be 1-80 characters" }, { status: 400 });
  }

  const subject = typeof body.subject === "string" ? body.subject.trim() : null;
  if (subject && subject.length > 80) {
    return NextResponse.json({ error: "subject must be max 80 characters" }, { status: 400 });
  }

  const rawDefaultDays = body.defaultDays ?? body.days;
  const defaultDays = rawDefaultDays === 4 ? 4 : rawDefaultDays === 7 ? 7 : null;
  if (!defaultDays) {
    return NextResponse.json({ error: "defaultDays must be 4 or 7" }, { status: 400 });
  }

  const tasks = parseTasks(body.tasks);
  if (tasks.length === 0 || tasks.length > 100) {
    return NextResponse.json({ error: "tasks must contain 1-100 items" }, { status: 400 });
  }

  const template = await prisma.homeworkTemplate.create({
    data: {
      teacherId: teacher.id,
      title,
      subject,
      defaultDays,
      tasks: JSON.stringify(tasks.map((t) => ({ title: t, weight: 1 }))),
    },
  });

  return NextResponse.json({ template }, { status: 201 });
}
