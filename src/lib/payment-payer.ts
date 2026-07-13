/**
 * C-2(재심-8): 학부모 연결 가정만 학부모 결제를 기본 안내한다.
 *
 * 미연결 학생은 항상 false — 학생 단독 결제 경로 완전 무변경.
 * 학부모 세션은 자체 자녀 선택 동선(parentChildren)을 쓰므로 여기서 제외.
 */
export function shouldPromptParentPayment(
  role: string | null | undefined,
  hasLinkedParent: boolean,
): boolean {
  return role === "STUDENT" && hasLinkedParent;
}
