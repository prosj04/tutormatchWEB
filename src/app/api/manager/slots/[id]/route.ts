import { NextResponse } from "next/server";

import { requireManager } from "@/lib/manager-auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  const authResult = await requireManager();
  if ("error" in authResult) return authResult.error;
  const { teacher } = authResult;

  const { id } = await context.params;

  const slot = await prisma.consultationSlot.findFirst({
    where: { id, managerId: teacher.id },
  });

  if (!slot) {
    return NextResponse.json({ error: "Slot not found" }, { status: 404 });
  }

  if (slot.isBooked) {
    return NextResponse.json(
      { error: "예약된 슬롯은 삭제할 수 없습니다." },
      { status: 409 },
    );
  }

  await prisma.consultationSlot.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
