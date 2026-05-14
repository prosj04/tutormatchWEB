export type TutorReview = {
  author: string;
  role: string;
  rating: number;
  text: string;
};

export type CredentialItem = {
  year: string;
  category: "학력" | "경력" | "자격증";
  title: string;
  detail: string;
};

export type Tutor = {
  id: string;
  name: string;
  tagline: string;
  subjects: string[];
  image: string;
  hourlyMin: number;
  hourlyMax: number;
  rating: number;
  region: string;
  credentials: CredentialItem[];
  teachingStyle: string[];
  subjectLevels: string[];
  reviews: TutorReview[];
};

export const tutors: Tutor[] = [
  {
    id: "1",
    name: "이준혁",
    tagline: "개념을 구조화하는 수학 코치",
    subjects: ["미적분", "확률과 통계", "수능 수학"],
    image:
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=800&h=1000&fit=crop&q=80",
    hourlyMin: 7,
    hourlyMax: 9,
    rating: 4.9,
    region: "강남 · 온라인",
    credentials: [
      {
        year: "2016",
        category: "학력",
        title: "서울대학교 수리과학부",
        detail: "학사 · 수학 전공 우수 졸업",
      },
      {
        year: "2018–현재",
        category: "경력",
        title: "메이저 입시 학원 심화반",
        detail: "수석 강사 · N수 특화 커리큘럼 운영",
      },
      {
        year: "2020",
        category: "자격증",
        title: "중등학교정교사(수학)",
        detail: "한국교육과정평가원",
      },
    ],
    teachingStyle: [
      "문제풀이보다 정의와 정리에서 출발합니다. 학생이 스스로 ‘왜 이 단계인가’를 말할 수 있을 때까지 질문을 이어 갑니다.",
      "주 1회 과제는 양보다 질을 우선하며, 오답은 반드시 근거(정리·그래프·한 줄 논증)로 남기도록 합니다.",
      "학부모님께는 월 2회 진도표와 취약 유형 비중을 공유드립니다.",
    ],
    subjectLevels: ["고1–고3", "N수", "AP Calculus"],
    reviews: [
      {
        author: "김○○ 학부모",
        role: "고2 · 강남",
        rating: 5,
        text: "성적뿐 아니라 공부하는 태도가 달라졌다는 말을 아이가 먼저 했습니다. 피드백이 매우 구체적입니다.",
      },
      {
        author: "이○○",
        role: "고3 · 온라인",
        rating: 5,
        text: "모의고사 변형 문제를 스스로 분류하게 해 주셔서 실전 감각이 많이 올랐습니다.",
      },
      {
        author: "박○○ 학부모",
        role: "N수 · 분당",
        rating: 4,
        text: "일정 조율이 유연하고, 약점 유형 리포트가 도움이 됩니다.",
      },
    ],
  },
  {
    id: "2",
    name: "박서연",
    tagline: "읽기·쓰기 균형을 잡는 영어 리터러시",
    subjects: ["영어", "토플", "SAT Reading"],
    image:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&h=1000&fit=crop&q=80",
    hourlyMin: 8,
    hourlyMax: 10,
    rating: 5.0,
    region: "분당 · 온라인",
    credentials: [
      {
        year: "2015",
        category: "학력",
        title: "연세대학교 영어영문학과",
        detail: "학사 · 영문학·언어학 이중 트랙",
      },
      {
        year: "2017–현재",
        category: "경력",
        title: "국제학교 출강 · 프리랜싱",
        detail: "IB·AP 영어 지도 1,800시간+",
      },
      {
        year: "2019",
        category: "자격증",
        title: "TESOL Advanced",
        detail: "Arizona State University (온라인)",
      },
    ],
    teachingStyle: [
      "문법은 문맥 안에서만 다룹니다. 매 수업 15분은 원서 읽기와 요약으로 시작해 사고의 속도를 맞춥니다.",
      "에세이는 논거–근거–결론의 삼단 구조를 반복 훈련하며, 첨삭은 문장 단위가 아닌 논리 단위로 드립니다.",
      "토플·SAT은 유형별 시간 배분 전략을 먼저 세운 뒤 실전 모의로 마감합니다.",
    ],
    subjectLevels: ["중등", "고등", "SAT", "토플"],
    reviews: [
      {
        author: "정○○",
        role: "고1 · 분당",
        rating: 5,
        text: "학교 영어 성적이 오르는 것보다, 영어로 생각하는 시간이 늘었습니다.",
      },
      {
        author: "최○○ 학부모",
        role: "중3 · 온라인",
        rating: 5,
        text: "과제 피드백이 빠르고 정확합니다. 꼼꼼하신 분이에요.",
      },
      {
        author: "한○○",
        role: "고2 · 토플",
        rating: 5,
        text: "리딩 속도가 눈에 띄게 빨라졌습니다.",
      },
    ],
  },
  {
    id: "3",
    name: "최민재",
    tagline: "수식이 아닌 직관으로 푸는 물리",
    subjects: ["물리1", "물리2", "AP Physics"],
    image:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&h=1000&fit=crop&q=80",
    hourlyMin: 7,
    hourlyMax: 8,
    rating: 4.95,
    region: "송파 · 온라인",
    credentials: [
      {
        year: "2014",
        category: "학력",
        title: "KAIST 전기및전자공학부",
        detail: "학사",
      },
      {
        year: "2019–현재",
        category: "경력",
        title: "프라이빗 과학 튜터",
        detail: "물리·수학 통합 지도",
      },
      {
        year: "2021",
        category: "자격증",
        title: "한국장학재단 STEM 멘토",
        detail: "우수 멘토 2회 수상",
      },
    ],
    teachingStyle: [
      "실험 영상과 간단한 시뮬레이션으로 먼저 직관을 쌓은 뒤, 공식을 ‘정리’로 받아들이게 합니다.",
      "문항별로 ‘실수 유형’을 태깅해 두어 같은 실수가 반복되지 않게 합니다.",
    ],
    subjectLevels: ["고1–고3", "AP Physics 1·2", "내신 심화"],
    reviews: [
      {
        author: "윤○○",
        role: "고2 · 송파",
        rating: 5,
        text: "학교 선생님 설명보다 이해가 빠릅니다. 특히 전자기 파트가 좋았어요.",
      },
      {
        author: "강○○ 학부모",
        role: "고1 · 온라인",
        rating: 5,
        text: "과제 난이도 조절을 잘 해 주십니다.",
      },
      {
        author: "서○○",
        role: "고3",
        rating: 4,
        text: "질문에 성실하게 답해 주십니다.",
      },
    ],
  },
  {
    id: "4",
    name: "한지우",
    tagline: "논술형 사고를 훈련하는 국어",
    subjects: ["국어", "논술", "화법과 작문"],
    image:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=800&h=1000&fit=crop&q=80",
    hourlyMin: 8,
    hourlyMax: 11,
    rating: 4.98,
    region: "압구정 · 온라인",
    credentials: [
      {
        year: "2013",
        category: "학력",
        title: "서울대학교 국어국문학과",
        detail: "학사 · 현대문학 트랙",
      },
      {
        year: "2016–현재",
        category: "경력",
        title: "논술 전문 프라이빗",
        detail: "인문·융합 논술 지도",
      },
      {
        year: "2018",
        category: "자격증",
        title: "한국국어능력시험 1급",
        detail: "",
      },
    ],
    teachingStyle: [
      "지문은 ‘읽기’가 아니라 ‘해석 규칙 찾기’로 접근합니다. 매 수업 한 편은 소리 내어 읽고 논지를 도식화합니다.",
      "논술은 출제 의도 추정 → 개요 10분 → 첨삭 2회 사이클로 진행합니다.",
      "학생별로 어휘·문장 길이 편차를 기록해 스타일을 통일해 갑니다.",
    ],
    subjectLevels: ["고2–고3", "논술", "내신 국어"],
    reviews: [
      {
        author: "조○○ 학부모",
        role: "고3 · 압구정",
        rating: 5,
        text: "논술 첨삭이 날카롭지만 정확합니다. 아이가 부담스러워하지 않게 잘 이끌어 주세요.",
      },
      {
        author: "황○○",
        role: "고2",
        rating: 5,
        text: "작문 실력이 눈에 띄게 늘었습니다.",
      },
      {
        author: "신○○ 학부모",
        role: "고1",
        rating: 4,
        text: "과제량이 많은 편이지만 그만큼 효과가 있습니다.",
      },
    ],
  },
  {
    id: "5",
    name: "정유진",
    tagline: "내신·수능 겸비 화학 실험형 수업",
    subjects: ["화학1", "화학2", "생명과학1"],
    image:
      "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&h=1000&fit=crop&q=80",
    hourlyMin: 6,
    hourlyMax: 8,
    rating: 4.85,
    region: "판교 · 온라인",
    credentials: [
      {
        year: "2017",
        category: "학력",
        title: "이화여자대학교 화학과",
        detail: "학사",
      },
      {
        year: "2020–현재",
        category: "경력",
        title: "과학 입시 전문",
        detail: "실험 기록·탐구 보고서 코칭",
      },
      {
        year: "2022",
        category: "자격증",
        title: "중등학교정교사(화학)",
        detail: "",
      },
    ],
    teachingStyle: [
      "개념도표와 반응식 플로우차트로 먼저 정리한 뒤, 기출에서 ‘조건 변형’만 추려 풉니다.",
      "탐구는 가설–변수–오차 분석 순으로 피드백합니다.",
    ],
    subjectLevels: ["고1–고3", "탐구", "내신"],
    reviews: [
      {
        author: "문○○",
        role: "고2 · 판교",
        rating: 5,
        text: "실험 보고서 첨삭이 세심합니다.",
      },
      {
        author: "오○○ 학부모",
        role: "고1",
        rating: 4,
        text: "설명이 차분하고 이해하기 쉽습니다.",
      },
      {
        author: "유○○",
        role: "고3",
        rating: 5,
        text: "기출 변형 문제가 많아 도움이 됐어요.",
      },
    ],
  },
  {
    id: "6",
    name: "강도현",
    tagline: "코드와 수학의 교차 — CS 기초",
    subjects: ["정보", "Python", "이산수학"],
    image:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&h=1000&fit=crop&q=80",
    hourlyMin: 9,
    hourlyMax: 12,
    rating: 4.92,
    region: "온라인",
    credentials: [
      {
        year: "2012",
        category: "학력",
        title: "서울대학교 컴퓨터공학부",
        detail: "학사",
      },
      {
        year: "2018–현재",
        category: "경력",
        title: "스타트업 CTO · 출강",
        detail: "알고리즘·포트폴리오 멘토링",
      },
      {
        year: "2023",
        category: "자격증",
        title: "AWS Certified Developer",
        detail: "",
      },
    ],
    teachingStyle: [
      "문법보다 문제 해결 루프(입력–검증–리팩터)를 먼저 익힙니다.",
      "수학적 귀납·그래프 개념을 코드로 시각화해 연결합니다.",
    ],
    subjectLevels: ["고등", "특목고", "포트폴리오"],
    reviews: [
      {
        author: "남○○",
        role: "고2 · 특목고",
        rating: 5,
        text: "세특·포폴 방향을 잡는 데 결정적이었습니다.",
      },
      {
        author: "류○○ 학부모",
        role: "고1",
        rating: 5,
        text: "설명이 체계적이고 친절합니다.",
      },
      {
        author: "배○○",
        role: "N수",
        rating: 4,
        text: "난이도 높은 편이지만 실력이 늡니다.",
      },
    ],
  },
  {
    id: "7",
    name: "오하은",
    tagline: "사회·한국사 — 사료 읽기 중심",
    subjects: ["한국사", "사회문화", "동아시아사"],
    image:
      "https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=800&h=1000&fit=crop&q=80",
    hourlyMin: 6,
    hourlyMax: 7,
    rating: 4.88,
    region: "서초 · 온라인",
    credentials: [
      {
        year: "2016",
        category: "학력",
        title: "고려대학교 사학과",
        detail: "학사",
      },
      {
        year: "2019–현재",
        category: "경력",
        title: "사탐 전문 튜터",
        detail: "한능검 1급 출제 경향 분석",
      },
      {
        year: "2020",
        category: "자격증",
        title: "한국사능력검정시험 1급",
        detail: "",
      },
    ],
    teachingStyle: [
      "연표 암기보다 사료에서 ‘관점’을 찾는 연습을 반복합니다.",
      "지문은 출처·편향·시대상을 세 칸으로 나누어 읽습니다.",
    ],
    subjectLevels: ["고1–고3", "수능 한국사", "사탐"],
    reviews: [
      {
        author: "안○○",
        role: "고3 · 서초",
        rating: 5,
        text: "한국사 등급이 한 단계 올랐습니다.",
      },
      {
        author: "손○○ 학부모",
        role: "고2",
        rating: 4,
        text: "자료 정리가 깔끔합니다.",
      },
      {
        author: "백○○",
        role: "고1",
        rating: 5,
        text: "수업이 재미있어서 집중이 잘 됩니다.",
      },
    ],
  },
  {
    id: "8",
    name: "임태호",
    tagline: "경제·경제 수학 — 그래프로 읽는 세상",
    subjects: ["경제", "사회문화", "수학(경제 연계)"],
    image:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&h=1000&fit=crop&q=80",
    hourlyMin: 7,
    hourlyMax: 9,
    rating: 4.9,
    region: "강남 · 송파",
    credentials: [
      {
        year: "2015",
        category: "학력",
        title: "서울대학교 경제학부",
        detail: "학사",
      },
      {
        year: "2018–현재",
        category: "경력",
        title: "입시 경제·사문 지도",
        detail: "그래프·지표 해석 특화",
      },
      {
        year: "2021",
        category: "경력",
        title: "증권사 리서치 인턴십 멘토",
        detail: "",
      },
    ],
    teachingStyle: [
      "뉴스 한 줄을 가져와 지표–정책–이해관계로 풀어보는 미니 세미나를 매 수업 전반에 둡니다.",
      "서술형은 ‘정의–메커니즘–사례’ 순으로 쓰게 피드백합니다.",
    ],
    subjectLevels: ["고2–고3", "경제", "사문"],
    reviews: [
      {
        author: "허○○",
        role: "고3 · 강남",
        rating: 5,
        text: "서술형 첨삭이 인상적이었습니다.",
      },
      {
        author: "노○○ 학부모",
        role: "고2",
        rating: 5,
        text: "성실하고 준비가 철저합니다.",
      },
      {
        author: "하○○",
        role: "고1",
        rating: 4,
        text: "경제 용어가 많아 처음엔 어려웠지만 익숙해졌어요.",
      },
    ],
  },
];

export function getTutorById(id: string): Tutor | undefined {
  return tutors.find((t) => t.id === id);
}

export const tutorSubjectFilters = [
  "전체",
  "수학",
  "영어",
  "과학",
  "국어",
  "사회",
  "정보",
] as const;

export const tutorRegionFilters = [
  "전체",
  "강남",
  "분당",
  "송파",
  "압구정",
  "판교",
  "서초",
  "온라인",
] as const;

export const tutorPriceFilters = [
  "전체",
  "~7만원/시",
  "7–9만원/시",
  "9만원~/시",
] as const;

export const tutorRatingFilters = ["전체", "4.9+", "4.85+"] as const;
