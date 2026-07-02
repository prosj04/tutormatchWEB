import { NextResponse } from "next/server";

/**
 * POST /api/mobile/payments/complete
 *
 * Native Toss paymentKey flow is not yet implemented in the mobile app.
 * Mobile clients should complete payment through the web checkout screen.
 */
export async function POST() {
  return NextResponse.json(
    {
      error:
        "Mobile native payment not implemented. Please complete payment through the web checkout screen.",
      code: "USE_WEB_CHECKOUT",
    },
    { status: 501 },
  );
}
