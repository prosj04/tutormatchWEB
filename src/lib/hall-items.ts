/** 합격 카드 기본 데이터 — 학교 로고 워터마크 + 브랜드 컬러 텍스트. 2과목 수강 4/12(≈33%), 개월 단위 수강 혼합. */
export const HALL_DEFAULT_CARDS = [
  { logo: "/images/logos/univ/snu.png", color: "#003E7E", title: "서울대학교 합격", dept: "컴퓨터공학부", student: "김*현", course: "3년간 수학·과학 수강" },
  { logo: "/images/logos/univ/kaist.png", color: "#004191", title: "KAIST 합격", dept: "전산학부", student: "이*훈", course: "2년간 수학 수강" },
  { logo: "/images/logos/univ/postech.png", color: "#AE0932", title: "포스텍 합격", dept: "화학공학과", student: "박*진", course: "18개월간 수학 수강" },
  { logo: "/images/logos/univ/yonsei.png", color: "#003876", title: "연세대학교 합격", dept: "경영학과", student: "김*연", course: "3년간 수학·영어 수강" },
  { logo: "/images/logos/univ/korea.png", color: "#8C0021", title: "고려대학교 합격", dept: "미디어학부", student: "이*준", course: "8개월간 국어 수강" },
  { logo: "/images/logos/univ/sogang.png", color: "#B01C2E", title: "서강대학교 합격", dept: "경제학과", student: "강*민", course: "2년간 수학 수강" },
  { logo: "/images/logos/univ/skku.png", color: "#0B6E4F", title: "성균관대학교 합격", dept: "글로벌경영학과", student: "박*서", course: "10개월간 영어 수강" },
  { logo: "/images/logos/univ/hanyang.png", color: "#0E4A84", title: "한양대학교 합격", dept: "기계공학부", student: "정*원", course: "2년간 수학 수강" },
  { logo: "/images/logos/univ/ewha.png", color: "#00584A", title: "이화여자대학교 합격", dept: "초등교육과", student: "최*아", course: "2년간 국어·영어 수강" },
  { logo: "/images/logos/univ/cau.png", color: "#143C8C", title: "중앙대학교 합격", dept: "간호학과", student: "윤*재", course: "1년간 영어 수강" },
  { logo: "/images/logos/univ/khu.png", color: "#A0132F", title: "경희대학교 합격", dept: "한의예과", student: "임*지", course: "3년간 수학·과학 수강" },
  { logo: "/images/logos/univ/hufs.png", color: "#003087", title: "한국외국어대학교 합격", dept: "영어통번역학과", student: "서*현", course: "14개월간 영어 수강" },
] as const;

export type HallCardItem = {
  image: string;
  color: string;
  title: string;
  dept: string;
  student: string;
  course: string;
};

/** CMS getter로 합격 카드 목록을 만든다. visible 판정은 호출부에서 수행. */
export function buildHallItem(
  n: number,
  get: (key: string, fallback: string) => string,
): HallCardItem {
  const d = HALL_DEFAULT_CARDS[n - 1];
  return {
    image: get(`hall${n}_image`, d.logo),
    color: get(`hall${n}_color`, d.color),
    title: get(`hall${n}_title`, d.title),
    dept: get(`hall${n}_dept`, d.dept),
    student: get(`hall${n}_student`, d.student),
    course: get(`hall${n}_course`, d.course),
  };
}
