const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, PageBreak
} = require('docx');
const fs = require('fs');
const path = require('path');

const NAVY = "1E3A5F";
const BLUE = "2563EB";
const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text, bold: true, size: 30, color: NAVY })],
    spacing: { before: 360, after: 160 }
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text, bold: true, size: 26, color: NAVY })],
    spacing: { before: 280, after: 120 }
  });
}

function body(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22, color: "222222", ...opts })],
    spacing: { before: 60, after: 60 },
    alignment: AlignmentType.JUSTIFIED
  });
}

function bullet(text, level = 0) {
  return new Paragraph({
    numbering: { reference: "bullets", level },
    children: [new TextRun({ text, size: 22, color: "222222" })],
    spacing: { before: 40, after: 40 }
  });
}

function tableRow(cells, isHeader = false) {
  return new TableRow({
    children: cells.map(([text, width, align]) =>
      new TableCell({
        borders,
        width: { size: width, type: WidthType.DXA },
        shading: { fill: isHeader ? NAVY : "FFFFFF" },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({
          alignment: align || AlignmentType.LEFT,
          children: [new TextRun({
            text,
            size: 20,
            bold: isHeader,
            color: isHeader ? "FFFFFF" : "222222"
          })]
        })]
      })
    )
  });
}

function makeTable(colWidths, rows) {
  const total = colWidths.reduce((a, b) => a + b, 0);
  return new Table({
    width: { size: total, type: WidthType.DXA },
    columnWidths: colWidths,
    rows
  });
}

function spacer() {
  return new Paragraph({ children: [new TextRun("")], spacing: { before: 80, after: 80 } });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

// ─── COVER PAGE ──────────────────────────────────────────────────────────────
const cover = [
  new Paragraph({ spacing: { before: 1800, after: 0 }, children: [] }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "사  업  계  획  서", bold: true, size: 52, color: NAVY })]
  }),
  spacer(), spacer(),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "Concord. (콩코드)", bold: true, size: 36, color: BLUE })]
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "1:1 맞춤 과외 매칭·학습 관리 플랫폼", size: 26, color: "555555" })]
  }),
  new Paragraph({ spacing: { before: 1200, after: 0 }, children: [] }),
  makeTable([4320, 4320], [
    tableRow([["대표자", 4320], ["김 〇 〇", 4320]]),
    tableRow([["창업 형태", 4320], ["1인 예비창업", 4320]]),
    tableRow([["제출일", 4320], ["2026년 06월", 4320]]),
  ]),
  pageBreak()
];

// ─── 1. 아이템 개요 ───────────────────────────────────────────────────────────
const sec1 = [
  h1("1. 창업 아이템 개요"),
  h2("1-1. 아이템 명칭 및 한 줄 설명"),
  makeTable([2800, 6160], [
    tableRow([["항목", 2800], ["내용", 6160]], true),
    tableRow([["서비스명", 2800], ["Concord. (콩코드)", 6160]]),
    tableRow([["부제", 2800], ["1:1 맞춤 과외 매칭·학습 관리 플랫폼", 6160]]),
    tableRow([["서비스 형태", 2800], ["웹 플랫폼 (모바일 반응형)", 6160]]),
    tableRow([["타겟 사용자", 2800], ["학부모·학생 (초·중·고·N수), 과외 선생님", 6160]]),
    tableRow([["서비스 지역", 2800], ["서울·경기 (초기), 전국 확장 예정", 6160]]),
  ]),
  spacer(),
  h2("1-2. 창업 배경 및 동기"),
  body("대한민국 사교육 시장은 연간 약 26조 원 규모로 성장하고 있으나, 그 중심인 과외 시장은 심각한 정보 비대칭 문제를 안고 있습니다. 학부모는 과외 선생님의 실력과 신뢰도를 검증할 수단이 없고, 선생님은 양질의 학생을 구하기 어려운 구조적 불균형이 존재합니다."),
  spacer(),
  body("창업자는 대학 재학 중 학원 강사 및 과외 교사로 활동하며 이 문제를 직접 경험했습니다. 중개 플랫폼을 통해 학생을 구하더라도 선생님 검증 시스템이 없어 학부모의 불신이 높고, 반대로 선생님 입장에서는 과도한 중개 수수료와 불안정한 수요가 지속되었습니다."),
  spacer(),
  body("이를 해결하기 위해, 선생님을 직접 면접·검증하고 전담 매니저가 학생-선생님 매칭을 책임지는 '로펌형 과외 플랫폼' Concord를 구상하게 되었습니다. 단순 중개가 아니라, 로펌이 변호사를 배정하듯 학생에게 최적화된 선생님을 배정하는 구조입니다."),
  spacer(),
];

// ─── 2. 시장 분석 ─────────────────────────────────────────────────────────────
const sec2 = [
  h1("2. 시장 분석 및 문제 인식"),
  h2("2-1. 시장 규모 (TAM / SAM / SOM)"),
  makeTable([2000, 3500, 3460], [
    tableRow([["구분", 2000], ["규모", 3500], ["근거", 3460]], true),
    tableRow([["TAM", 2000], ["~26조 원", 3500], ["국내 전체 사교육 시장 (통계청 2023)", 3460]]),
    tableRow([["SAM", 2000], ["~4.5조 원", 3500], ["1:1 과외 시장 추정 (사교육비 조사)", 3460]]),
    tableRow([["SOM", 2000], ["~450억 원", 3500], ["서울·경기 프리미엄 과외 10% 점유 목표", 3460]]),
  ]),
  spacer(),
  h2("2-2. 핵심 문제 (Pain Point)"),
  body("【 학부모·학생 측 】", { bold: true }),
  bullet("선생님의 실력·신뢰도를 사전에 검증할 방법 없음"),
  bullet("과외 매칭 후 선생님 교체 시 처음부터 재탐색해야 하는 불편"),
  bullet("학습 진도·숙제 이행 여부를 실시간으로 확인할 수단 부재"),
  spacer(),
  body("【 선생님 측 】", { bold: true }),
  bullet("높은 플랫폼 수수료 (일부 30% 이상) 대비 낮은 수입 보장"),
  bullet("학생 수요 불안정, 지속적 자기 홍보 부담"),
  bullet("교육 퀄리티와 무관하게 외모·스펙 위주 선택 받는 구조"),
  spacer(),
  h2("2-3. 경쟁사 분석"),
  makeTable([2000, 2320, 2320, 2320], [
    tableRow([["구분", 2000], ["김과외·수퍼매쓰", 2320], ["학원·교습소", 2320], ["Concord", 2320]], true),
    tableRow([["선생님 검증", 2000], ["플랫폼 미검증", 2320], ["기관 자체 기준", 2320], ["직접 면접·승인", 2320]]),
    tableRow([["매칭 방식", 2000], ["학부모 직접 선택", 2320], ["일괄 배정", 2320], ["매니저 1:1 배정", 2320]]),
    tableRow([["학습 관리", 2000], ["없음", 2320], ["제한적", 2320], ["일별 플랜+AI 답변", 2320]]),
    tableRow([["수수료 구조", 2000], ["학생·선생 양쪽", 2320], ["수강료 전액", 2320], ["차액 수익 구조", 2320]]),
  ]),
  spacer(),
];

// ─── 3. 솔루션 ────────────────────────────────────────────────────────────────
const sec3 = [
  h1("3. 솔루션 및 차별성"),
  h2("3-1. 핵심 솔루션"),
  body("Concord는 세 가지 핵심 요소로 과외 시장의 비대칭 문제를 해결합니다."),
  spacer(),
  makeTable([2500, 6460], [
    tableRow([["핵심 요소", 2500], ["내용", 6460]], true),
    tableRow([["① 선생님 직접 검증", 2500], ["서류 심사 + 면접으로 합격한 선생님만 플랫폼에 등록. 학부모는 검증된 선생님만 만남.", 6460]]),
    tableRow([["② 전담 매니저 배정", 2500], ["학생 상담 → 매니저가 학생 특성·목표에 맞는 선생님 직접 배정. '로펌형 배정 구조'", 6460]]),
    tableRow([["③ 학습 관리 플랫폼", 2500], ["일별 학습 플랜, 질문·답변(AI + 선생님), 학습 이력 관리. 학부모가 진도를 실시간 확인.", 6460]]),
  ]),
  spacer(),
  h2("3-2. 서비스 플로우"),
  body("① 학부모·학생이 상담 신청 → ② 매니저가 학생 목표·과목·일정 상담 → ③ 검증된 선생님 풀에서 최적 매칭 → ④ 결제(선불, PG사) → ⑤ 수업 시작 + 학습 플랫폼 이용 → ⑥ 매니저 지속 모니터링"),
  spacer(),
  h2("3-3. 기술 차별성"),
  bullet("Next.js 14 App Router 기반 SSR·캐싱 → 빠른 공개 페이지 로딩"),
  bullet("Anthropic Claude API 연동 AI 답변 → 선생님 부재 시 즉시 학습 지원"),
  bullet("캘린더 기반 DnD 학습 플랜 → 직관적 일정 관리"),
  bullet("토스페이먼츠 PG 연동, 선불 결제 + 말일 정산 → 투명한 수익 구조"),
  bullet("역할별(학생/선생/매니저/관리자) 분리 포털 → 운영 효율 극대화"),
  spacer(),
];

// ─── 4. 비즈니스 모델 ─────────────────────────────────────────────────────────
const sec4 = [
  h1("4. 비즈니스 모델"),
  h2("4-1. 수익 구조"),
  body("플랫폼이 직접 수업료를 수취하고, 강사 정산액과의 차액이 플랫폼 매출로 계상됩니다. (부가세 적정 처리)"),
  spacer(),
  makeTable([2200, 2200, 2200, 2360], [
    tableRow([["플랜", 2200], ["월 수업료", 2200], ["강사 지급", 2200], ["플랫폼 차액", 2360]], true),
    tableRow([["월 4회 × 2시간 (초·중)", 2200], ["380,000원", 2200], ["240,000원", 2200], ["140,000원 (37%)", 2360]]),
    tableRow([["월 4회 × 3시간 (초·중)", 2200], ["550,000원", 2200], ["360,000원", 2200], ["190,000원 (35%)", 2360]]),
    tableRow([["월 8회 × 2시간 (초·중)", 2200], ["740,000원", 2200], ["480,000원", 2200], ["260,000원 (35%)", 2360]]),
    tableRow([["고등 (각 플랜 +4만원)", 2200], ["+40,000원", 2200], ["동일", 2200], ["+40,000원", 2360]]),
  ]),
  spacer(),
  h2("4-2. 강사 정산 구조"),
  makeTable([3000, 2880, 3080], [
    tableRow([["구분", 3000], ["시급", 2880], ["조건", 3080]], true),
    tableRow([["기본", 3000], ["30,000원/시간", 2880], ["매칭 후 3개월 미만", 3080]]),
    tableRow([["유지 보너스", 3000], ["32,000원/시간", 2880], ["동일 학생 3개월 이상 수업", 3080]]),
    tableRow([["Pro 선생님", 3000], ["34,000원/시간", 2880], ["6개월 이상 + Pro 직급 승격", 3080]]),
  ]),
  body("결제: 학부모 선불 → PG사(토스페이먼츠) → 강사 말일 일괄 정산", { color: "666666" }),
  spacer(),
  h2("4-3. 단위 경제학 (초기 목표 기준)"),
  makeTable([3960, 5000], [
    tableRow([["항목", 3960], ["값", 5000]], true),
    tableRow([["목표: 강사 20명 / 학생 50명", 3960], ["서울·경기 초기 운영", 5000]]),
    tableRow([["학생 1인 평균 월 기여 마진", 3960], ["약 140,000~190,000원", 5000]]),
    tableRow([["목표 월 매출 (50명 기준)", 3960], ["약 7,000,000~9,500,000원", 5000]]),
    tableRow([["손익분기 추정", 3960], ["학생 약 25~30명 (고정비 최소화 시)", 5000]]),
  ]),
  spacer(),
];

// ─── 5. 마케팅 전략 ───────────────────────────────────────────────────────────
const sec5 = [
  h1("5. 목표 시장 및 마케팅 전략"),
  h2("5-1. 타겟 고객"),
  makeTable([2500, 6460], [
    tableRow([["세그먼트", 2500], ["특성", 6460]], true),
    tableRow([["1차 (핵심)", 2500], ["서울·경기 초·중·고 자녀를 둔 30~50대 학부모. 검증된 선생님과 지속 관리를 원하는 층", 6460]]),
    tableRow([["2차", 2500], ["N수생 본인 직접 신청. 특정 과목 집중 강사 필요", 6460]]),
    tableRow([["공급자", 2500], ["대학(원)생, 교직 경력자. 안정적 수입과 플랫폼 지원 원하는 선생님", 6460]]),
  ]),
  spacer(),
  h2("5-2. 초기 고객 확보 전략 (0→1)"),
  bullet("선생님 선(先) 확보: 대학교 온라인 커뮤니티(에브리타임 등) 통해 검증 선생님 모집"),
  bullet("학부모 네트워크 활용: 초기 베타 사용자 지인 기반, SNS 바이럴"),
  bullet("콘텐츠 마케팅: '검증된 선생님 고르는 법', '과외 학습 관리법' 블로그·숏폼"),
  bullet("지역 맘카페·커뮤니티: 서울·경기 주요 맘카페 타겟 광고"),
  spacer(),
  h2("5-3. 성장 전략"),
  bullet("론칭 후 3개월: 학생 20명, 선생님 10명 목표 → 운영 피드백 집중"),
  bullet("6개월: 학생 50명, 선생님 20명 → 서울·경기 안정화"),
  bullet("1년: 매칭 알고리즘 고도화, 학습 리포트 자동화, 타 지역 확장"),
  spacer(),
];

// ─── 6. 개발 계획 ─────────────────────────────────────────────────────────────
const sec6 = [
  h1("6. 기술 개발 계획"),
  h2("6-1. 현재 개발 현황"),
  body("창업자 단독으로 풀스택 개발 완료. 주요 기능은 실서비스 배포 가능 수준."),
  spacer(),
  makeTable([3000, 2000, 3960], [
    tableRow([["기능 영역", 3000], ["상태", 2000], ["비고", 3960]], true),
    tableRow([["마케팅 홈·요금제·강사진·FAQ·후기", 3000], ["✅ 완료", 2000], ["CMS 연동, 실시간 편집 가능", 3960]]),
    tableRow([["회원가입·로그인 (학생/선생)", 3000], ["✅ 완료", 2000], ["이메일·전화번호 인증", 3960]]),
    tableRow([["결제 (토스페이먼츠 위젯)", 3000], ["✅ 완료", 2000], ["서버 검증 고도화 예정", 3960]]),
    tableRow([["학생 학습 플래너·질문·AI 답변", 3000], ["✅ 완료", 2000], ["Claude API 연동", 3960]]),
    tableRow([["선생님·매니저 포털", 3000], ["✅ 완료", 2000], ["플랜 코멘트, 매칭 관리", 3960]]),
    tableRow([["관리자 CMS·통계·매칭", 3000], ["✅ 완료", 2000], ["풀 CRUD", 3960]]),
    tableRow([["실결제 서버 검증·정산", 3000], ["🔧 진행중", 2000], ["토스 시크릿 키 연동", 3960]]),
    tableRow([["SMS·이메일 알림", 3000], ["❌ 미구현", 2000], ["로드맵 2분기", 3960]]),
    tableRow([["자동 선생님 추천 알고리즘", 3000], ["❌ 미구현", 2000], ["로드맵 3~4분기", 3960]]),
  ]),
  spacer(),
  h2("6-2. 기술 스택"),
  makeTable([2500, 6460], [
    tableRow([["영역", 2500], ["기술", 6460]], true),
    tableRow([["Frontend", 2500], ["Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS", 6460]]),
    tableRow([["Backend", 2500], ["Next.js API Routes, Prisma ORM 5.x, PostgreSQL (Supabase)", 6460]]),
    tableRow([["인증", 2500], ["NextAuth v5 JWT, bcrypt", 6460]]),
    tableRow([["결제", 2500], ["토스페이먼츠 결제 위젯", 6460]]),
    tableRow([["AI", 2500], ["Anthropic Claude API (claude-sonnet)", 6460]]),
    tableRow([["스토리지", 2500], ["Supabase Storage (프로필·서류 업로드)", 6460]]),
    tableRow([["배포", 2500], ["Vercel (Edge + Cron), GitHub Actions", 6460]]),
  ]),
  spacer(),
  h2("6-3. 개발 로드맵"),
  makeTable([1800, 2200, 4960], [
    tableRow([["시기", 1800], ["목표", 2200], ["주요 작업", 4960]], true),
    tableRow([["~2026 Q3", 1800], ["서비스 안정화", 2200], ["실결제 서버 검증, SMS 알림, 보안 점검, 베타 론칭", 4960]]),
    tableRow([["2026 Q4", 1800], ["사용자 확대", 2200], ["모바일 앱(PWA), 학습 리포트, 강사 리뷰 시스템", 4960]]),
    tableRow([["2027 Q1~Q2", 1800], ["AI 고도화", 2200], ["자동 매칭 알고리즘, 맞춤 학습 플랜 AI 생성", 4960]]),
    tableRow([["2027 Q3~", 1800], ["확장", 2200], ["타 지역·과목 확장, B2B(학원 SaaS) 검토", 4960]]),
  ]),
  spacer(),
];

// ─── 7. 팀 구성 ───────────────────────────────────────────────────────────────
const sec7 = [
  h1("7. 팀 구성 계획"),
  h2("7-1. 현재 팀"),
  makeTable([2500, 6460], [
    tableRow([["구분", 2500], ["내용", 6460]], true),
    tableRow([["대표자", 2500], ["김 〇 〇 (24년생)", 6460]]),
    tableRow([["최종학력", 2500], ["성균관대학교 (경영학)", 6460]]),
    tableRow([["역할", 2500], ["기획 · 개발(풀스택) · 운영 전담", 6460]]),
    tableRow([["현장 경험", 2500], ["학원 강사 및 개인 과외 교사 — 과외 시장 구조적 문제 직접 경험", 6460]]),
    tableRow([["개발 역량", 2500], ["Next.js, React, TypeScript, Prisma, PostgreSQL, Vercel 단독 구현", 6460]]),
  ]),
  spacer(),
  h2("7-2. 채용 계획 (지원금 활용)"),
  makeTable([1800, 2500, 4660], [
    tableRow([["시기", 1800], ["포지션", 2500], ["역할", 4660]], true),
    tableRow([["론칭 직후", 1800], ["학습 매니저 1~2명", 2500], ["학생 상담·선생님 배정·모니터링", 4660]]),
    tableRow([["6개월 후", 1800], ["마케팅 파트너", 2500], ["SNS·콘텐츠·커뮤니티 마케팅", 4660]]),
    tableRow([["1년 후", 1800], ["개발자 1명", 2500], ["알고리즘·앱 고도화", 4660]]),
  ]),
  spacer(),
];

// ─── 8. 재무 계획 ─────────────────────────────────────────────────────────────
const sec8 = [
  h1("8. 재무 계획"),
  h2("8-1. 3개년 매출 추정"),
  makeTable([2400, 2320, 2320, 1920], [
    tableRow([["항목", 2400], ["1차년도 (론칭)", 2320], ["2차년도", 2320], ["3차년도", 1920]], true),
    tableRow([["평균 활성 학생 수", 2400], ["20~50명", 2320], ["80~120명", 2320], ["200명+", 1920]]),
    tableRow([["월 평균 매출", 2400], ["350만~900만원", 2320], ["1,500만~2,200만원", 2320], ["4,000만원+", 1920]]),
    tableRow([["연간 매출", 2400], ["약 4,200만~1억원", 2320], ["약 1.8억~2.6억원", 2320], ["약 5억원+", 1920]]),
    tableRow([["영업이익률(추정)", 2400], ["흑자 전환 목표", 2320], ["15~25%", 2320], ["30%+", 1920]]),
  ]),
  spacer(),
  h2("8-2. 주요 비용 항목 (초기)"),
  makeTable([3960, 5000], [
    tableRow([["비용 항목", 3960], ["월 추정액", 5000]], true),
    tableRow([["강사 정산 (학생 50명 기준)", 3960], ["약 500만~750만원", 5000]]),
    tableRow([["서버·클라우드 (Vercel, Supabase)", 3960], ["약 10만~30만원", 5000]]),
    tableRow([["PG사 수수료 (약 2.2%)", 3960], ["매출 연동", 5000]]),
    tableRow([["마케팅·광고비", 3960], ["약 50만~100만원", 5000]]),
    tableRow([["매니저 인건비 (채용 후)", 3960], ["약 200만~250만원", 5000]]),
  ]),
  spacer(),
  h2("8-3. 지원금 사용 계획"),
  bullet("사업화 비용: 서비스 고도화(실결제 연동, 알림 시스템) — 약 30%"),
  bullet("마케팅·홍보: 온라인 광고, 콘텐츠 제작, 커뮤니티 마케팅 — 약 25%"),
  bullet("인건비: 학습 매니저 채용 — 약 30%"),
  bullet("운영 제반비용: 법인 설립, 회계·세무, 기타 — 약 15%"),
  spacer(),
];

// ─── 9. 사회적 가치 ───────────────────────────────────────────────────────────
const sec9 = [
  h1("9. 사회적 가치 및 기대 효과"),
  makeTable([2500, 6460], [
    tableRow([["가치", 2500], ["내용", 6460]], true),
    tableRow([["교육 접근성 향상", 2500], ["검증된 선생님 정보를 투명하게 공개해 정보 비대칭 해소. 양질의 교육 기회 확대.", 6460]]),
    tableRow([["교사 처우 개선", 2500], ["안정적 수입(시급 보장 + 장기 수업 인센티브)과 플랫폼 지원으로 교사의 교육 집중 환경 조성.", 6460]]),
    tableRow([["에듀테크 생태계 기여", 2500], ["AI 학습 지원·디지털 학습 관리를 통해 국내 에듀테크 혁신 기여.", 6460]]),
    tableRow([["일자리 창출", 2500], ["매니저·마케터 등 교육 서비스 분야 양질의 일자리 창출.", 6460]]),
  ]),
  spacer(),
];

// ─── DOCUMENT ─────────────────────────────────────────────────────────────────
const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: "Arial", size: 22, color: "222222" }
      }
    }
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 },
        margin: { top: 1440, right: 1260, bottom: 1440, left: 1260 }
      }
    },
    children: [
      ...cover,
      ...sec1,
      ...sec2,
      pageBreak(),
      ...sec3,
      ...sec4,
      pageBreak(),
      ...sec5,
      ...sec6,
      pageBreak(),
      ...sec7,
      ...sec8,
      ...sec9
    ]
  }]
});

// 현재 작업 디렉토리에 파일 생성하도록 경로 변경
const outputPath = path.join(process.cwd(), 'concord_bizplan.docx');

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(outputPath, buf);
  console.log(`성공적으로 파일이 생성되었습니다: ${outputPath}`);
}).catch(err => {
  console.error('파일 생성 실패:', err);
});