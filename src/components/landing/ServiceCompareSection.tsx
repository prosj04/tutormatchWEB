import {
  buildVisibleCompareRows,
  getCompareTableTitle,
} from "@/lib/compare-cms";

function isNegativeMark(value: string) {
  return value.trim() === "✗";
}

function isPositiveMark(value: string) {
  return value.trim().startsWith("✓");
}

type ServiceCompareSectionProps = {
  siteContent?: Record<string, Record<string, string>>;
  kicker?: string;
};

export function ServiceCompareSection({ siteContent, kicker = "COMPARE" }: ServiceCompareSectionProps) {
  const rows = buildVisibleCompareRows(siteContent);
  const tableTitle = getCompareTableTitle(siteContent);

  if (rows.length === 0) return null;

  return (
    <section id="compare" className="scroll-mt-[7.25rem] bg-neutral-10 py-20 md:scroll-mt-[9.75rem] md:py-28">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-5">
        <p className="text-sm font-black uppercase tracking-wider text-primary">{kicker}</p>
        <h2 className="mt-3 text-[clamp(2rem,4vw,3.5rem)] font-black tracking-[-0.03em] text-neutral-100">
          {tableTitle}
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
              {rows.map((row) => (
                <tr key={row.feature}>
                  <th
                    scope="row"
                    className="px-4 py-4 text-sm font-bold text-neutral-100 sm:px-6 sm:py-5 md:px-8 md:text-base"
                  >
                    {row.feature}
                  </th>
                  <td
                    className={`px-4 py-4 text-sm font-medium sm:px-6 sm:py-5 md:px-8 md:text-base ${
                      isNegativeMark(row.other) ? "text-neutral-40" : "text-neutral-50"
                    }`}
                  >
                    {row.other}
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
