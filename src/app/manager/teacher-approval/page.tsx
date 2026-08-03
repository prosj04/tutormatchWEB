import { ManagerApprovalPage } from "@/components/teacher-portal/ManagerApprovalPage";

/**
 * 구 경로 — 미들웨어가 MANAGER를 /teacher-portal로 가두므로 실제 도달 가능한 것은
 * ADMIN·CHIEF_MANAGER뿐이다. 화면을 따로 두면 승인/반려 로직이 두 벌로 갈라지므로
 * 포털의 단일 구현을 그대로 렌더한다.
 */
export default function ManagerTeacherApprovalRoute() {
  return <ManagerApprovalPage />;
}
