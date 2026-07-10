import { NextResponse } from "next/server";

import { requireMobileTeacher } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";

type RequestBody = {
  title?: unknown;
  name?: unknown;
  subject?: unknown;
  defaultDays?: unknown;
  days?: unknown;
  tasks?: unknown;
};

/** 저장된 tasks(주로 `[{title,weight}]` JSON)를 줄바꿈 제목 텍스트로 복원. */
function tasksToText(stored: string): string {
  try {
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      return parsed
        .map((item) =>
          typeof item === "string"
            ? item
            : item && typeof item === "object" && typeof item.title === "string"
              ? item.title
              : "",
        )
        .filter(Boolean)
        .join("\n");
    }
  } catch {
    // JSON이 아니면 이미 평문 — 그대로 사용.
  }
  return stored;
}

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
  const authResult = await requireMobileTeacher(request);
  if ("error" in authResult) return authResult.error;
  const { teacher } = authResult;

  const templates = await prisma.homeworkTemplate.findMany({
    where: {
      teacherId: teacher.id,
    },
    orderBy: { updatedAt: "desc" },
  });

  // 저장은 `[{title,weight}]` JSON 문자열이지만, 플랜 탭 UI는 tasks를 줄바꿈 텍스트로
  // 그대로 textarea에 넣는다. 원문 JSON을 노출하면 통째로 한 줄 숙제가 되어 재사용이
  // 깨지므로, 제목만 뽑아 줄바꿈으로 join한 문자열로 변환해 반환한다.
  return NextResponse.json({
    templates: templates.map((t) => ({
      ...t,
      tasks: tasksToText(t.tasks),
    })),
  });
}

export async function POST(request: Request) {
  const authResult = await requireMobileTeacher(request);
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
