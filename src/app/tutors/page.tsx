import { TutorsListing } from "@/components/tutors/TutorsListing";
import { startPerfTimer } from "@/lib/perf-timer";
import { getGroupedSiteContentBySections } from "@/lib/site-content";

export const metadata = {
  title: "선생님",
};

export const revalidate = 300;

export default async function TutorsPage() {
  const timer = startPerfTimer("page.tutors.total");
  const siteContent = await getGroupedSiteContentBySections(["tutors_featured", "tutors_proof", "safety_story", "spacing"]);

  const page = <TutorsListing siteContent={siteContent} />;
  timer.end();
  return page;
}
