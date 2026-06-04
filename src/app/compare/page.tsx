import { PublicShell } from "@/components/layout/PublicShell";
import { ComparePageContent } from "@/components/landing/ComparePageContent";

export const revalidate = 300;

export const metadata = {
  title: "개인 과외 비교",
};

export default function ComparePage() {
  return (
    <PublicShell>
      <ComparePageContent />
    </PublicShell>
  );
}
