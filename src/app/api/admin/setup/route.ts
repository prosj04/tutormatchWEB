/**
 * First-time admin bootstrap. After one ADMIN exists, always returns 403.
 *
 * Alternative (Supabase SQL Editor — do not run from app code):
 * -- INSERT INTO "User" (id, email, password, role)
 * -- VALUES (gen_random_uuid()::text, 'admin@tutoring.com',
 * --   '$2b$12$HASHED_PASSWORD', 'ADMIN');
 * -- Password must be bcrypt hash with saltRounds 12.
 *
 * Env: ADMIN_SETUP_SECRET="your-secret-key-here"
 */
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { adminCount } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const adminUsers = await adminCount();
  if (adminUsers > 0) {
    return NextResponse.json({ error: "Admin already exists" }, { status: 403 });
  }

  const secret = process.env.ADMIN_SETUP_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Setup not configured" }, { status: 503 });
  }

  let body: { email?: unknown; password?: unknown; secretKey?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const secretKey = typeof body.secretKey === "string" ? body.secretKey : "";

  if (!email || !email.includes("@") || password.length < 8) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 400 });
  }

  if (secretKey !== secret) {
    return NextResponse.json({ error: "Invalid secret key" }, { status: 401 });
  }

  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      email,
      password: hashed,
      role: "ADMIN",
    },
    select: { id: true, email: true, role: true, createdAt: true },
  });

  return NextResponse.json({ user }, { status: 201 });
}
