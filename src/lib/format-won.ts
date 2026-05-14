export function formatKRW(amount: number): string {
  return `${amount.toLocaleString("ko-KR")}원`;
}
