# 앱 흐름 설계 및 Claude Code 오케스트레이션 운영 계획

> **For Hermes:** 사용자 관점 앱 흐름을 먼저 확정하고, 이후 Claude Code에는 작고 검증 가능한 단위로 구현 지시한다.

**Goal:** Concord/premium-tutoring 프로젝트의 웹·모바일 사용자 흐름을 실제 코드와 디자인 핸드오프 기준으로 정리하고, 사용자 확인을 거쳐 Claude Code가 안전하게 구현하도록 운영한다.

**Architecture:** Next.js 14 웹/API + Prisma/PostgreSQL 백엔드와 Expo Router 모바일 앱이 공존한다. 학생 여정 단계(`ONBOARDED → WAITING → ASSIGNED → MATCHING → ACTIVE`)는 `src/lib/student-journey.ts`와 모바일 `mobile/lib/student-journey.ts`의 공통 개념을 기준으로 삼고, 화면 구현은 `design handoff/IMPLEMENTATION_CONTRACT.md`의 디자인 계약을 준수한다.

**Tech Stack:** Next.js 14, TypeScript, Prisma 5, NextAuth beta, Expo SDK 56, React Native 0.85, Expo Router, React Native SVG, Supabase, Toss Payments.

---

## 1. 현재 파악한 프로젝트 상태

### 핵심 구조
- 웹/백엔드: `src/app`, `src/components`, `src/lib`, `prisma/schema.prisma`
- 모바일 앱: `mobile/app`, `mobile/components`, `mobile/lib`, `mobile/theme`, `mobile/styles`
- 디자인/기획 핸드오프: `design handoff/USER_FLOW.md`, `design handoff/MOBILE_HANDOFF.md`, `design handoff/IMPLEMENTATION_CONTRACT.md`, `design handoff/QA_CHECKLIST.md`
- 프로젝트 규칙: `AGENTS.md`, `CLAUDE.md`, `mobile/AGENTS.md`

### 현재 git 상태 주의
- 현재 브랜치: `main`
- 수정/미추적 파일이 이미 다수 존재한다.
- 따라서 Claude Code에게 작업을 시킬 때는 반드시 “기존 변경을 보존하고, 지정 파일 외 수정 금지”를 프롬프트에 넣는다.
- 커밋/푸시는 사용자가 명시적으로 요청하기 전까지 하지 않는다.

### 앱 흐름 기준 문서
- `design handoff/USER_FLOW.md`는 학생 웹/모바일, 선생님, 매니저, 관리자 흐름을 이미 큰 틀에서 정의한다.
- `design handoff/QA_CHECKLIST.md`는 릴리스 전 수동 QA 기준으로 쓸 수 있다.
- `design handoff/IMPLEMENTATION_CONTRACT.md`는 디자인 구현 시 최우선 계약이다. 특히 CSS/토큰/마크업을 재작성하지 말고 원본 디자인 시스템을 재사용해야 한다.

---

## 2. 역할 분담

### Jae
- 비즈니스/사용자 경험 최종 결정자.
- 우선순위, 실제 서비스 정책, 예외 케이스 결정을 담당.
- 화면 흐름/문구/CTA가 사용자 입장에서 맞는지 승인.

### Hermes
- CTO/PM/아키텍트 역할.
- 코드베이스를 읽고 현재 구현과 기획 문서의 차이를 식별.
- 사용자 흐름을 먼저 설계·검증한 뒤 Claude Code 작업 단위로 분해.
- Claude Code 실행 전후로 요구사항 준수 여부와 품질 게이트를 확인.
- 필요하면 문서/QA 체크리스트를 갱신.

### Claude Code
- 구현 엔지니어.
- Hermes가 제공한 작은 작업 지시만 수행.
- 기존 아키텍처, `AGENTS.md`, `CLAUDE.md`, `mobile/AGENTS.md`, 디자인 계약을 준수.
- 구현 후 lint/build/typecheck 등 지정 검증을 실행하고 결과를 보고.

---

## 3. 전체 작업 방식

### Phase 0 — 기준선 고정
1. `git status --short`로 사용자 기존 변경 확인.
2. `README.md`, `AGENTS.md`, `CLAUDE.md`, `mobile/AGENTS.md`, `package.json`, `mobile/package.json` 확인.
3. `design handoff` 문서와 실제 코드 라우트를 대조.
4. 현재 변경 파일을 건드리지 않아야 하는지 사용자에게 확인.

산출물:
- 현재 기능 지도
- 라우트 지도
- “건드려도 되는 파일/안 되는 파일” 목록

### Phase 1 — 사용자 관점 앱 흐름 설계
사용자 역할별로 “첫 진입 → 핵심 행동 → 성공/실패/빈 상태 → 재방문”을 설계한다.

우선순위:
1. 학생 모바일 앱: 가장 직접적인 사용자 경험
2. 학생 웹: 랜딩, 상담, 대시보드, 결제
3. 매니저/선생님 웹: 상담·매칭 운영
4. 관리자 웹: CMS/퍼널/데이터 관리

학생 모바일 핵심 흐름:
- 미로그인: 앱 실행 → 온보딩 → 회원가입/로그인
- 상담 전: 홈/상태에서 무료 상담 신청 유도
- 상담 접수: `/consult/done` → `/consult/status`
- 매니저 배정: 상태 화면에서 담당자·다음 행동 안내
- 선생님 매칭: `/consult/match`에서 추천 선생님 확인
- 활성 수강생: 홈/학습/Q&A/My 중심 4탭 사용
- 예외: API 오류, 빈 데이터, 토큰 소진, 선생님 미배정, 구독 없음

사용자 확인 포인트:
- 비구독 상태에서 홈을 보여줄지, 상담 상태로 강제 보낼지
- `MATCHING` 단계에서 추천 선생님이 없을 때 보여줄 문구/CTA
- 앱 결제는 외부 결제로 갈지, 앱스토어 IAP 정책 검토 후 보류할지
- “학생” 단독 제품인지, 학부모 계정/마이페이지를 넣을지

산출물:
- 사용자별 플로우 다이어그램
- 라우트별 목적/입력/출력/CTA 표
- 상태별 UX 정책표

### Phase 2 — 코드와 흐름의 차이 분석
1. `design handoff/USER_FLOW.md`의 라우트/API 목록과 실제 `src/app/api/mobile/**`, `mobile/app/**`를 대조한다.
2. `src/lib/student-journey.ts`와 `mobile/lib/student-journey.ts`의 중복/불일치를 점검한다.
3. `mobile/app/index.tsx`, `mobile/hooks/useAuth.ts`, `mobile/lib/journey-redirect.ts`의 진입/리다이렉트 정책을 점검한다.
4. 각 탭 화면의 API 오류/빈 상태/로딩 상태가 `QA_CHECKLIST.md` 기준에 맞는지 확인한다.
5. 디자인 계약 위반 가능성: 임의 색상/px/새 아이콘/폰트 대체 여부를 점검한다.

산출물:
- Gap 리스트: `severity`, `사용자 영향`, `관련 파일`, `권장 수정`
- 빠른 수정 / 설계 확인 필요 / 나중 과제 분류

### Phase 3 — 우선순위 결정
추천 우선순위는 다음 순서다.

P0: 사용자 진입이 막히는 문제
- 로그인 후 잘못된 라우트
- JWT/API 인증 오류
- 앱 cold start 무한 로딩
- 상담 상태 이동 실패

P1: 핵심 전환 흐름 문제
- 상담 신청 → 접수 완료 → 상태 확인
- 매칭 → 선생님 프로필/구독 유도
- 홈/학습/Q&A/My 데이터 로드
- 오류/빈 상태 CTA 누락

P2: 운영/분석 문제
- 퍼널 이벤트 누락
- 알림 unread/읽음 동작
- 푸시 토큰 등록
- 관리자/매니저 화면과 실제 상태 불일치

P3: 디자인/완성도
- 디자인 토큰 드리프트
- 화면 간 문구 톤 불일치
- 다크/블루 테마 QA
- README/핸드오프 문서 정리

### Phase 4 — Claude Code 지시 방식
Claude Code에는 한 번에 큰 작업을 주지 않는다. 각 작업은 “파일 범위, 요구사항, 금지사항, 검증 명령”을 포함한다.

표준 프롬프트 구조:

1. Context
- 프로젝트는 Next.js + Expo 앱이다.
- `AGENTS.md`, `CLAUDE.md`, 해당 하위 `AGENTS.md`를 읽어라.
- 디자인은 `design handoff/IMPLEMENTATION_CONTRACT.md`가 기준이다.

2. Task
- 정확히 어떤 사용자 흐름/버그/화면을 고칠지 명시.
- 관련 파일 경로를 지정.

3. Constraints
- 기존 사용자 변경 보존.
- 지정 파일 외 수정 금지.
- 디자인 토큰/아이콘/폰트 임의 생성 금지.
- `.env`/비밀 파일 읽기 금지.
- 커밋/푸시 금지.

4. Verification
- 루트 변경이면 `npm run lint`, 가능한 경우 `npm run build`.
- 모바일 변경이면 `cd mobile && npx tsc --noEmit` 또는 Expo/TypeScript 검증 가능 여부 확인.
- 관련 화면 수동 QA 체크리스트 작성.

5. Report
- 변경 파일
- 사용자 영향
- 실행한 검증 명령과 실제 결과
- 남은 리스크

Claude Code 실행 방식:
- 단일 구현 작업: `claude -p` print mode 우선.
- 긴 반복 작업: tmux interactive session 사용.
- 항상 `--max-turns`로 범위 제한.
- 가능하면 `--allowedTools`로 Read/Edit/Write/Bash 범위 제한.

예시 명령 형태:
`claude -p "<작업 지시>" --allowedTools "Read,Edit,Write,Bash" --max-turns 10`

---

## 4. 첫 번째 실제 작업 제안

바로 코딩하기 전에 아래 순서로 진행한다.

### Task 1: 앱/웹 라우트 인벤토리 작성
Objective: 실제 구현된 라우트와 문서상 흐름을 대조한다.

Files to inspect:
- `mobile/app/**`
- `src/app/**/page.tsx`
- `src/app/api/mobile/**/route.ts`
- `design handoff/USER_FLOW.md`

Output:
- 현재 존재하는 라우트 표
- 문서에는 있으나 없는 라우트
- 코드에는 있으나 흐름 문서에 없는 라우트

### Task 2: 학생 모바일 핵심 여정 UX 확정안 작성
Objective: 학생이 앱을 켰을 때 상태별 첫 화면과 CTA를 확정한다.

Files to inspect:
- `mobile/app/index.tsx`
- `mobile/hooks/useAuth.ts`
- `mobile/lib/journey-redirect.ts`
- `mobile/app/consult/status.tsx`
- `mobile/app/(tabs)/index.tsx`

Output:
- `ONBOARDED`, `WAITING`, `ASSIGNED`, `MATCHING`, `ACTIVE`별 앱 진입 정책
- 강제 리다이렉트 vs 홈 표시 정책
- 사용자가 “나중에 보기”를 눌렀을 때 재노출 정책

### Task 3: 모바일 QA 기준으로 화면 점검
Objective: 핵심 화면별 로딩/빈값/오류/CTA가 일관적인지 확인한다.

Files to inspect:
- `mobile/app/(tabs)/index.tsx`
- `mobile/app/(tabs)/learning.tsx`
- `mobile/app/(tabs)/qna.tsx`
- `mobile/app/(tabs)/my.tsx`
- `mobile/app/consult/status.tsx`
- `mobile/components/ui/EmptyState.tsx`
- `mobile/components/ui/ErrorState.tsx`

Output:
- P0/P1/P2 이슈 리스트
- Claude Code 작업 카드 후보

### Task 4: 첫 구현 배치 실행
Objective: 사용자 승인 후 P0/P1 중 1~3개만 Claude Code에 맡긴다.

Rules:
- 한 Claude 작업 = 한 사용자 문제.
- 한 작업 완료 후 Hermes가 diff와 검증 결과 확인.
- 실패하면 같은 파일에서 최대 3회까지만 수정 시도 후 사용자에게 공유.

---

## 5. 검증 게이트

루트 웹/백엔드:
- `npm run lint`
- `npm run build`

모바일:
- `cd mobile && npx tsc --noEmit`가 가능한지 확인.
- Expo SDK 56 문서 기준 확인 후 변경.
- 가능하면 `cd mobile && npx expo start --web` 또는 시뮬레이터 수동 확인.

수동 QA:
- `design handoff/QA_CHECKLIST.md`의 진입·상담·빈값·오류·매칭·알림 항목 사용.
- 최소 학생 상태 4개 계정이 필요: `ONBOARDED`, `WAITING/ASSIGNED`, `MATCHING`, `ACTIVE`.

---

## 6. 지금 사용자에게 필요한 확인 사항

1. 이번 라운드의 1순위는 모바일 앱인가, 웹인가?
2. 실제 테스트 가능한 계정/데이터가 있는가?
   - 상담 전 학생
   - 상담 대기/배정 학생
   - 매칭 중 학생
   - 활성 수강 학생
   - 매니저/관리자 계정
3. 현재 git에 있는 수정/미추적 파일은 모두 유지해야 하는 작업 중 변경인가?
4. 모바일 결제는 지금 구현 대상인가, 아니면 정책 검토 전까지 상담/구독 안내까지만 둘 것인가?
5. 디자인 기준은 `design handoff`의 HTML/CSS를 픽셀 기준으로 유지하는 것이 맞는가?

---

## 7. 운영 원칙

- 먼저 사용자 흐름을 합의하고, 그 다음 코드 수정.
- 큰 리팩터링 금지. 사용자 문제 기준으로 작은 변경.
- 문서와 코드가 다르면 코드만 고치지 말고 기준 문서도 함께 업데이트 후보로 기록.
- 디자인은 재해석하지 않는다. 주어진 CSS/토큰/아이콘을 따른다.
- Claude Code 결과는 믿지 말고 Hermes가 반드시 diff와 검증 출력으로 확인한다.
- 완료 보고는 “무엇을 바꿨다”보다 “사용자가 이제 어떤 흐름을 문제없이 탈 수 있다”를 기준으로 한다.
