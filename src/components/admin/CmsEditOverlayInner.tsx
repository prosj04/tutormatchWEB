"use client";

import { useSession } from "next-auth/react";
import type { MouseEvent, ReactNode } from "react";

import type { CmsEditType } from "./cms-edit-types";

type CmsEditOverlayProps = {
  section: string;
  cmsKey: string;
  type: CmsEditType;
  children: ReactNode;
  className?: string;
};

function OverlayIcon({ type }: { type: CmsEditType }) {
  if (type === "image") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="3" y="4" width="18" height="16" rx="1" />
        <circle cx="8.5" cy="9.5" r="1.5" />
        <path d="m4 17 5-5 4 4 3-3 4 4" />
      </svg>
    );
  }
  if (type === "spacing") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 4v16M12 4 8.5 7.5M12 4l3.5 3.5M12 20l-3.5-3.5M12 20l3.5-3.5" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
    </svg>
  );
}

export function CmsEditOverlay({
  section,
  cmsKey,
  type,
  children,
  className,
}: CmsEditOverlayProps) {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  if (!isAdmin) {
    return <>{children}</>;
  }

  function handleSelect(e: MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    window.parent.postMessage({ type: "cms_select", section, key: cmsKey }, "*");
  }

  return (
    <div className={`ad-ov ${className ?? ""}`}>
      {children}
      <button
        type="button"
        onClick={handleSelect}
        className="ad-ov-btn"
        aria-label={`CMS 편집: ${section}.${cmsKey}`}
      >
        <OverlayIcon type={type} />
      </button>
      <div className="ad-ov-ring" aria-hidden />
    </div>
  );
}
