import "./tutors.css";

import { FeaturedTutors } from "@/components/tutors/FeaturedTutors";
import { startPerfTimer } from "@/lib/perf-timer";
import { getGroupedSiteContentBySections } from "@/lib/site-content";

export const metadata = {
  title: "선생님",
};

export const revalidate = 300;

type SearchParams = { cms_edit?: string | string[] };

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function TutorsPage({ searchParams }: { searchParams?: SearchParams }) {
  const timer = startPerfTimer("page.tutors.total");
  const isEditMode = first(searchParams?.cms_edit) === "1";
  const siteContent = await getGroupedSiteContentBySections(["tutors_featured", "tutors_proof", "safety_story", "spacing"]);

  const page = <FeaturedTutors siteContent={siteContent} isEditMode={isEditMode} />;
  timer.end();
  return page;
}
