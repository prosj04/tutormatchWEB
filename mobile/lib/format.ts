/** 12345 → "12,345원" */
export function won(n: number): string {
  return `${n.toLocaleString("ko-KR")}원`;
}
