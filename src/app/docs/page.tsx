import { ConcordPageHead } from "@/components/concord/ConcordPageHead";
import { DocsLibrary } from "@/components/docs/DocsLibrary";

export const metadata = {
  title: "자료실",
  robots: { index: false, follow: false },
};

export default function DocsPage() {
  return (
    <main>
      <ConcordPageHead
        eyebrow="Documents"
        title="자료실"
        description="Concord 제안·전략·IR·브랜드 문서를 웹에서 바로 열람합니다. (내부 검토용 임시 페이지)"
      />
      <DocsLibrary />
    </main>
  );
}
