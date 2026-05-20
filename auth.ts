import NextAuth from "next-auth";
import type { Prisma } from "@prisma/client";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import {
  normalizePhoneDigits,
  studentSyntheticEmailFromDigits,
  teacherSyntheticEmailFromDigits,
} from "@/lib/phone-login";

/** 로그인 시 relation 전체(include) 금지 — DB에 아직 없는 컬럼까지 SELECT 하면 P2022로 전원 로그인 실패 */
const userForAuthSelect = {
  id: true,
  email: true,
  password: true,
  role: true,
  student: { select: { name: true } },
  teacher: { select: { name: true } },
} satisfies Prisma.UserSelect;

const authSecret =
  process.env.AUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim();

export const { handlers, auth, signIn, signOut } = NextAuth({
  /** App Router 핸들러가 `src/app/api/auth`에 있으므로 항상 이 경로와 맞춤.
   * NEXTAUTH_URL/AUTH_URL에 `/login` 등 경로가 붙으면 basePath가 오염되어 로그인 전체가 실패할 수 있음. */
  basePath: "/api/auth",
  ...(authSecret ? { secret: authSecret } : {}),
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        if (user.name) token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        if (token.name) session.user.name = token.name as string;
      }
      return session;
    },
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        identifier: { label: "Email or Phone", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const raw =
            (credentials?.identifier as string | undefined)?.trim() ?? "";
          const password = credentials?.password as string | undefined;
          const invisible = /[\u200B-\u200D\uFEFF]/g;
          const identifier = raw.replace(invisible, "").trim();
          if (!identifier || password == null || password === "") return null;

          const { prisma } = await import("@/lib/prisma");

          let user = null;

          if (identifier.includes("@")) {
            const email = identifier.toLowerCase();
            user = await prisma.user.findUnique({
              where: { email },
              select: userForAuthSelect,
            });
          } else {
            const digits = normalizePhoneDigits(identifier);
            const orConditions: Prisma.UserWhereInput[] = [
              { student: { phone: identifier } },
              { teacher: { phone: identifier } },
            ];
            if (digits.length >= 10) {
              orConditions.push(
                { email: studentSyntheticEmailFromDigits(digits) },
                { email: teacherSyntheticEmailFromDigits(digits) },
                { student: { phone: digits } },
                { teacher: { phone: digits } },
              );
            }
            user = await prisma.user.findFirst({
              where: { OR: orConditions },
              select: userForAuthSelect,
            });
          }

          if (!user) return null;

          const valid = await bcrypt.compare(password, user.password);
          if (!valid) return null;

          const name =
            user.student?.name ??
            user.teacher?.name ??
            user.email.split("@")[0];

          return { id: user.id, email: user.email, role: user.role, name };
        } catch (e) {
          console.error("[auth] credentials authorize:", e);
          return null;
        }
      },
    }),
  ],
});
