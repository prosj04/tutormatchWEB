import { SiteHeader } from "@/components/landing/SiteHeader";

export default function TutorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <div className="min-h-screen bg-background pt-16">{children}</div>
    </>
  );
}
