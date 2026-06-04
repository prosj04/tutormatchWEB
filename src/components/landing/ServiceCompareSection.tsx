const COMPARISON_ROWS = [
  {
    item: "선생님 자격 검증",
    privateTutoring: "✗",
    concord: "✓ 서류·면접",
  },
  {
    item: "선생님 실력 확인",
    privateTutoring: "수업 후에야 파악",
    concord: "✓ 사전 검증",
  },
  {
    item: "학생 맞춤 매칭",
    privateTutoring: "직접 알아봐야 함",
    concord: "✓ 매니저가 성향·과목 맞춰 연결",
  },
  {
    item: "선생님 교체 리스크",
    privateTutoring: "맞지 않으면 1~2달 낭비",
    concord: "✓ 처음부터 핏 맞는 선생님",
  },
  {
    item: "학생 관리",
    privateTutoring: "선생님 개인 역량 의존",
    concord: "✓ 관리 매뉴얼 기반",
  },
  {
    item: "매일 학습 점검",
    privateTutoring: "✗",
    concord: "✓ 일별 플랜",
  },
  {
    item: "질문 답변",
    privateTutoring: "수업 시간에만",
    concord: "✓ 상시 (강사·AI)",
  },
  {
    item: "문제 발생 대응",
    privateTutoring: "학부모가 직접 해결",
    concord: "✓ 전담 매니저 조율",
  },
  {
    item: "학습 기록 공유",
    privateTutoring: "✗",
    concord: "✓ 플랜·기록 공유",
  },
] as const;

function isNegativeMark(value: string) {
  return value.trim() === "✗";
}

function isPositiveMark(value: string) {
  return value.trim().startsWith("✓");
}

export function ServiceCompareSection() {
  return (
    <section id="compare" className="scroll-mt-[7.25rem] bg-neutral-10 py-20 md:scroll-mt-[9.75rem] md:py-28">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-5">
        <p className="text-sm font-black uppercase tracking-wider text-primary">COMPARE</p>
        <h2 className="mt-3 text-[clamp(2rem,4vw,3.5rem)] font-black tracking-[-0.03em] text-neutral-100">
          서비스 비교
        </h2>
      </div>
      <div className="mx-auto mt-8 max-w-[1200px] px-4 sm:px-5">
        <div className="overflow-x-auto rounded-[28px] border border-neutral-20 bg-white shadow-sm">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr className="border-b border-neutral-20 bg-neutral-10">
                <th
                  scope="col"
                  className="px-4 py-4 text-sm font-black text-neutral-100 sm:px-6 sm:py-5 md:px-8"
                >
                  비교 항목
                </th>
                <th
                  scope="col"
                  className="px-4 py-4 text-sm font-black text-neutral-50 sm:px-6 sm:py-5 md:px-8"
                >
                  개인 과외
                </th>
                <th
                  scope="col"
                  className="px-4 py-4 text-sm font-black text-primary sm:px-6 sm:py-5 md:px-8"
                >
                  Concord
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-20">
              {COMPARISON_ROWS.map((row) => (
                <tr key={row.item}>
                  <th
                    scope="row"
                    className="px-4 py-4 text-sm font-bold text-neutral-100 sm:px-6 sm:py-5 md:px-8 md:text-base"
                  >
                    {row.item}
                  </th>
                  <td
                    className={`px-4 py-4 text-sm font-medium sm:px-6 sm:py-5 md:px-8 md:text-base ${
                      isNegativeMark(row.privateTutoring)
                        ? "text-neutral-40"
                        : "text-neutral-50"
                    }`}
                  >
                    {row.privateTutoring}
                  </td>
                  <td
                    className={`px-4 py-4 text-sm font-medium sm:px-6 sm:py-5 md:px-8 md:text-base ${
                      isPositiveMark(row.concord) ? "font-bold text-primary" : "text-neutral-100"
                    }`}
                  >
                    {row.concord}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
