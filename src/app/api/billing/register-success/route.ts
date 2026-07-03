import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { issueBillingKey } from "@/lib/toss-payments";

/**
 * Toss 빌링 인증 성공 후 redirect 도착점.
 * ?authKey=&customerKey= 를 받아 서버가 issueBillingKey로 교환하고
 * BillingProfile을 upsert 한다. customerKey는 `student-{studentId}` 규약이며
 * 세션 학생과 일치해야만 저장한다 — 세션 미일치는 즉시 실패.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const authKey = url.searchParams.get("authKey")?.trim() ?? "";
  const customerKey = url.searchParams.get("customerKey")?.trim() ?? "";

  const paymentsUrl = new URL("/payments", url.origin);

  const fail = (reason: string) => {
    paymentsUrl.searchParams.set("billing", "failed");
    paymentsUrl.searchParams.set("reason", reason);
    return NextResponse.redirect(paymentsUrl);
  };

  const session = await auth();
  if (!session?.user?.id || session.user.role !== "STUDENT") {
    return fail("auth");
  }

  if (!authKey || !customerKey) {
    return fail("missing_params");
  }

  const student = await prisma.student.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!student) return fail("no_student");

  const expectedCustomerKey = `student-${student.id}`;
  if (customerKey !== expectedCustomerKey) {
    return fail("customer_key_mismatch");
  }

  let issued;
  try {
    issued = await issueBillingKey(authKey, customerKey);
  } catch (e) {
    console.error("[billing/register-success] issueBillingKey failed:", e);
    return fail("issue_failed");
  }

  if (!issued.billingKey) {
    return fail("no_billing_key");
  }

  try {
    await prisma.billingProfile.upsert({
      where: { studentId: student.id },
      create: {
        studentId: student.id,
        customerKey,
        billingKey: issued.billingKey,
        cardCompany: issued.cardCompany,
        cardNumberMasked: issued.cardNumberMasked,
        autoRenew: true,
      },
      update: {
        customerKey,
        billingKey: issued.billingKey,
        cardCompany: issued.cardCompany,
        cardNumberMasked: issued.cardNumberMasked,
        // Re-registration re-enables auto-renewal by default.
        autoRenew: true,
      },
    });
  } catch (e) {
    console.error("[billing/register-success] upsert failed:", e);
    return fail("db_failed");
  }

  paymentsUrl.searchParams.set("billing", "registered");
  return NextResponse.redirect(paymentsUrl);
}
