/** 대학 브랜드(로고·컬러) 매핑 — 합격 카드·선생님 카드 공용 */
export type UnivBrand = { logo: string; color: string };

const BRANDS: (UnivBrand & { tokens: string[] })[] = [
  { logo: "/images/logos/univ/snu.png", color: "#003E7E", tokens: ["서울대"] },
  { logo: "/images/logos/univ/kaist.png", color: "#004191", tokens: ["카이스트", "KAIST", "한국과학기술원"] },
  { logo: "/images/logos/univ/postech.png", color: "#AE0932", tokens: ["포스텍", "포항공대", "POSTECH", "포항공과"] },
  { logo: "/images/logos/univ/yonsei.png", color: "#003876", tokens: ["연세대"] },
  { logo: "/images/logos/univ/korea.png", color: "#8C0021", tokens: ["고려대"] },
  { logo: "/images/logos/univ/sogang.png", color: "#B01C2E", tokens: ["서강대"] },
  { logo: "/images/logos/univ/skku.png", color: "#0B6E4F", tokens: ["성균관대"] },
  { logo: "/images/logos/univ/hanyang.png", color: "#0E4A84", tokens: ["한양대"] },
  { logo: "/images/logos/univ/ewha.png", color: "#00584A", tokens: ["이화여대", "이화여자대"] },
  { logo: "/images/logos/univ/cau.png", color: "#143C8C", tokens: ["중앙대"] },
  { logo: "/images/logos/univ/khu.png", color: "#A0132F", tokens: ["경희대"] },
  { logo: "/images/logos/univ/hufs.png", color: "#003087", tokens: ["한국외대", "한국외국어대", "외국어대"] },
];

/** "연세대학교 경영학과 (수시)" 같은 문자열에서 대학 브랜드를 찾는다. 없으면 null */
export function matchUnivBrand(text: string): UnivBrand | null {
  const t = text.toUpperCase();
  for (const b of BRANDS) {
    if (b.tokens.some((tok) => t.includes(tok.toUpperCase()))) {
      return { logo: b.logo, color: b.color };
    }
  }
  return null;
}
