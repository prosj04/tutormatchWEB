// 공용 날짜 포맷 — KST(Asia/Seoul) 고정.
// 어드민·포털의 toLocaleDateString("ko-KR") 혼재를 일원화한다.

const KST_TZ = "Asia/Seoul";

function toDate(d: Date | string | number): Date {
  return d instanceof Date ? d : new Date(d);
}

/** "M월 D일" (KST 기준). 유효하지 않은 값은 빈 문자열. */
export function formatDateKst(d: Date | string | number): string {
  const date = toDate(d);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("ko-KR", {
    timeZone: KST_TZ,
    month: "numeric",
    day: "numeric",
  }).formatToParts(date);
  const month = parts.find((p) => p.type === "month")?.value ?? "";
  const day = parts.find((p) => p.type === "day")?.value ?? "";
  return `${month}월 ${day}일`;
}
