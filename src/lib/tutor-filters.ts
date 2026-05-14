import type { Tutor } from "./tutors-data";

function subjectCategories(t: Tutor): string[] {
  const blob = t.subjects.join(" ");
  const cats = new Set<string>();
  if (/수학|미적|확률|Calculus|이산/i.test(blob)) cats.add("수학");
  if (/영어|토플|SAT|Reading/i.test(blob)) cats.add("영어");
  if (/물리|화학|생명|과학|AP Physics|탐구/i.test(blob)) cats.add("과학");
  if (/국어|논술|작문|화법/i.test(blob)) cats.add("국어");
  if (/한국사|사회|경제|동아시아|사문/i.test(blob)) cats.add("사회");
  if (/Python|정보|CS|알고리즘|이산수학/i.test(blob)) cats.add("정보");
  return Array.from(cats);
}

export function tutorMatchesFilters(
  t: Tutor,
  subject: string,
  region: string,
  price: string,
  rating: string,
): boolean {
  if (subject !== "전체") {
    const cats = subjectCategories(t);
    if (!cats.includes(subject)) return false;
  }

  if (region !== "전체") {
    if (region === "온라인") {
      if (!t.region.includes("온라인")) return false;
    } else if (!t.region.includes(region)) {
      return false;
    }
  }

  if (price !== "전체") {
    if (price === "~7만원/시" && t.hourlyMax > 7) return false;
    if (price === "7–9만원/시") {
      const overlaps = t.hourlyMin <= 9 && t.hourlyMax >= 7;
      if (!overlaps) return false;
    }
    if (price === "9만원~/시" && t.hourlyMin < 9) return false;
  }

  if (rating === "4.9+" && t.rating < 4.9) return false;
  if (rating === "4.85+" && t.rating < 4.85) return false;

  return true;
}
