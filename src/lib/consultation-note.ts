/** 상담 신청 메모 조합 (성취도 + 자유 메모) */
export function buildConsultationNote(
  gradeLevel?: string | null,
  memo?: string | null,
): string | null {
  const parts: string[] = [];
  const level = gradeLevel?.trim();
  const note = memo?.trim();
  if (level) parts.push(`현재 성취도: ${level}`);
  if (note) parts.push(note);
  return parts.length > 0 ? parts.join("\n") : null;
}
