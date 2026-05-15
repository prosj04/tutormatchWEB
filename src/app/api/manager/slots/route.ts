import { NextResponse } from "next/server";

import {
  generateRepeatSlotDates,
  getWeekRange,
} from "@/lib/manager-stats";
import { requireManager } from "@/lib/manager-auth";
import { addMinutesToTime, SLOT_TIME_OPTIONS } from "@/lib/slot-times";
import { prisma } from "@/lib/prisma";
import { isValidDateString } from "@/lib/student-auth";

export async function GET(request: Request) {
  const authResult = await requireManager();
  if ("error" in authResult) return authResult.error;
  const { teacher } = authResult;

  const weekStartParam = new URL(request.url).searchParams.get("weekStart");
  const range =
    weekStartParam && isValidDateString(weekStartParam)
      ? getWeekRange(weekStartParam)
      : getWeekRange();

  const slots = await prisma.consultationSlot.findMany({
    where: {
      managerId: teacher.id,
      date: { gte: range.start, lte: range.end },
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  return NextResponse.json({ slots, weekStart: range.start, weekEnd: range.end });
}

export async function POST(request: Request) {
  const authResult = await requireManager();
  if ("error" in authResult) return authResult.error;
  const { teacher } = authResult;

  let body: {
    date?: unknown;
    startTime?: unknown;
    repeat?: unknown;
    weekdays?: unknown;
    weeks?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const startTime =
    typeof body.startTime === "string" ? body.startTime : "";
  if (!SLOT_TIME_OPTIONS.includes(startTime)) {
    return NextResponse.json({ error: "Invalid start time" }, { status: 400 });
  }

  const endTime = addMinutesToTime(startTime, 30);
  const repeat = body.repeat === true;

  let dates: string[] = [];

  if (repeat) {
    const anchor =
      typeof body.date === "string" && isValidDateString(body.date)
        ? body.date
        : null;
    if (!anchor) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }
    const weekdays = Array.isArray(body.weekdays)
      ? body.weekdays.filter((d): d is number => typeof d === "number" && d >= 0 && d <= 6)
      : [];
    const weeks = typeof body.weeks === "number" && body.weeks > 0 ? body.weeks : 4;
    if (weekdays.length === 0) {
      return NextResponse.json({ error: "Select weekdays" }, { status: 400 });
    }
    dates = generateRepeatSlotDates(anchor, weekdays, weeks);
  } else {
    if (typeof body.date !== "string" || !isValidDateString(body.date)) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }
    dates = [body.date];
  }

  const created = await prisma.consultationSlot.createMany({
    data: dates.map((date) => ({
      managerId: teacher.id,
      date,
      startTime,
      endTime,
    })),
    skipDuplicates: true,
  });

  return NextResponse.json({ created: created.count }, { status: 201 });
}
