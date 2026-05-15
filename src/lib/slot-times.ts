export const SLOT_TIME_OPTIONS = (() => {
  const times: string[] = [];
  for (let h = 9; h <= 20; h++) {
    times.push(`${String(h).padStart(2, "0")}:00`);
    if (h < 20) times.push(`${String(h).padStart(2, "0")}:30`);
  }
  return times;
})();

export function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const nh = Math.floor(total / 60);
  const nm = total % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
}
