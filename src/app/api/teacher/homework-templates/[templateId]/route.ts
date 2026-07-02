import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireTeacherStudentMatch } from "@/lib/teacher-student-match";
import { requireTeacher } from "@/lib/teacher-auth";

type RouteContext = { params: Promise<{ templateId: string }> };

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

async function findOwnedTemplate(teacherId: string, templateId: string) {
  const template = await prisma.homeworkTemplate.findUnique({ where: { id: templateId } });
  if (!template || template.teacherId !== teacherId) return null;
  return template;
}

export async function PATCH(request: Request, context: RouteContext) {
  const authResult = await requireTeacher();
  if ("error" in authResult) return authResult.error;
  const { teacher } = authResult;

  const { templateId } = await context.params;
  const template = await findOwnedTemplate(teacher.id, templateId);
  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data: Prisma.HomeworkTemplateUpdateInput = {};

  if (body.name !== undefined) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name || name.length > 80) {
      return NextResponse.json({ error: "name must be 1-80 characters" }, { status: 400 });
    }
    data.name = name;
  }

  if (body.days !== undefined) {
    const days = body.days === 4 ? 4 : body.days === 7 ? 7 : null;
    if (!days) {
      return NextResponse.json({ error: "days must be 4 or 7" }, { status: 400 });
    }
    data.days = days;
  }

  if (body.tasks !== undefined) {
    const tasks = parseTasks(body.tasks);
    if (tasks.length === 0 || tasks.length > 100) {
      return NextResponse.json({ error: "tasks must contain 1-100 items" }, { status: 400 });
    }
    data.tasks = tasks.join("\n");
  }

  if (body.studentId !== undefined) {
    if (body.studentId === null) {
      data.student = { disconnect: true };
    } else if (typeof body.studentId === "string" && body.studentId) {
      const matchResult = await requireTeacherStudentMatch(teacher.id, body.studentId);
      if ("error" in matchResult) return matchResult.error;
      data.student = { connect: { id: body.studentId } };
    } else {
      return NextResponse.json({ error: "Invalid studentId" }, { status: 400 });
    }
  }

  const updated = await prisma.homeworkTemplate.update({
    where: { id: templateId },
    data,
  });

  return NextResponse.json({ template: updated });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const authResult = await requireTeacher();
  if ("error" in authResult) return authResult.error;
  const { teacher } = authResult;

  const { templateId } = await context.params;
  const template = await findOwnedTemplate(teacher.id, templateId);
  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  await prisma.homeworkTemplate.delete({ where: { id: templateId } });

  return new NextResponse(null, { status: 204 });
}
