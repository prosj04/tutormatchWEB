import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { softDeleteUser } from "@/lib/account-deletion";
import { recordAudit } from "@/lib/audit-log";

/** POST /api/account/delete — delete own account (soft-delete) for web session users */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await softDeleteUser(session.user.id);
    recordAudit({
      actorUserId: session.user.id,
      actorRole: session.user.role ?? "STUDENT",
      action: "ACCOUNT_DELETE",
      targetType: "User",
      targetId: session.user.id,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[account/delete] error:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 },
    );
  }
}
