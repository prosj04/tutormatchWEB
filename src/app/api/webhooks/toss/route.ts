import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { planIdFromAmount } from "@/lib/pricing-plans";
import { completeStudentPayment } from "@/lib/student-payment";
import { fetchTossPayment } from "@/lib/toss-payments";

interface TossWebhookPayload {
  eventType?: string;
  data?: {
    paymentKey?: string;
    orderId?: string;
    status?: string;
    totalAmount?: number;
  };
}

/**
 * Toss Payments webhook handler.
 *
 * Receives PAYMENT_STATUS_CHANGED events from Toss after payment completion.
 * For status "DONE": fetches payment details from Toss API (never trusting webhook body alone),
 * looks up the student via orderId→PaymentCompletion mapping, and runs completion idempotently.
 *
 * - Already-processed orderId: returns 200 with no side effects
 * - Other statuses: logs and returns 200
 * - Malformed payload: returns 400
 * - Always returns 200 for recognized events (Toss retries non-200)
 */
export async function POST(request: Request) {
  let body: TossWebhookPayload;
  try {
    body = await request.json();
  } catch {
    console.error("[toss-webhook] Failed to parse JSON");
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventType = body.eventType ?? "";
  if (eventType !== "PAYMENT_STATUS_CHANGED") {
    console.log(`[toss-webhook] Ignoring event type: ${eventType}`);
    return NextResponse.json({ ok: true });
  }

  const paymentKey = typeof body.data?.paymentKey === "string" ? body.data.paymentKey.trim() : "";
  const orderId = typeof body.data?.orderId === "string" ? body.data.orderId.trim() : "";
  const status = typeof body.data?.status === "string" ? body.data.status.trim() : "";

  if (!paymentKey || !orderId) {
    console.error("[toss-webhook] Missing paymentKey or orderId", { paymentKey, orderId });
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (status !== "DONE") {
    console.log(`[toss-webhook] Ignoring status: ${status} (orderId: ${orderId})`);
    return NextResponse.json({ ok: true });
  }

  try {
    // Check if this orderId was already processed to avoid duplicate charges
    const existingCompletion = await prisma.paymentCompletion.findUnique({
      where: { orderId },
      select: { id: true, status: true, studentId: true },
    });

    if (existingCompletion?.status === "COMPLETED") {
      console.log(`[toss-webhook] Already completed (orderId: ${orderId})`);
      return NextResponse.json({ ok: true });
    }

    // Fetch actual payment details from Toss API (never trust webhook body alone)
    let tossPayment;
    try {
      tossPayment = await fetchTossPayment(paymentKey);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      console.error(`[toss-webhook] Failed to fetch payment from Toss (orderId: ${orderId}):`, msg);
      // Return 200 to stop Toss from retrying; log for manual investigation
      return NextResponse.json({ ok: true });
    }

    // Verify that the orderId matches Toss records
    if (tossPayment.orderId !== orderId) {
      console.error(
        `[toss-webhook] orderId mismatch: webhook=${orderId}, toss=${tossPayment.orderId}`,
      );
      return NextResponse.json({ ok: true });
    }

    // Verify payment status is DONE in Toss
    if (tossPayment.status !== "DONE") {
      console.warn(
        `[toss-webhook] Payment status not DONE in Toss (orderId: ${orderId}, status: ${tossPayment.status})`,
      );
      return NextResponse.json({ ok: true });
    }

    // Find the student via the orderId→PaymentCompletion mapping
    let studentId: string;
    if (existingCompletion?.studentId) {
      studentId = existingCompletion.studentId;
    } else {
      console.error(
        `[toss-webhook] No PaymentCompletion record found for orderId: ${orderId}`,
      );
      console.error(
        "[toss-webhook] LIMITATION: orderId→student mapping unavailable. Webhook received but completion cannot proceed.",
      );
      return NextResponse.json({ ok: true });
    }

    // Fetch student details needed for completion
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { id: true, name: true, grade: true },
    });

    if (!student) {
      console.error(`[toss-webhook] Student not found (studentId: ${studentId})`);
      return NextResponse.json({ ok: true });
    }

    // Derive plan from the Toss-verified amount — never trust webhook body or defaults
    const plan = planIdFromAmount(tossPayment.amount);
    if (!plan) {
      console.error(
        `[toss-webhook] No plan matches amount ${tossPayment.amount} (orderId: ${orderId})`,
      );
      return NextResponse.json({ ok: true });
    }

    // Run idempotent completion flow
    try {
      await completeStudentPayment({
        studentId: student.id,
        studentName: student.name,
        studentGrade: student.grade,
        orderId,
        paymentKey,
        amount: tossPayment.amount,
        plan,
      });

      console.log(`[toss-webhook] Successfully completed payment (orderId: ${orderId})`);
      return NextResponse.json({ ok: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      console.error(
        `[toss-webhook] completeStudentPayment failed (orderId: ${orderId}):`,
        msg,
      );
      // Return 200 to prevent Toss retry loop; log for manual investigation
      return NextResponse.json({ ok: true });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error(`[toss-webhook] Unexpected error (orderId: ${orderId}):`, msg);
    return NextResponse.json({ ok: true });
  }
}
