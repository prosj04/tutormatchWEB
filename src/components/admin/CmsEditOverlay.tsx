"use client";

import { useSession } from "next-auth/react";
import type { ReactNode } from "react";

export type CmsEditType = "text" | "image" | "spacing";

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
      <svg viewBox="0 0 20 20" fill="currentColor" className="size-3.5" aria-hidden>
        <path
          fillRule="evenodd"
          d="M1 5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H3a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l2 2a1 1 0 01-.083.094L8.5 10.207l1.146-1.147a1 1 0 011.414 0l3.146 3.147A1 1 0 0014.5 12H6a1 1 0 00-.707.293l-2 2a1 1 0 01-1.414-1.414l1.879-1.879L1 5.414V5z"
          clipRule="evenodd"
        />
      </svg>
    );
  }
  if (type === "spacing") {
    return <span className="text-[10px] font-black leading-none">↕</span>;
  }
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="size-3.5" aria-hidden>
      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
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

  function handleSelect() {
    window.parent.postMessage({ type: "cms_select", section, key: cmsKey }, "*");
  }

  return (
    <div className={`group relative ${className ?? ""}`}>
      {children}
      <button
        type="button"
        onClick={handleSelect}
        className="absolute right-1 top-1 z-20 flex size-7 items-center justify-center rounded-lg border border-primary/30 bg-white text-primary opacity-0 shadow-sm transition group-hover:opacity-100 hover:bg-primary hover:text-white"
        aria-label={`CMS 편집: ${section}.${cmsKey}`}
      >
        <OverlayIcon type={type} />
      </button>
      <div
        className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] ring-2 ring-primary opacity-0 transition group-hover:opacity-100"
        aria-hidden
      />
    </div>
  );
}

type CmsEditProps = {
  active: boolean;
  section: string;
  cmsKey: string;
  type: CmsEditType;
  children: ReactNode;
  className?: string;
};

/** isEditMode=false이면 children만 반환 (추가 DOM 없음) */
export function CmsEdit({ active, section, cmsKey, type, children, className }: CmsEditProps) {
  if (!active) {
    return <>{children}</>;
  }

  return (
    <CmsEditOverlay section={section} cmsKey={cmsKey} type={type} className={className}>
      {children}
    </CmsEditOverlay>
  );
}
