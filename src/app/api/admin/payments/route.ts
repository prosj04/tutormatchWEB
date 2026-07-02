import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const VALID_STATUSES = ["FAILED", "PROCESSING", "COMPLETED"];

export async function GET(request: Request) {
  const authResult = await requireAdmin();
  if ("error" in authResult) return authResult.error;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status")?.trim().toUpperCase();

  const where =
    status === "ALL"
      ? {}
      : status && VALID_STATUSES.includes(status)
        ? { status }
        : { status: { in: ["FAILED", "PROCESSING"] } };

  const payments = await prisma.paymentCompletion.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      student: { select: { name: true, phone: true } },
    },
  });

  return NextResponse.json({
    payments: payments.map((p) => ({
      id: p.id,
      orderId: p.orderId,
      paymentKey: p.paymentKey,
      status: p.status,
      amount: p.amount,
      planId: p.plan,
      studentName: p.student?.name ?? null,
      studentPhone: p.student?.phone ?? null,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    })),
  });
}
