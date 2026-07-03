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
      <div className="flex min-h-screen items-center justify-center bg-background pt-14 text-sm text-text-muted">
        학습 플래너 불러오는 중…
      </div>
    ),
  },
);

export function StudentDashboardEntry(props: StudentDashboardProps) {
  return <StudentDashboardLazy {...props} />;
}
