import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import {
  normalizePhoneDigits,
  studentSyntheticEmailFromDigits,
} from "@/lib/phone-login";

export const { handlers, auth, signIn, signOut } = NextAuth({
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
        const identifier = (credentials?.identifier as string | undefined)?.trim();
        const password = credentials?.password as string | undefined;
        if (!identifier || !password) return null;

        const { prisma } = await import("@/lib/prisma");

        const orConditions: {
          email?: string;
          student?: { phone: string };
          teacher?: { phone: string };
        }[] = [];

        if (identifier.includes("@")) {
          orConditions.push({ email: identifier.toLowerCase() });
        } else {
          const digits = normalizePhoneDigits(identifier);
          orConditions.push(
            { student: { phone: identifier } },
            { teacher: { phone: identifier } },
          );
          if (digits.length >= 10) {
            orConditions.push(
              { email: studentSyntheticEmailFromDigits(digits) },
              { student: { phone: digits } },
              { teacher: { phone: digits } },
            );
          }
        }

        const user = await prisma.user.findFirst({
          where: { OR: orConditions },
          include: { student: true, teacher: true },
        });

        if (!user) return null;
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return null;

        const name =
          user.student?.name ??
          user.teacher?.name ??
          user.email.split("@")[0];

        return { id: user.id, email: user.email, role: user.role, name };
      },
    }),
  ],
});
