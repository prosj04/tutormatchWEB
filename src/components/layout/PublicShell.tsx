import { SiteHeader } from "@/components/landing/SiteHeader";

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader variant="light" />
      <div className="min-h-screen bg-background pt-16 md:pt-[100px]">{children}</div>
    </>
  );
}
