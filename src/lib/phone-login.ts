/** Digits only, for matching and synthetic email. */
export function normalizePhoneDigits(input: string): string {
  return input.replace(/\D/g, "");
}

/** Stable unique pseudo-email for Prisma User.email (students without real email). */
export function studentSyntheticEmailFromDigits(digits: string): string {
  return `student+${digits}@concord.local`;
}

/** Stable unique pseudo-email for Prisma User.email (teachers log in with phone). */
export function teacherSyntheticEmailFromDigits(digits: string): string {
  return `teacher+${digits}@concord.local`;
}
