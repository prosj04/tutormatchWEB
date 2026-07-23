/**
 * 후기(Testimonial) 시드 — 파일럿 전 플레이스홀더 후기
 * 실행: npm run seed:reviews
 *
 * 콘텐츠 원본은 scripts/reviews-content.json 한 곳에서 관리한다.
 * 기존 후기를 모두 지우고 JSON 내용으로 교체한다.
 * - 전부 대면(방문) 수업 전제, 말투는 서로 다른 사람이 쓴 것처럼 변주
 * - 설탭 실제 후기 톤 참고: 성적 변화 + 성향매칭 + 안전신뢰 비중
 */
import fs from "fs";
import path from "path";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type ReviewContent = {
  author: string;
  role: string;
  grade: string;
  subject: string;
  category: string;
  gradeFrom?: string;
  gradeTo?: string;
  months?: string;
  body: string;
};

// 홈 노출용(성적 변화가 뚜렷한 대표 후기 4건, 과목 분산: 수학·국어·물리·영어)
const HOME_AUTHORS = new Set(["박*진", "이*서", "윤*아", "김*현"]);

function loadReviews(): ReviewContent[] {
  const file = path.join(__dirname, "reviews-content.json");
  return JSON.parse(fs.readFileSync(file, "utf8")) as ReviewContent[];
}

function buildTags(r: ReviewContent): string | null {
  const parts = [`${r.grade} ${r.subject}`.trim(), r.months?.trim()].filter(
    (v): v is string => Boolean(v && v.length > 0),
  );
  return parts.length > 0 ? parts.join("\n") : null;
}

async function main() {
  const reviews = loadReviews();
  const existing = await prisma.testimonial.count();
  console.log(`기존 후기 ${existing}건을 삭제하고 ${reviews.length}건으로 교체합니다.`);

  await prisma.testimonial.deleteMany({});

  await prisma.testimonial.createMany({
    data: reviews.map((r, idx) => ({
      quote: r.body,
      author: `${r.author} · ${r.grade} ${r.subject} ${r.role}`,
      category: r.category,
      gradeFrom: r.gradeFrom && r.gradeFrom.length > 0 ? r.gradeFrom : null,
      gradeTo: r.gradeTo && r.gradeTo.length > 0 ? r.gradeTo : null,
      tags: buildTags(r),
      order: idx + 1,
      isActive: true,
      showOnHome: HOME_AUTHORS.has(r.author),
      showOnReviewsPage: true,
    })),
  });

  const total = await prisma.testimonial.count();
  const onHome = await prisma.testimonial.count({ where: { showOnHome: true } });
  const byCategory = await prisma.testimonial.groupBy({
    by: ["category"],
    _count: { _all: true },
  });
  console.log(`완료: 후기 ${total}건 (홈 노출 ${onHome}건).`);
  for (const c of byCategory) {
    console.log(`  · ${c.category ?? "(없음)"}: ${c._count._all}건`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
