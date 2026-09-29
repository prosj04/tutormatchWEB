"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

type StudentDashboardModule = typeof import("./StudentDashboard");
// Re-export so dashboard/page.tsx can use the full prop type (including learningGoals)
export type StudentDashboardProps = ComponentProps<StudentDashboardModule["StudentDashboard"]>;

const StudentDashboardLazy = dynamic(
  () => import("./StudentDashboard").then((mod) => mod.StudentDashboard),
  {
    loading: () => (
      <div className="portal-shell" style={{ display: "grid", placeItems: "center", paddingTop: "56px" }}>
        <p className="caption">학습 플래너 불러오는 중…</p>
      </div>
    ),
  },
);

export function StudentDashboardEntry(props: StudentDashboardProps) {
  return <StudentDashboardLazy {...props} />;
}
