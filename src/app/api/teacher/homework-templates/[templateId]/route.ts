import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireTeacher } from "@/lib/teacher-auth";

type RouteContext = { params: Promise<{ templateId: string }> };

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

  if (body.title !== undefined || body.name !== undefined) {
    const rawTitle = body.title ?? body.name;
    const title = typeof rawTitle === "string" ? rawTitle.trim() : "";
    if (!title || title.length > 80) {
      return NextResponse.json({ error: "title must be 1-80 characters" }, { status: 400 });
    }
    data.title = title;
  }

  if (body.subject !== undefined) {
    const subject = typeof body.subject === "string" ? body.subject.trim() : "";
    if (subject && subject.length > 80) {
      return NextResponse.json({ error: "subject must be max 80 characters" }, { status: 400 });
    }
    data.subject = subject || null;
  }

  if (body.defaultDays !== undefined || body.days !== undefined) {
    const rawDefaultDays = body.defaultDays ?? body.days;
    const days = rawDefaultDays === 4 ? 4 : rawDefaultDays === 7 ? 7 : null;
    if (!days) {
      return NextResponse.json({ error: "defaultDays must be 4 or 7" }, { status: 400 });
    }
    data.defaultDays = days;
  }

  if (body.tasks !== undefined) {
    const tasks = parseTasks(body.tasks);
    if (tasks.length === 0 || tasks.length > 100) {
      return NextResponse.json({ error: "tasks must contain 1-100 items" }, { status: 400 });
    }
    data.tasks = JSON.stringify(tasks.map((t) => ({ title: t, weight: 1 })));
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
