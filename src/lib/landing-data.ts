import type { ShowcaseTutor } from "./landing-data-types";

export type { ShowcaseTutor } from "./landing-data-types";

export const showcaseTutors: ShowcaseTutor[] = [
  {
    id: "math-noah",
    name: "Teacher Noah",
    subject: "수학",
    subjects: ["수학", "미적분", "수능"],
    tagline: "전교꼴등에서 서울대학교 입학했어요",
    background: "서울대학교 수리과학부",
    rating: 4.9,
    image: "/images/teachers/default-male.png",
  },
  {
    id: "english-olivia",
    name: "Teacher Olivia",
    subject: "영어",
    subjects: ["영어", "토플", "내신"],
    tagline: "읽기 습관만 바꿔도 점수는 달라집니다",
    background: "연세대학교 영어영문학과",
    rating: 4.9,
    image: "/images/teachers/default-female.png",
  },
  {
    id: "physics-peter",
    name: "Teacher Peter",
    subject: "물리",
    subjects: ["물리", "수학", "STEM"],
    tagline: "공식보다 먼저 직관을 세워요",
    background: "KAIST 전기및전자공학부",
    rating: 4.8,
    image: "/images/teachers/default-male.png",
  },
  {
    id: "korean-jiwoo",
    name: "Teacher Jiwoo",
    subject: "국어",
    subjects: ["국어", "논술", "내신"],
    tagline: "지문을 읽는 규칙을 훈련합니다",
    background: "서울대학교 국어국문학과",
    rating: 4.8,
    image: "/images/teachers/default-female.png",
  },
];
