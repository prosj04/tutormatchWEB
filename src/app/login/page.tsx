import { Suspense } from "react";

import { getGroupedSiteContentBySections } from "@/lib/site-content";

import { LoginForm } from "./LoginForm";

function LoginFallback() {
  return (
    <div className="pb-24 md:pb-32">
      <div className="border-b border-gray-100 bg-background py-12 md:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 md:px-8">
          <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
          <div className="mt-4 h-12 w-48 animate-pulse rounded bg-gray-200" />
        </div>
      </div>
      <div className="mx-auto max-w-md px-4 py-10 sm:px-6 md:px-8">
        <div className="h-64 animate-pulse rounded-2xl bg-gray-100" />
      </div>
    </div>
  );
}

export default async function LoginPage() {
  const siteContent = await getGroupedSiteContentBySections(["login_page"]);
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm siteContent={siteContent} />
    </Suspense>
  );
}
