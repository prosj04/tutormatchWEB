# Concord 프론트엔드 재구축 명세 (FRONTEND BUILD SPEC) — v2, 대체됨

> **⚠️ 이 파일은 포인터 스텁이다. 그리고 원본이 가리키는 명세는 현행이 아니다.**

## 현행을 찾는다면

디자인 시스템은 2026-09-30 [ADR 0002](adr/0002-editorial-redesign.md) 로 **v3 "Editorial"** 로 교체됐다.

- 사양 정본 → [`design/DESIGN_SYSTEM_V3.md`](design/DESIGN_SYSTEM_V3.md)
- 구현 정본 → `src/app/ds.css`
- 디자인 문서 지도 → [`design/README.md`](design/README.md)
- 규칙 → [`BUSINESS_DIRECTION.md`](BUSINESS_DIRECTION.md) §7·§13

## 이 스텁의 원본 (v2 이력)

원본은 v2 핸드오프 패키지의 일부였고, 패키지 전량이 [`archive/design-handoff-v2/`](archive/design-handoff-v2/) 로 이동했다.

| 문서 | 현재 경로 |
|---|---|
| 프론트엔드 재구축 명세 (원본) | [`archive/design-handoff-v2/FRONTEND_BUILD_SPEC.md`](archive/design-handoff-v2/FRONTEND_BUILD_SPEC.md) |
| 구현 계약 | [`archive/design-handoff-v2/IMPLEMENTATION_CONTRACT.md`](archive/design-handoff-v2/IMPLEMENTATION_CONTRACT.md) |
| 시안 ↔ 라우트 매핑 | [`archive/design-handoff-v2/ROUTE_MAP.md`](archive/design-handoff-v2/ROUTE_MAP.md) |
| v2 토큰·타이포 | [`archive/design-handoff-v2/DESIGN_SYSTEM.md`](archive/design-handoff-v2/DESIGN_SYSTEM.md) |

## 왜 스텁이 남아 있는가

2026-07-10~11 에 `docs/` 와 `design handoff/` 양쪽에 바이트 단위 동일한 사본이 존재했다. 한쪽만 수정되면 어긋나므로 07-12 문서 정비에서 `design handoff/` 쪽을 원본으로 확정하고 이 파일을 스텁으로 교체했다(교체 시점에 두 파일이 완전 동일함을 diff 로 확인 — 내용 손실 없음).

이 경로를 가리키는 문서가 여럿 있어(`30-제품·디자인.md`, `chapters/제품.md`) 2026-09-30 정리에서도 파일을 없애지 않고 v3 안내판으로 다시 썼다.
