import { TutorsListing } from "@/components/tutors/TutorsListing";

export const dynamic = "force-static";

export const metadata = {
  title: "강사진",
};

export default function TutorsPage() {
  return <TutorsListing />;
}
