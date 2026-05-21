import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error", "warn"],
  });

// Vercel 서버리스: 인스턴스당 Prisma 클라이언트 1개 재사용 (연결 폭주 방지)
globalForPrisma.prisma = prisma;
