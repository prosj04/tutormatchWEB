"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

import type { CmsEditType } from "./cms-edit-types";

const CmsEditOverlay = dynamic(
  () => import("./CmsEditOverlayInner").then((mod) => mod.CmsEditOverlay),
  { ssr: false },
);

type CmsEditProps = {
  active: boolean;
  section: string;
  cmsKey: string;
  type: CmsEditType;
  children: ReactNode;
  className?: string;
};

/** isEditMode=false이면 children만 반환 — CMS 편집 청크·세션 훅을 로드하지 않는다. */
export function CmsEdit({
  active,
  section,
  cmsKey,
  type,
  children,
  className,
}: CmsEditProps) {
  if (!active) {
    return <>{children}</>;
  }

  return (
    <CmsEditOverlay section={section} cmsKey={cmsKey} type={type} className={className}>
      {children}
    </CmsEditOverlay>
  );
}
