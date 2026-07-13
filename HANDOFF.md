# HANDOFF.md — Concord Private Tutoring 마스터 핸드오프

> 이 문서는 **모든 후속 AI 세션의 진입점**이다. 다른 문서로 가기 전에 Part 0을 반드시 통독한다.  
> 갱신: **2026-07-12 · main** (07-04 원본 작성, 07-12 정정·추록 — Part 3.4에 07-05~07-12 사이클 143커밋 반영)  
> 원격 `https://github.com/prosj04/tutormatchWEB.git`  
> 상세 히스토리 원본: `CLAUDE_HANDOFF.md` (1,425줄, §1~26 세션 로그·이연 스펙 보존)  
> 문서 지도: `docs/README.md`

---

## ⚡ 2026-07-13 세션 마감 요약 (다음 세션은 여기부터)

**완료 (로컬 16커밋, 전부 tsc·lint·prod build 검증 — push 대기)**
1. **UX 전수조사 2차**: opus 8팀, 108건 발견 → P0/H 전건+M 대부분 당일 수정. 상세는 `docs/30-제품·디자인.md` Part G. 방법론 재사용: "전수조사" → `ux-sweep` 스킬.
2. **수업 확인 제도 신설** (오너 스펙, 메모리 `project_lesson_confirm`): 자동완료 폐지 → 선생님 확인(완료/사유, 비과실=마지막 수업 이월) → 3자 공지. 마이그레이션 `20260713090000_lesson_confirm` **배포 시 자동 적용됨**.
3. 알림 4역할 개방+학부모 팬아웃(결제+핵심만), 미수락 매칭 3일 자동 확정, 만료 구독 D+3 마감, 인증 복구 경로+모바일 rate-limit(보안), 어드민 confirm 가드+치프 서류 열람, 모바일 정산·업로드 UI(expo-picker 설치됨), 감사로그 실명화+반려 SMS, API_REFERENCE 173 라우트.

**다음 세션 할 일 (순서대로)**
1. 🔴 **오너 PAT `workflow` scope 갱신 확인 → `git push origin main`** — 16커밋 배포+마이그레이션+hourly 크론이 전부 이것에 걸려 있음. push 성공 시 GitHub Secrets `CRON_SECRET` 등록도 확인.
2. 배포 후 **프로덕션 스모크**: 수업 확인 제도(확인 알림→완료/이월), 학부모 알림 팬아웃, PARENT 자녀 선택 결제, 모바일 업로드. 테스트 데이터는 pilot- 접두사 후 정리 (07-12 스모크 절차 참조).
3. 잔여 소소: 매니저 내부 화면 용어 통일(선택), D+7 무응답 자동완료 폴백 값 오너 재확인, 앱스토어 제출(개발자 계정 등록되면 `docs/STORE_SUBMISSION_2026-07.md`부터).

**주의**: 동시 세션이 같은 트리에서 작업하는 패턴 지속 — §0.2 준수(명시적 경로 add). 요금·수락·PAUSED 정책은 메모리·§0.1 참조.

---

## 목차

- [Part 0 — AI 운영 하네스 (필독)](#part-0)
- [Part 1 — 5분 온보딩](#part-1)
- [Part 2 — 시스템 상세 (요약 + 참조)](#part-2)
- [Part 3 — 현재 상태 스냅샷 (07-04 원본 + 07-12 추록)](#part-3)
- [Part 4 — 다음 작업 백로그](#part-4)
- [Part 5 — 문서 지도 · 세션 로그](#part-5)

---

<a id="part-0"></a>
## Part 0 — AI 운영 하네스 (이 저장소에서 작업하는 모든 AI에게 적용)

> 이 절은 시스템 프롬프트 또는 `AGENTS.md`로 그대로 복사·확장 가능한 규범 집합이다. 기존 `AGENTS.md` / `CLAUDE.md`가 규정하지 않은 조건은 이 절이 우선한다.

### 0.1 제품 북극성 — 프리미엄 과외 9단계

`CLAUDE.md`의 원문을 그대로 승계한다. 모든 구현·리팩터·문서 결정은 이 순서를 배반하지 않아야 한다.

1. 학생이 상담을 신청하거나 결제한다.
2. 신청만 한 학생은 **매니저 배정 대기 상태**로 남는다.
3. 결제한 학생은 **치프 매니저에게 자동 배정**된다.
4. 매니저는 배정된 학생을 받아 대면 상담 일정을 조율한다.
5. 대면 상담 중 매니저가 적합한 선생님을 자유롭게 배정한다.
6. 배정 확정을 위한 인앱 **수락 버튼**이 존재하지만 이는 **형식적 절차**다 — **마케팅 카피나 UI에서 학생 수락을 절대 강조하지 않는다**.
7. 배정 이후 담당 선생님이 첫 수업 날짜를 정하고 수업을 시작한다.

> ⚠️ **2026-07-08 개정**: 구버전 6단계("학생이 수락 버튼으로 명시적으로 수락해야 수업이 활성화된다")는 폐기되었다. `CLAUDE.md`(2026-07-08 갱신)가 진실의 원천 — 수락 버튼은 코드상 존재하나 형식이며, 마케팅·UI에서 강조 금지. 코드의 `matchStatus: PENDING_STUDENT_ACCEPT → ACTIVE` 플로우 자체는 유효하다. 이 개정 이전 문서(`docs/20-마케팅.md`(구 MARKETING_PLAN)의 수락 버튼 소재화, `docs/external/*`의 "동의 기반 매칭" 강조 등)를 참조할 때는 이 규범이 우선한다.
8. 대면 수업은 선생님이 1주(또는 4일)치 숙제를 한 번에 입력하면 시스템이 **가중치 기반으로 자동 분배**한다.
9. 매주 반복되는 숙제 패턴은 **템플릿으로 재사용** 가능해야 한다.

`resolveStudentJourneyStage()` (`src/lib/student-journey.ts`) 및 `mobile/lib/student-journey.ts`의 stage enum이 이 9단계의 코드 반영이다. 두 곳의 enum이 어긋나면 반드시 웹을 기준으로 모바일을 갱신한다.

### 0.2 멀티 세션 프로토콜 (중요)

**이 저장소는 복수 AI 세션이 동시에 작업 중이다.** 다음 규칙을 무조건 지킨다.

- **세션 시작 시** `git status && git log --oneline -10 && git rev-list --count origin/main..HEAD`을 먼저 실행해 **타 세션의 미커밋 파일·최근 커밋·push 대기 수**를 확인한다.
- **타 세션의 미커밋 파일은 절대 수정·스테이징하지 않는다.** 특히 `prisma/schema.prisma` 및 `prisma/migrations/**`은 **현재 결제/정산 세션이 소유**하고 있는 것으로 간주한다. 다른 세션에서 스키마를 만져야 할 필요가 생기면 오너에게 조율 요청.
- 자신의 변경분만 **명시적 경로**로 `git add`한다. `git add -A`, `git add .` 금지.
- 세션 간 통신은 이 파일의 [Part 5 · 세션 로그](#part-5)에 append 한다.

### 0.3 DB는 프로덕션이다 — 데이터 파괴 금지

- `.env`의 `DATABASE_URL`은 **실서비스 Supabase 인스턴스**(pgbouncer 6543, DIRECT_URL 5432)이며 실사용자 데이터가 존재한다.
- 다음 작업은 **오너 승인 없이 실행 금지**:
  - 시드 스크립트 (`npm run seed:sample` 등) — 이미 실행된 이력이 있어 재실행 시 [sample] 접두사 데모 계정이 중복될 수 있다. 공개 노출은 코드 필터(`src/app/api/tutors` 등)로 차단되어 있으나 사이드이펙트 있음.
  - `prisma migrate reset`, `prisma db push --force-reset`, 직접 `DELETE FROM` 실행.
  - 새 마이그레이션의 프로덕션 적용 (`prisma migrate deploy`) — 스키마 세션 소유자와 조율 후 실행.
- **CMS 테이블(`SiteContent`, `Testimonial`, `FaqItem`)이 비어 있는 것은 의도된 상태다.** 사이트는 `cms-page-defaults.ts` / `cms-seed.ts`의 **코드 fallback**으로 렌더링 중이며, CMS 시딩(`POST /api/admin/cms/init`)은 오너 승인이 있어야 실행한다.
- **DB에 `[sample]` 접두사 데모 계정이 존재**한다. 공개 강사 목록 등은 코드 레벨에서 이 접두사를 필터링한다(`src/app/tutors`, `src/lib/public-teachers-cache.ts`). 필터 제거 금지.

### 0.4 배포 규칙 — main push = 프로덕션

- `origin/main`에 push하면 Vercel(`tutormatch-web`)이 **즉시 프로덕션에 배포**한다.
- **오너의 명시 승인 없이는 push하지 않는다.** ~~현재 로컬 `main`은 `origin/main`보다 **29 커밋 앞서** 있으며 다수의 미배포 변경이 대기 중이다.~~ **(2026-07-12 갱신: push 완료 — 로컬과 origin/main 동기화 상태, 대기 커밋 0개.)** 새 커밋은 오너 승인 전까지 로컬에만 쌓는다는 원칙은 유지.
- 배포 시 빌드는 `prisma migrate deploy && next build`. 미적용 마이그레이션이 있으면 배포가 스키마를 자동 반영한다 — 이는 스키마 세션의 결정 사항이므로 임의로 트리거하지 않는다.

### 0.5 검증 프로토콜

- **타입 검사**: `npx tsc --noEmit && echo OK` 사용. 파이프로 `tail` 등을 붙이면 `$?`가 파이프 마지막 명령의 종료코드가 되어 실패가 은폐된다.
- **린트**: 파일 단위 실행이 빠르다. `npx next lint --file <상대경로>`.
- **UI 스모크**: dev 서버는 3000 포트를 타 세션이 쓸 수 있으니 **여유 포트(예: 3987)** 로 띄운다. `PORT=3987 npm run dev`, 스모크 후 반드시 프로세스 종료.
- **API 스모크**: 로컬 `curl` — cron/알림 계열은 `Authorization: Bearer $CRON_SECRET`이 필요.
- **모바일 tsc**: `mobile/` 워크스페이스에서 별도로 `npx tsc --noEmit`.

### 0.6 커밋 규칙

- **논리 단위가 완료되면 항상 커밋한다** (2026-07-13 오너 확정 — 구 "요청 시에만" 규칙 폐지). push는 여전히 오너 승인 필요(§0.4).
- 동시 세션 주의: 스테이징은 반드시 명시적 경로로 — 다른 세션의 미커밋 파일을 쓸어 담지 않는다.
- Conventional Commits + `(scope)` 형태를 유지한다. 최근 로그 스타일 참조:
  ```
  feat(consultations): allow consultation history per student
  fix(security): require session ownership for teacher document uploads
  docs(handoff): record phase 3 completion state (§25.1d)
  ```
- 논리 단위별로 커밋을 분리한다. 서로 무관한 변경을 한 커밋에 묶지 않는다.
- **`--no-verify` 금지.** 훅이 실패하면 원인을 고치고 새 커밋을 만든다 (amend 금지 — 실제 커밋되지 않은 상태에서 amend하면 이전 커밋을 덮어쓴다).
- 시크릿·생성물(`cookies.txt` 류) 절대 커밋 금지. `.gitignore` 확인.

### 0.7 디자인 규칙

- **홈 랜딩(`/`)**: `landing-v2.css`, 클래스 접두사 `.lp2-`. `LandingRoot` → `LandingPageV2` 트리에서만 사용.
- **서브페이지(요금·강사·FAQ·후기·법률 등)**: `concord.css`.
- **색상은 반드시 CSS 변수 토큰**을 통해서만 사용한다 (`--bg`, `--fg`, `--acc`, `--acc-text`, `--panel`, `--line` 등). 하드코딩 색은 자동으로 다크모드가 깨진다. 세부는 `design handoff/DESIGN_SYSTEM.md`.
- **타이포**: Pretendard, 전역 `word-break: keep-all` (한글 어절 줄바꿈).
- 디스플레이 800 / 제목 700 / 본문 400. 굵기 남발 금지, 크기와 색으로 위계.
- 새 스타일은 `.lp2-` 또는 `concord.css` 어느 쪽에 속하는지 판단하고 해당 파일에만 추가한다.

### 0.8 문서 규칙

- 모든 산출 문서는 **한국어**. 갱신 시 `docs/README.md` 인덱스 동반 갱신.
- **검증 불가한 수치를 창작하지 않는다.** 확신 없는 값은 `[확인 필요]` 표기.
- **법률 문서는 초안 표시를 유지**한다. `docs/internal/contracts/**` 및 `docs/internal/LEGAL_ADVISORY_MEMO.md`는 AI 임시 자문이며 **정식 자문 전 대외 사용 금지**.
- `docs/IMPLEMENTATION_PLAN_2026-07.md`, `docs/IMPLEMENTATION_SESSIONS_REVISED.md`, `docs/MANAGER_GUIDELINES.md`는 **다른 세션이 활성 사용 중** — 구조 변경 금지, 내용 추가만.
- 세션 종료 시 이 파일 [Part 5 · 세션 로그](#part-5)에 엔트리 append (`CLAUDE_HANDOFF.md §25` 스타일 승계).

### 0.9 금지 사항

- `git commit --no-verify`, `git push --force`, `git reset --hard`, `git clean -f` — 오너 명시 지시 없이는 절대 실행 금지.
- `/api/dev/*` 류의 개발용/우회 라우트를 프로덕션 코드에 추가하고 방치하는 것. 과거 `POST /api/dev/skip-payment-enroll`은 이미 제거되었다.
- **AI 인물 사진을 실존 인물처럼 보이도록 프로필에 무단 적용**. 사진 작업은 오너 보류 중(`docs/PHOTO_GENERATION_PROMPT.md`).
- CMS 테이블 임의 시딩, 시드 스크립트 임의 실행.
- 마이그레이션의 로컬 실행/프로덕션 적용을 스키마 세션과 조율 없이 진행.
- Toss 시크릿 키·Supabase Service Role·Anthropic 키를 로그·응답·문서에 노출.

### 0.10 작업 종료 시 체크리스트

1. `npx tsc --noEmit && echo OK` 통과 확인.
2. 변경 파일에 `npx next lint --file` 실행.
3. dev 서버 프로세스 종료(백그라운드 잔존 금지).
4. **[Part 5 · 세션 로그](#part-5)에 오늘 작업·핵심 파일·커밋 해시·미해결 항목을 append.** (`CLAUDE_HANDOFF.md §25.1x` 형식.)
5. 오너 미승인 push·커밋 없음 확인.

---

<a id="part-1"></a>
## Part 1 — 5분 온보딩

### 제품 한 줄
**Concord Private Tutoring** — 1:1 프리미엄 과외 매칭·학습관리 플랫폼. 학부모(결제자) 대상, 매니저가 상담·매칭·리텐션을 중개.

### 역할 5개와 진입점 (07-10 PARENT 역할 신설로 4→5)

| 역할 | 로그인 후 홈 | 핵심 UI |
|------|-------------|--------|
| STUDENT | `/dashboard` (active match 필요) / `/dashboard/consultation` | 캘린더·플래너·QnA·상담·결제내역 |
| PARENT (07-10 신설) | `/parent` (웹 포털) / 모바일 `(parent)` 탭 | 자녀 연결(코드/QR)·리포트·결제·상담 신청 |
| TEACHER | `/teacher-portal/dashboard` | 담당 학생·플랜·질문 답변·프로필 |
| MANAGER (+ CHIEF_MANAGER) | `/teacher-portal/dashboard` | 위 + 상담·매칭·모니터링·케어로그·상담 리포트·구독 일시정지 |
| ADMIN | `/admin` | 전 CRUD·CMS·지표·정산·감사로그·환불 |

역할 상세 정책은 `CLAUDE_HANDOFF.md §2`. `CHIEF_MANAGER`는 결제 자동 배정 대상이며 `requireAdmin` / `requireManager` 통과. PARENT는 `1403bb2`(백엔드)·`5600f0b`(웹 스켈레톤)·`b8ea0f7`(모바일 탭셋)로 구축.

### 현재 단계
**출시 전, 파일럿 준비 단계.** 코드는 결제→매칭→첫 수업→숙제 자동 분배→월간 리포트→정산까지 관통 가능. 다음 블로커는 (1) 사업자 등록, (2) 법률 문서 변호사 검토. ~~(3) `origin/main`에 대기 중인 29 커밋의 배포 승인~~ (07-12 갱신: push 완료, 동기화 상태).
**07-12 기준 추가된 큰 축**: PARENT 4번째 사용자 역할(백엔드+웹 포털+앱), 모바일 통합 4역할 앱(학생·학부모·선생·매니저), 디자인 핸드오프 기반 로그인 후 화면 전면 재디자인, 구독 일시정지(매니저 전용). 상세는 [Part 3.4](#part-3).

### 라이브 URL / 저장소

| 항목 | 값 |
|---|---|
| 프로덕션 URL | `https://tutormatch-web.vercel.app` |
| Vercel 프로젝트 | `tutormatch-web` |
| GitHub | `prosj04/tutormatchWEB` |
| 브랜치 | `main` (07-12 기준 origin과 동기화 — 구버전 표기 "29 커밋 앞섬"은 해소) |

### 기술 스택 한 줄
**Next.js 14.2 App Router · TypeScript · NextAuth v5 (JWT/Credentials) · Prisma 5.22 + Supabase PostgreSQL · Toss Payments (위젯 + 서버 confirm + 웹훅 + 빌링키) · Anthropic Claude · React Native (Expo, `mobile/`) · Vercel + Cron.**

### "지금 이어서 할 일" 후보

우선순위와 참조는 [Part 4 · 백로그](#part-4). 상위 5개는:

1. Toss 대시보드에 웹훅 URL 등록 (오너 액션).
2. 사업자 등록 후 법률 문서 `[기재 예정]` 8곳 채우기 (오너 액션).
3. ~~`origin/main`에 대기 중인 29 커밋의 배포 승인~~ ✅ 07-12 기준 push 완료.
4. 프로덕션 스모크 테스트 (로컬 스모크는 §25.1f에서 9/10 통과 확인됨).
5. 커스텀 도메인 연결 (GA4 태그는 07-05 env-gated로 추가 완료 `13916e4`, 비밀번호 변경·매니저 리셋은 07-10 완료 `c1fab4d`).
6. 모바일 4역할 앱 스토어 제출 준비 (07-11 통합 앱 완성 `b8ea0f7`) — 오너 결정.

---

<a id="part-2"></a>
## Part 2 — 시스템 상세 (요약 + 참조)

> 이 절은 "**어디에 무엇이 있는지**"의 지도다. 상세 서술은 원본 문서로 이동한다.

### 2.1 아키텍처 개요 (참조 원본: `docs/internal/TECH_OVERVIEW.md`)

```
[마케팅] 홈(landing-v2) · 요금 · 강사 · FAQ · 후기 · 법률
    ↓ 상담 CTA / 결제
[가입] 학생(전화번호) / 선생(3단계 지원)
    ↓
[결제] Toss 위젯 → confirm 서버 검증 → 웹훅 재검증 → 구독 ACTIVE + 치프 배정
    ↓
[상담] ConsultationBooking (WAITING → ASSIGNED → COMPLETED, 이력 다행)
    ↓ 상담 리포트(목표·수준·추천 플랜)
[매칭] TeacherStudent matchStatus (PENDING_STUDENT_ACCEPT → ACTIVE)
    ↓ 학생 수락
[수업] 첫 수업 API + 자동 숙제 분배(템플릿) + Lesson 자동 COMPLETED 전이
    ↓
[운영] 매니저 케어 로그 · 만족도 D+7 · 월간 AI 리포트 · 어드민 지표 · 감사로그
    ↓
[수익] 빌링키 자동 갱신 · 셀프 해지 · dunning · 선생 시급 3만원 월별 정산
```

- **상세 아키텍처**: `docs/internal/TECH_OVERVIEW.md`
- **아키텍처 원본(구버전 포함)**: `CLAUDE_HANDOFF.md §1, §3, §5, §6`

### 2.2 역할·권한 (참조 원본: `CLAUDE_HANDOFF.md §2, §8`)

- ~~4 역할~~ **5 역할 (07-10 갱신)**: `STUDENT` / `PARENT` / `TEACHER` / `MANAGER` / `ADMIN` + 사실상 6번째 `CHIEF_MANAGER`. PARENT는 `20260710160000_parent_role` 마이그레이션으로 enum 추가, 자녀 연결은 코드/QR (`/api/mobile/parent/link`).
- API 가드 헬퍼(`src/lib/`): `admin-auth`, `student-auth`, `teacher-auth`, `manager-auth`, `manager-page-auth`, `notification-auth`, `teacher-student-match`.
- `requireAdmin` → ADMIN **또는** CHIEF_MANAGER. `requireTeacher` → TEACHER/MANAGER/CHIEF_MANAGER. `requireManager` → MANAGER/CHIEF_MANAGER.
- 미들웨어 매칭·마케팅 공개 경로 목록은 `middleware.ts`, `src/lib/public-routes.ts`.

### 2.3 핵심 비즈니스 플로우 (승계 + 갱신)

`CLAUDE_HANDOFF.md §3`을 기준으로 하되 아래 사항은 세션 후 갱신됨:

- **§3.5 선생님 매칭**은 이제 즉시 active가 아니라 `PENDING_STUDENT_ACCEPT` → 학생 수락 시 `ACTIVE`. `matchStatus` 컬럼과 `POST /api/matches/[matchId]/accept`, 매니저가 입력한 `matchReason` 표시 포함.
- **§3.3 결제 플로우**는 v1 세션 기반이 아니라 **v2 시간제 월정액 8종** 기준. `src/lib/pricing-plans.ts`의 `PRICING_PLANS_V2` (중등·고등 × 주1회 2h / 주1회 3h / 주2회 2h / 주2회 3h). v1 금액은 `planIdFromAmount` 역매핑에서 계속 인식.
- **결제 완료**는 서버 confirm(`src/lib/toss-payments.ts`) + 웹훅(`/api/webhooks/toss`)로 검증됨. 과거 "orderId만으로 완료"의 우회 지점은 해소.
- **상담 이력화**: `ConsultationBooking.studentId @unique` 해제 완료 — 학생당 여러 상담 로우 존재 가능. `open` 상담은 `WAITING`/`ASSIGNED` 1건으로 앱 레벨 강제. 헬퍼: `src/lib/consultation-current.ts`.

### 2.4 인증·미들웨어

- `auth.ts`: NextAuth v5 JWT + Credentials. `basePath: /api/auth`. `NEXTAUTH_URL`에 절대 path 붙이지 않음 (붙이면 전원 로그인 실패).
- 로그인 식별자는 이메일 또는 전화번호 (`src/lib/phone-login.ts`). 합성 이메일: `student+{digits}@concord.local` / `teacher+{digits}@concord.local`.
- `deletedAt` non-null 계정은 로그인 차단.
- 세부는 `CLAUDE_HANDOFF.md §8`.

### 2.5 DB 모델 관계 (참조 원본: `prisma/schema.prisma`, `CLAUDE_HANDOFF.md §9`)

- 핵심 관계 그래프는 §9 참조. 그 후 추가된 모델(반드시 인지):
  - `AuditLog` — 계정삭제/환불/역할변경/일시정지 기록 (`/admin/audit-logs`).
  - `HomeworkTemplate` — title, defaultDays, isDefault, tasks JSON. 첫 수업 설정 시 자동 적용.
  - `ConsultationReport` — 매니저 상담 후 정량/정성 목표·수준·추천 플랜.
  - `ManagerCareLog` — 매니저의 상담/개입/점검 로그. 학생 대시보드에 공개 항목 노출.
  - `SatisfactionCheckin` — 첫 수업 D+7 만족도 1~5점.
  - `Subscription` `PAUSED` 상태 + `pausedAt`/`pausedUntil` (매니저 전용, 최대 35일, 만료일 자동 연장).
  - `BillingProfile` — 토스 빌링키(카드) 자동결제 프로필. `autoRenew` 셀프 토글.
  - `QuestionMessage` — QnA 통합 후 **단일 저장소**. `replyToId` 스레드, `date`, `isResolved`. 기존 `Question` 테이블은 DEPRECATED로 존치.
  - Prisma **enum 전환** 완료: `UserRole`, `ConsultationStatus`, `LessonStatus`, `SubscriptionStatus`, `MatchStatus`, `PaymentStatus` (수기 in-place 캐스트 SQL로 데이터 보존).
- **`ConsultationBooking.studentId`는 @unique가 아니다** (이력화 이후). `findUnique` 사용 금지 — `consultation-current.ts`의 헬퍼 사용.
- **07-05~07-12 사이클 추가분 (반드시 인지)**:
  - `ConsultationLead` — 공개 상담 리드 폼(비로그인) 수집 모델. gender·region 컬럼 후속 추가.
  - `Testimonial`에 grade/category/tags 컬럼 추가 — DB 기반 성적 배지 렌더링.
  - `SatisfactionCheckin` unique 제약 추가 (`20260705120000`).
  - `UserRole`에 **`PARENT`** 추가 (`20260710160000_parent_role`) — 자녀 연결·리포트 열람·결제 주체.

### 2.6 API 개요

- ~~총 110 라우트~~ → **2026-07-12 실측 166 라우트** (`find src/app/api -name route.ts` 카운트. 07-04의 110 표기와 `CLAUDE_HANDOFF.md §10`의 58 표기는 **구버전**. `docs/internal/API_REFERENCE.md`도 110 시점 기준이므로 재실측 필요 — 증가분은 parent/mobile-teacher/mobile-manager/consultation-lead/password 계열).
- 그룹: `account`, `admin` (30), `auth`, `billing` (2), `chief-manager`, `consultation`, `cron` (2), `events`, `manager` (13), `matches`, `mobile` (20), `notifications`, `payments`, `plans`, `questions`, `register`, `student`, `teacher`, `webhooks`.
- **상세 목록·권한·파라미터는 `docs/internal/API_REFERENCE.md` 하나로 통일**. 여기서는 중복 서술하지 않는다.
- 신규/최근 라우트 하이라이트:
  - `POST /api/webhooks/toss` — 결제 웹훅 (멱등, Toss 재검증).
  - `POST /api/matches/[matchId]/accept` — 학생 매칭 수락.
  - `POST /api/manager/subscriptions/[id]/pause` — 매니저 전용 일시정지.
  - `POST /api/admin/payments/[id]/refund` — 환불 마킹 + 구독 취소.
  - `POST /api/student/teacher-change-request` — 선생 교체 요청.
  - `PATCH /api/teacher/lessons/[id]/cancel` — 선생 취소 + 보강 자동 생성.
  - `GET /api/admin/metrics`, `/admin/settlements`, `/admin/audit-logs`.
  - `POST /api/student/question-images`, `POST /api/teacher/profile/photo` — 스토리지 서버 경유.
  - `POST /api/billing/register-success` — 빌링키 등록 완료.
  - `POST /api/account/delete`, `DELETE /api/mobile/me` — 계정 삭제(앱스토어 5.1.1(v)).

### 2.7 CMS 시스템 (참조: `CLAUDE_HANDOFF.md §11`)

- 소스: `SiteContent`(section+key→value) / `Testimonial` / `FaqItem`.
- **현재 DB 3 테이블 모두 비어 있다.** 사이트는 `src/lib/cms-page-defaults.ts` / `cms-seed.ts` / `landing-data.ts` 폴백으로 렌더링 중.
- 캐시: revalidate 300s + 태그 무효화(`revalidatePublicCms`).
- 시딩(`POST /api/admin/cms/init` → `seedDefaultCmsContent`)은 **오너 승인 후 실행**한다. 시딩 후에도 `skipDuplicates: true`.
- 인라인 편집: ADMIN + `?cms_edit=1` → `CmsEditOverlay`.

### 2.8 결제·정산·빌링·알림·cron

- **결제 (v2)**: `src/lib/pricing-plans.ts` (`PRICING_PLANS_V2` 8종, priceKrw 유니크) → `/checkout?plan=<id>` → Toss 위젯 → `success` → 서버 confirm(`toss-payments.ts`) → 웹훅 재검증 → 구독 ACTIVE + 치프 배정.
- **빌링키 자동갱신**: `BillingProfile` + 갱신 cron. 실패 시 D+1/D+3 재시도 → D+7 자동 해지. `autoRenew` 셀프 토글로 "언제든 해지" 지원.
- **선생 정산**: `/admin/settlements` — 월별(KST) 완료 수업 × durationMin × 시급 30,000원. PG 지급대행은 외부 계약 후.
- **알림**: `src/lib/notifications.ts` 타입 다수. `src/lib/run-alert-checks.ts`에 D-5/D-1 만료, D+7 만족도, 매칭 24h 방치, 첫 수업 SLA 7일, 미결제 리드 3일 팔로업, 미답변 질문 24h 등 통합.
- **SMS/알림톡**: `src/lib/sms.ts` — env-gated 알림톡 우선 + SMS 폴백. `SOLAPI_KAKAO_PF_ID` / `SOLAPI_KAKAO_TEMPLATE_*` 미설정 시 SMS로 자동 폴백.
- **Cron**: `vercel.json` 매일 UTC 00:00 `/api/cron/check-alerts`. Hourly는 GitHub Actions로 옮겼다가 PAT scope 문제로 제거됨 — 현재 daily만. 라우트에 `x-vercel-cron` 헤더 우회 지원.

### 2.9 환경변수 (참조: `.env.example`, `scripts/check-env.ts`, `CLAUDE_HANDOFF.md §14`)

로컬 `.env` 실측 필수 키: `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`. 추가 권장: `ADMIN_SETUP_SECRET`, `ANTHROPIC_API_KEY`, `CHIEF_MANAGER_EMAIL`, `NEXT_PUBLIC_TOSS_WIDGET_CLIENT_KEY`, `TOSS_SECRET_KEY`, `SOLAPI_*`, `SOLAPI_KAKAO_*`, `ENABLE_AUTO_HOMEWORK_DISTRIBUTION`.

### 2.10 폴더 구조 (요약)

```
premium-tutoring/
├─ auth.ts, middleware.ts, next.config.mjs, vercel.json
├─ prisma/
│  ├─ schema.prisma
│  └─ migrations/               # 25개 (§2.11)
├─ public/
├─ scripts/                     # check-env, setup-storage, seed-sample
├─ src/
│  ├─ app/                      # 110 API 라우트 + 페이지
│  ├─ components/
│  ├─ hooks/
│  ├─ lib/                      # 도메인 로직 (약 80개, CLAUDE_HANDOFF §16)
│  └─ types/
├─ mobile/                      # Expo 56 React Native 워크스페이스
├─ docs/                        # 문서 (외부·내부·전략·실행)
├─ design handoff/              # 디자인 원본 (HTML 시안, DESIGN_SYSTEM.md)
├─ HANDOFF.md                   # ← 이 문서
└─ CLAUDE_HANDOFF.md            # 세션 로그·이연 스펙 원본
```

### 2.11 마이그레이션 목록 (07-04 실측 25개 → **07-12 실측 31개**)

```
20260514190000_supabase_init
20260516000000_baseline_missing_tables
20260517000000_add_indexes
20260518081500_add_teacher_documents
20260520120000_visit_consultation_times
20260520180000_teacher_gender
20260521120000_student_gender
20260521130000_cms_tables
20260527120000_faq_reviews_surface_flags
20260625143525_mobile_app_models
20260630120000_analytics_events
20260702140000_payment_completion_idempotency
20260702160000_student_guardian_phone
20260702210000_study_task_source
20260702220000_homework_templates
20260703014634_soft_delete_and_match_reason
20260703031301_phase2_core_loop
20260703071300_phase3_retention
20260703092239_leftover_batch
20260703120000_teacher_student_match_status
20260703140210_consultation_history
20260703141527_status_enums
20260703143003_audit_log
20260703152558_qna_unification
20260703164930_billing_key
20260705120000_satisfaction_checkin_unique
20260706120000_add_consultation_lead
20260706130000_testimonial_grade_category
20260707120000_consultation_lead_gender
20260707150000_consultation_lead_region
20260710160000_parent_role
```

(마지막 6개는 07-05~07-10 사이클 추가분.) `CLAUDE_HANDOFF.md §9`의 9개 리스트는 **구버전 표기**.

---

<a id="part-3"></a>
## Part 3 — 현재 상태 스냅샷 (3.1~3.3: 07-04 원본 보존 · 3.4: 07-12 추록)

### 3.1 이번 사이클(2026-07-02 ~ 07-04) 최근 30 커밋으로 파악한 완료 항목

git log 실측 요약. 상세 세션 로그는 `CLAUDE_HANDOFF.md §25.1a~h`.

| 영역 | 완료 내용 | 대표 커밋 |
|---|---|---|
| 디자인 개선 | 공개 페이지 스크롤 리빌·홈 신뢰 배지·지역 안내 | `7cfc553`, `706ef07`, `5a7cf17`, `dfa6b86` |
| 문서 체계 | 외부(사업계획서 PSST·재무) + 내부(TECH·API·법률·계약 초안) + 문서 지도 신설 | `40a6f65`, `33519d6`, `4695b6a`, `5669cd6`, `30ed748` |
| 보안 수정 | 선생 서류 업로드 세션 소유권 검증 · `requireAdmin` 축소 · 스토리지 서버 경유 · qna 미답변 알림 통합 | `a83c392`, `17e3619` |
| 결제 v2 | 시간 기반 v2 요금제(8종) · 요금 페이지·홈 티저 반영 · 모바일 정합 | `9f578ac`, `603824c` 등, `3bbddd7` |
| 빌링·정산 | Toss 빌링키 자동갱신·dunning·셀프 해지 (Q2=A) · 시급 3만원 월별 정산 리포트 (Q3) | `831979b`, `c986a90` |
| QnA 통합 | `QuestionMessage` 단일 저장소, `Question` DEPRECATED | `92b19a4` |
| 상담 이력화 | `ConsultationBooking.studentId` @unique 해제, `consultation-current.ts` 헬퍼 | `4a0875b` |
| Prisma enum | UserRole/ConsultationStatus/LessonStatus/SubscriptionStatus/MatchStatus/PaymentStatus 전환 | `f819b2d` |
| 감사·지표 | AuditLog, 매니저 성과 지표(전환율·수락률·중앙값·케어 30일) | `4490285`, `e51e9e2` |
| 부팅·데이터 | 치프 매니저 계정 시드, cron 카운터 스프레드 버그 픽스 | `5f6568b` |
| 미성년 동의 | ConsultationSignupForm에 보호자 동의 수집 + `Student.guardianConsentAt` | (Phase 3 잔여 배치) |
| 페이지 정정 | `/login` 역할 탭 제거, 법률 목차, 강사 목록 role 필터·[sample] 제외 | `a3fa1eb`, `0eefa8c` |

~~**로컬 `main`은 `origin/main`보다 29 커밋 앞선다**~~ (07-12 갱신: push 완료, `git rev-list --count origin/main..HEAD` = 0. 프로덕션 배포 반영됨.)

### 3.2 상세 세션별 기록 (원본)

`CLAUDE_HANDOFF.md §25.1a~h`에 시간대별 완료·검증·주의사항 기록 있음. 이 파일은 **원본을 그대로 보존**하며 요약본을 여기 두지 않는다.

### 3.3 미해결·보류 항목 (수집 원본: `CLAUDE_HANDOFF.md §22, §26`, `docs/30-제품·디자인.md`(구 PRODUCT_DESIGN_TRACKER), `docs/11-사업리뷰·취약점.md`(구 BUSINESS_REVIEW))

| 카테고리 | 항목 | 상태 · 참조 |
|---|---|---|
| 콘텐츠 | 인물 사진 6종 × 5장 | 보류 (`docs/PHOTO_GENERATION_PROMPT.md`) |
| CMS | SiteContent/Testimonial/FaqItem 시딩 | 오너 승인 대기 (§0.3) |
| 법률 | terms/privacy/refund `[기재 예정]` **8곳** (실측 grep 결과) — 대표자명·사업자등록번호·통신판매업신고·주소·시행일 등 | 사업자 등록 후 (Q4) |
| 법률 | 3종 초안의 변호사 검토 반영 | Q1, 오너 진행 중 |
| 계약 | `TUITION_CONTRACT_DRAFT`, `TUTOR_ENGAGEMENT_CONTRACT_DRAFT` 변호사·노무 검토 | `docs/internal/contracts/` |
| 인프라 | 커스텀 도메인 | 미확보 |
| 계측 | GA4 이벤트 계측 부재 | ✅ 07-05 env-gated GA4 태그 추가 (`13916e4`) — 이벤트 세분화는 잔여 |
| 인증 | 비밀번호 재설정 플로우 부재 | ✅ 07-10 셀프 변경 + 매니저 리셋 구현 (`c1fab4d`) |
| 콘텐츠 정책 | 리뷰 별점 정책 미정 | `docs/30-제품·디자인.md`(구 PRODUCT_DESIGN_TRACKER) |
| 보안 | Supabase Storage RLS 정책 재점검 (서버 경유 전환 후 anon INSERT 제거) | `docs/11-사업리뷰·취약점.md`(구 BUSINESS_REVIEW) BR-14 잔여 |
| 결제 | Toss 대시보드 웹훅 URL 등록 · 현금영수증 자동발급 설정 | 오너 액션 |
| 알림 | Hourly cron 복원(GitHub PAT workflow scope) 또는 Vercel Pro cron 전환 | `CLAUDE_HANDOFF.md §26.2` |
| 요금 | 번들 할인(#17) 할인율 결정 | Q1 미결 |
| 정산 | PG 지급대행 연동, 선생 등급·인센티브(#3) | 외부 계약 후 |
| 모바일 | 스토어 제출 (계정 삭제 UI 완료) | 오너 결정 |
| UX | `Lesson.cancelledBy`/`StudyPlan.source`/`ManagerCareLog.type`/`SatisfactionCheckin.trigger` enum 2차 전환 | 소소한 부채 |
| 정보 | 이력 UX에서 매니저 상담 목록 이력 표시 개선 (현재 최신/open 위주) | 소소한 부채 |

### 3.4 — 2026-07-12 추록: 07-05 ~ 07-12 사이클 (git log 실측 143 커밋)

> 3.1~3.3은 07-04 시점 원본을 보존한다. 이 절이 07-12 기준 최신 상태다.

| 날짜 | 영역 | 완료 내용 | 대표 커밋 |
|---|---|---|---|
| 07-05 | 무결성 | 파일럿 검증 라운드 1~4 (auth·matching·payments·homework·mobile) 일괄 수정 | `c2bf847` |
| 07-05 | Sprint 1 | 환불 정책 결제 전 노출(S1-7) · GA4 env-gated 태그(S1-6) · RLS/스토리지 정책 SQL 준비(S1-5, 승인 후 적용) · 보호자 동의 서버 강제(S1-4) · 환불 시 Toss cancel API + 웹훅 외부취소 동기화(S1-3) | `410258c`, `13916e4`, `98d5715`, `4a39da8`, `f80ced4` |
| 07-05 | 전략 문서 | BM v4.1(NX-1~53·EXP-1~8) · 마케팅 v3(§22~28, V-1~13, AD-1~14) · 리팩토링 R-12~16 등록 | `ae8a0b2`, `f8ad0c0`, `b6c8bda`, `4cde3c5` |
| 07-06 | 공개 페이지 | 설탭 벤치마크 기반 홈·강사·후기 페이지 재구축 · 공개 상담 리드 폼(`ConsultationLead`) · 긴급성 배너·스티키 CTA·카운트업 · 내부 웹 자료실 뷰어 | `a309848`, `ea6f50d`, `94a6089`, `0ea690f`, `990ed11`, `a144b1e` |
| 07-06 | 후기 | Testimonial grade/category/tags 컬럼 + DB 기반 성적 배지 | `3831325`, `456911f` |
| 07-07 | 사진·스토리 | 실사 촬영 사진 전면 교체(레거시/스톡 전량 제거) · 매칭 철학 스크롤텔링 스토리 · 강사 뉴스 근거 카드 · CMS 키 정합 | `3cbca14`, `fb8cde8`, `8662bb9`, (CMS reconcile) |
| 07-08 | CRO·브랜드 | CRO 사이클 2(카피 중복 제거·팩트 배너·환불 각주) · 대학 엠블럼 세트 · 명예의 전당 카드 · 단일 컬럼 상담 폼 · 매칭 preselect/재배정 UI · 치프 매니저 admin 접근 정정 · UX 감사 문서(17건) | `adefd5f`, `d2a2a4c`, `f30bdb7`, `abcecb8`, `234a352`, `e1af183`, `6659c05` |
| 07-09 | UX·보안 | UX 감사 M-1~M-17 처분 완료 · 로그인 rate-limit · 프로필 PATCH 화이트리스트 · question-images 버킷 private 전환 + 프록시 오류 은닉 · P2 결함 16건 일괄 해소 · 히어로 지역 각주(서울·동탄) | `7b71832`, `264fe47`, `7f1949f`, `bcee87b`, `b6153d5` |
| 07-10 | PARENT 역할 | PARENT 백엔드(auth·자녀 연결·데이터/액션 API, 웹+모바일) · `/parent` 웹 포털 스켈레톤 · 선생·매니저 모바일 API · 비밀번호 셀프 변경+매니저 리셋 · 선생 프로필 사진/서류 업로드 | `1403bb2`, `5600f0b`, `5a55ee0`, `c1fab4d`, `d60848c` |
| 07-11 | 디자인 적용 | 디자인 핸드오프 CSS/아이콘 verbatim 도입 → 공개 페이지 적용 후 **전면 revert**(공개 페이지 수정 금지 규칙 확립) · 로그인 후 화면만 적용: 포털(학부모·선생·매니저) · 매니저 4화면+어드민 도구 · 학생 4p·어드민 13p·포털 v2·헤더 세션 | `596afc9`, `8e23546`, `1639383`, `820f259`, `a0d6bfa`, `7a103e9` |
| 07-11 | 모바일 | **통합 4역할 앱** — parent/teacher/manager 탭셋 신설 + student v2 (51파일, +6,866줄) | `b8ea0f7` |
| 07-12 | 구독·무결성 | 매니저 전용 구독 일시정지/재개(`PAUSED`, 최대 35일) + 모바일 린트 정리 · 파일럿 11R: 학부모 PAUSED 노출 + P2 4건 | `8aedcbc`, `b54c04e` |

**07-12 실측 수치**: API 라우트 166 (07-04: 110) · 마이그레이션 31 (07-04: 25) · `origin/main` 동기화(push 대기 0). 파일럿 시뮬레이션 2차 기록은 `docs/PILOT_SIM2_2026-07.md` (11라운드까지 추가 기록됨).

**이 사이클에서 확립된 규칙 (Part 0에 반영됨)**:
- 공개 페이지(홈·pricing·tutors·reviews·faq·login)는 **신 디자인 적용 금지** — 07-11 revert(`1639383`)로 확정. 신 디자인은 로그인 후 화면(포털·앱)만.
- 수락 버튼은 형식적 절차 — 마케팅·UI 강조 금지 (§0.1 개정 참조).

---

<a id="part-4"></a>
## Part 4 — 다음 작업 백로그 (우선순위)

> 각 항목: **선행조건 / 참조 문서 / 예상 난이도(S·M·L)**. 오너 결정 필요 항목은 `Q#`로 표기.

### 4.1 P0 — 파일럿 오픈 전 반드시

| # | 항목 | 선행 | 참조 | 난이도 |
|---|---|---|---|---|
| P0-1 | Toss 대시보드에 웹훅 URL 등록 `https://tutormatch-web.vercel.app/api/webhooks/toss` | 오너 액션 | `CLAUDE_HANDOFF.md §25.2` | S |
| P0-2 | 사업자 등록 → terms/privacy/refund `[기재 예정]` **8곳** 채우기 + 푸터 CMS `company_*` 키 반영 | Q4 | `CLAUDE_HANDOFF.md §25.1b`, `docs/internal/LEGAL_DOCS_STATUS.md` | S |
| P0-3 | 법률 문서 3종 변호사 검토 결과 반영 | Q1 | `docs/internal/LEGAL_ADVISORY_MEMO.md` | M |
| P0-4 | ~~29 커밋 배포 승인 → `git push origin main`~~ ✅ 07-12 기준 push·배포 완료 | — | (n/a) | ✅ |
| P0-5 | 프로덕션 스모크: 가입(보호자 동의)→상담→매칭(matchReason)→수락→첫 수업→숙제 자동 분배→수업 자동 완료→월간 리포트 관통. 결제는 Toss 테스트 키로 confirm+웹훅 경로 확인 | P0-4 | `CLAUDE_HANDOFF.md §26.3 #4` | M |
| P0-6 | Supabase 대시보드에서 `question-images` 등 버킷의 anon INSERT 정책 제거 | 스토리지 서버 경유 완료(§25.1f) | `CLAUDE_HANDOFF.md §26.3` | S |
| P0-7 | ~~비밀번호 재설정 플로우~~ ✅ 07-10 셀프 변경 + 매니저 리셋 구현 (`c1fab4d`, 웹+모바일) | — | `docs/30-제품·디자인.md`(구 PRODUCT_DESIGN_TRACKER) | ✅ |

### 4.2 P1 — 파일럿 중 데이터·전환

| # | 항목 | 선행 | 참조 | 난이도 |
|---|---|---|---|---|
| P1-1 | GA4 이벤트 계측 — ⏳ 부분 완료: env-gated 페이지 태그는 07-05 추가(`13916e4`), 이벤트 세분화(`AnalyticsEvent` 이중 계측 or 대체) 잔여 | — | `src/lib` 이벤트 로직 | M |
| P1-2 | 카카오 비즈니스 채널 개설 → (a) 알림톡 템플릿 심사 후 env 설정 (b) 카카오 로그인 KakaoProvider (c) 채널 플로팅 버튼 | Q4 (사업자) | `CLAUDE_HANDOFF.md §26.2 #1` | M |
| P1-3 | Hourly 알림 복원 — ✅ 07-12 오너 결정(PAT 방식): 워크플로 파일 복원 완료. **잔여 오너 액션 2가지**: ① `workflow` scope 있는 PAT로 push 자격 갱신 ② GitHub 저장소 Settings→Secrets에 `CRON_SECRET` 등록 | 오너 액션 | `.github/workflows/hourly-alerts.yml` | S |
| P1-4 | ~~번들 할인(#17) 할인율 결정~~ ❌ **폐기 (2026-07-12 오너 확정)**: 요금은 일관된 할인 규칙이 아니라 오너가 소비자 심리 최적가로 직접 설정한 금액 — 코드값(38\|43·55\|58·76\|78·106\|112만)이 진실. 할인 구조 제안·금액 변경 금지 | — | — | ❌ |
| P1-5 | ~~리뷰 별점 정책~~ ✅ **종결 (2026-07-12 오너 확정)**: 별점 미도입 — 텍스트 후기 + 성적 배지 현행 유지 (별점은 조작 시비 여지). UI 변경 없음 | — | — | ✅ |
| P1-6 | 커스텀 도메인 연결 | 도메인 확보 | — | S |

### 4.3 P2 — 확장·성숙

| # | 항목 | 선행 | 참조 | 난이도 |
|---|---|---|---|---|
| P2-1 | 모바일 앱 스토어 제출 (계정 삭제 UI 완료, journey MATCH_PENDING_ACCEPT 반영 완료. **07-11 통합 4역할 앱 완성 `b8ea0f7`으로 제출 대상이 대폭 커짐**) | 오너 결정 | `CLAUDE_HANDOFF.md §23 Phase 4` | L |
| P2-2 | 선생 정산 PG 지급대행 연동 | 외부 계약 | `CLAUDE_HANDOFF.md §26.1 Q3` | M |
| P2-3 | 선생 등급·인센티브(#3) — Teacher 활동 통계, 계약서 등급 조항 | Q3 | `CLAUDE_HANDOFF.md §24.3 #3` | M |
| P2-4 | ~~웹/앱 채널 역할(#29) — 학부모 앱 여부 결정~~ ✅ 결정·구현 완료: PARENT 역할 신설(07-10) + 모바일 학부모 탭셋(07-11). 웹은 리포트·결제·상담만 | — | `CLAUDE_HANDOFF.md §24.3 #29` | ✅ |
| P2-5 | 소소한 enum 2차 전환 (`Lesson.cancelledBy` 등) | — | `CLAUDE_HANDOFF.md §26.3` | S |
| P2-6 | 매니저 상담 목록 이력 UX 개선 | — | `CLAUDE_HANDOFF.md §26.3` | S |
| P2-7 | `Question` DEPRECATED 테이블 실제 제거(검증 후) | 관측 기간 후 | `CLAUDE_HANDOFF.md §25.1f` | S |

### 4.4 오너 미결 질문 승계

`CLAUDE_HANDOFF.md §23`의 Q1(변호사 진행중), Q2(✅ A안 확정 완료), Q3(✅ 시급 3만 확정, PG 지급대행 잔여), Q4(사업자 정보 미확보 — 상호만 "콘코드"), Q5(✅ 해소), Q6(서비스 지역 명시 여부 미결).

---

<a id="part-5"></a>
## Part 5 — 문서 지도 · 세션 로그

### 5.1 문서 지도 (원본: `docs/README.md` — **2026-07-12 주제별 단권화 재편 반영**)

> **07-12 재편**: 시간순 누적 문서 15종을 주제별 단권 6종으로 병합(전문 무손실), 원본은 `docs/archive/` 보존. 구 파일명 ↔ 새 위치 매핑은 `docs/README.md` 아카이브 절 참조.

| 계층 | 문서 | 위치 |
|---|---|---|
| 마스터 진입점 (AI) | 이 파일 (`HANDOFF.md`) | 루트 |
| **현재 상태 요약 (사람)** | `docs/00-현재상태.md` | `docs/` |
| 사업전략 (BM v4.1+v3 통합) | `docs/10-사업전략.md` | `docs/` |
| 사업 리뷰·취약점 통합 | `docs/11-사업리뷰·취약점.md` | `docs/` |
| 마케팅 통합 (계획 v3+카피+설탭 2종) | `docs/20-마케팅.md` | `docs/` |
| 제품·디자인 통합 (트래커+방향+CRO+UX 감사+홈 개선) | `docs/30-제품·디자인.md` | `docs/` |
| 파일럿 1차 기록 (2차는 활성 문서) | `docs/40-파일럿.md` | `docs/` |
| 파일럿 2차 (활성 — pilot-verify 스킬 참조, 이동 금지) | `docs/PILOT_SIM2_2026-07.md` | `docs/` |
| 세션 로그·이연 스펙 원본 | `CLAUDE_HANDOFF.md` (§25~§26) | 루트 |
| 하네스 원본 | `CLAUDE.md`, `AGENTS.md` | 루트 |
| 문서 지도 | `docs/README.md` | `docs/` |
| 기술 개요 | `docs/internal/TECH_OVERVIEW.md` | `docs/internal/` |
| API 레퍼런스 | `docs/internal/API_REFERENCE.md` (07-04 기준 110 — 07-12 실측 166, 재실측 필요) | `docs/internal/` |
| 법률 현황 | `docs/internal/LEGAL_DOCS_STATUS.md` | `docs/internal/` |
| 계약 초안 | `docs/internal/contracts/*.md` | `docs/internal/contracts/` |
| 법률 자문 메모 | `docs/internal/LEGAL_ADVISORY_MEMO.md` (AI 임시) | `docs/internal/` |
| 사업계획서 (PSST) | `docs/external/BUSINESS_PLAN_PSST.md` | `docs/external/` |
| 재무계획 | `docs/external/FINANCIAL_PLAN.md` | `docs/external/` |
| 구현 계획 (활성) | `docs/IMPLEMENTATION_PLAN_2026-07.md` | `docs/` |
| 세션별 구현 기록 (활성) | `docs/IMPLEMENTATION_SESSIONS_REVISED.md` | `docs/` |
| 매니저 운영 가이드 | `docs/MANAGER_GUIDELINES.md` | `docs/` |
| 리팩토링 제안 R-1~16 | `docs/REFACTORING_PLAN.md` | `docs/` |
| 사진 프롬프트 | `docs/PHOTO_GENERATION_PROMPT.md` (작업 보류) | `docs/` |
| 디자인 시스템 원본 | `design handoff/DESIGN_SYSTEM.md` (+ HTML 시안, `tokens-reference.css`) | `design handoff/` |
| 아카이브 (병합 원본 15종 + 구버전 사업계획서 4종) | `docs/archive/` | `docs/archive/` |

**루트 정리 (07-12 실행 완료)**: `concord_bizplan.*` 3종·`Concord_사업계획서_2026.docx`는 `docs/archive/`로 이동됨. `Concord_사업계획서_2026.md`가 원본 소스로 루트 유지, PSST 버전(`docs/external/BUSINESS_PLAN_PSST.md`)이 계승.

### 5.2 세션 로그

> 세션 종료 시 이 절에 **append**한다. 형식은 `CLAUDE_HANDOFF.md §25.1x`를 승계 — 헤더 `### 세션 로그 · YYYY-MM-DD (제목)` + 완료 항목 · 검증 · 미해결.

### 세션 로그 · 2026-07-04 (핸드오프 재정비)

- ✅ **`HANDOFF.md` 신설** (루트) — Part 0(AI 운영 하네스) · Part 1(온보딩) · Part 2(시스템 지도, 원본 참조) · Part 3(스냅샷) · Part 4(백로그) · Part 5(문서 지도 + 세션 로그 자리) 구조로 작성.
- ✅ **`CLAUDE_HANDOFF.md` 최상단 5줄 안내 블록만 추가** — 기존 §0~§26 내용은 일절 수정하지 않았음.
- ✅ **CLAUDE_HANDOFF 대비 갱신된 사실 (구버전 표기 병기)**:
  - API 라우트 수: 58 → **110** (`docs/internal/API_REFERENCE.md` 실측, `src/app/api/**/route.ts` 파일 카운트 일치).
  - 마이그레이션: 9개 → **25개** 실측 리스트로 대체 (`prisma/migrations/` 실측).
  - 요금제: v1(회당/과목) → **v2(시간제 월정액 8종)**. `PRICING_PLANS_V2` 진실의 원천, v1은 `planIdFromAmount` 역매핑에서만 존재.
  - 결제 검증: "orderId만" → **Toss confirm 서버 검증 + 웹훅 재검증**.
  - 매칭 상태: 즉시 active → **`matchStatus: PENDING_STUDENT_ACCEPT` → 학생 수락 시 ACTIVE**, `matchReason` 필드.
  - 상담: 학생 1건 → **이력 다행**(`consultation-current.ts` 헬퍼).
  - QnA: `Question` + `QuestionMessage` 이원화 → **`QuestionMessage` 단일 저장소**. `Question`은 DEPRECATED로 존치.
  - CHIEF_MANAGER: Prisma 주석 누락 → **`UserRole` enum에 정식 반영**.
  - Storage: 브라우저 anon 업로드 → **서버 라우트 경유** (`/api/student/question-images` 등).
  - Cron: hourly GitHub Actions → **daily만** (hourly는 PAT scope 문제로 제거, 라우트는 `x-vercel-cron` 지원).
  - 정산·빌링·계정삭제·감사로그·환불·일시정지·만족도·케어로그·상담 리포트 전부 **구현 완료** — 원본 §18의 "❌ 미구현"·§22의 "부분" 서술은 구버전 표기로 남기고 이 문서에서 재분류.
- ✅ **실측한 사실**: 로컬 `main`이 `origin/main`보다 **29 커밋 앞섬**. 법률 페이지 `[기재 예정]` **8곳** (terms/privacy/refund 각 파일에서 grep). 프로젝트 총 마이그레이션 25개, API 라우트 110개.
- ✅ **검증**: 새 문서 2건(신규 + 5줄 프리앰블). 코드 변경 없음이므로 `tsc/lint` 실행 대상 없음. `git status` 클린 유지.
- ⚠️ 미해결(다음 세션): [Part 4 · 백로그](#part-4) 참조. 특히 P0-1~P0-7이 파일럿 오픈 전 필수.

### 세션 로그 · 2026-07-12 (문서 통합·최신화)

- ✅ **HANDOFF.md 07-12 정정·추록** (내용 삭제 없이 취소선+갱신 주석 방식):
  - §0.1 6단계 규범 정정 — 수락 버튼은 **형식적 절차**, 마케팅·UI 강조 금지 (`CLAUDE.md` 07-08 개정 반영). 구 문구는 취소선 보존.
  - §0.4·Part 1·§3.1·P0-4: "29 커밋 미배포" → **push·배포 완료(대기 0)** 로 정정.
  - Part 1 역할 표 4→**5역할** (PARENT 07-10 신설), §2.2 동반 갱신.
  - §2.5 모델 추가분(ConsultationLead·Testimonial 확장·PARENT enum), §2.6 API **110→166**, §2.11 마이그레이션 **25→31** 실측 갱신.
  - **§3.4 신설** — 07-05~07-12 사이클 143커밋 날짜·영역별 추록 (Sprint 1, 설탭 벤치마크 개편, 실사 사진 교체, CRO, UX 감사 M-1~17, 보안 라운드, PARENT 역할, 디자인 핸드오프 적용+공개 페이지 revert, 통합 4역할 모바일 앱, 구독 일시정지, 파일럿 11R).
  - Part 4: P0-4·P0-7·P2-4 완료 처리(취소선), P1-1 부분 완료 주석, P2-1 범위 확대 주석.
- ✅ **docs/README.md 문서 지도 갱신** — 07-04 이후 신규 문서 8종 인덱싱 (seoltab-teardown, benchmark-seoltab, copy-proposals, design-direction, design-review, ux-audit-handoff, VULNERABILITY_AUDIT, FRONTEND_BUILD_SPEC).
- ✅ **FRONTEND_BUILD_SPEC 중복 단일화** — `design handoff/FRONTEND_BUILD_SPEC.md`를 원본으로 확정, 바이트 동일 사본이던 `docs/FRONTEND_BUILD_SPEC.md`는 포인터 스텁으로 교체.
- ✅ **루트 구버전 사업계획서 아카이브** — `concord_bizplan.docx`(.bak과 바이트 동일)·`.bak`·`.rtf`·`Concord_사업계획서_2026.docx` → `docs/archive/` 이동 (삭제 아님). `Concord_사업계획서_2026.md`는 원본 소스로 루트 유지.
- ✅ **수락 버튼 정책 고지 전파** — 수락을 강조하는 기존 문서들(MARKETING_PLAN, copy-proposals, design-direction, project-goals, external/APP_GUIDE·CEO_PROPOSAL·IR_ONE_PAGER, IMPLEMENTATION_SESSIONS_REVISED) 상단에 07-08 정책 변경 고지 추가. 본문은 수정하지 않음(기록 보존).
- 검증: 문서만 변경 — 코드 변경 없음. 커밋은 오너 요청 대기.
- ⚠️ 미해결: `docs/internal/API_REFERENCE.md` 재실측(110→166 증가분 반영), 6월 16일자 stale worktree 2개(`.claude/worktrees/agent-*`, 미커밋 cms 컴포넌트 잔존) 처분, `photos/` 116MB gitignore 여부 — 오너 결정 필요.

### 세션 로그 · 2026-07-12 (2차 — 주제별 단권화 재편)

- ✅ **docs/ 주제별 단권화** (오너 지시: 시간순·분산 구조로 파악이 어려움 → 주제별 재편, 내용 무손실):
  - 신설 6종: `00-현재상태.md`(신규 요약) · `10-사업전략.md`(BM v4.1+v3 전문 병합) · `11-사업리뷰·취약점.md`(BUSINESS_REVIEW+VULNERABILITY_AUDIT) · `20-마케팅.md`(MARKETING_PLAN+copy-proposals+설탭 2종) · `30-제품·디자인.md`(TRACKER+direction+CRO리뷰+UX감사+홈개선) · `40-파일럿.md`(SIM 1차).
  - 병합 방식: 원본 전문을 Part A/B/C…로 그대로 수록 + 상단에 현행 우선순위·수록표 헤더. 바이트 합산으로 무손실 확인.
  - 원본 15종은 `git mv`로 `docs/archive/` 이동 (히스토리 보존). 아카이브 내 상호 참조는 동일 폴더라 유효.
  - **의도적으로 유지한 파일**: `PILOT_SIM2_2026-07.md`(pilot-verify 스킬이 `docs/PILOT_SIM2_*.md` 글롭 참조 — **이동 금지**), IMPLEMENTATION 2종·MANAGER_GUIDELINES(§0.8 활성), REFACTORING_PLAN, PHOTO 2종, FRONTEND_BUILD_SPEC(스텁), 덱 소스 HTML 3종.
  - 웹 자료실(`DocsLibrary.tsx`)은 `public/docs/*.html`만 참조 — md 이동 영향 없음 확인.
  - `docs/README.md` 전면 재작성(새 지도), 이 파일 §5.1 갱신, 활성 문서 3종(IMPLEMENTATION 2종·REFACTORING_PLAN)에 경로 이동 고지 1줄씩 추가.
- 검증: 문서만 변경, 코드 무변경. 커밋은 오너 요청 대기.
- ⚠️ 규칙: 이후 세션은 전략·리뷰류 신규 문서를 만들지 말고 **해당 주제 단권에 Part 추가/갱신**할 것. 새 시점 스냅샷이 필요하면 단권 안에 날짜 절로 append.

### 세션 로그 · 2026-07-12 (3차 — UX 감사·수정 + 오너 결정 반영 + 프로덕션 정비)

- ✅ **오너 결정 반영**: 요금제 = 오너 심리 최적가 확정(중\|고: 38\|43·55\|58·76\|78·106\|112만, 코드값이 진실) — 할인 구조 제안·금액 변경 금지, P1-4 폐기. 문서 요금 감사에서 "38~108만" 오기 5곳 → 112만으로 정정.
- ✅ **RLS/스토리지 정책 프로덕션 적용** — `prisma/manual/20260705_...sql`을 question-images private 현행에 맞게 정정 후 적용. RLS 37테이블, anon 권한 0, 레거시 anon INSERT/UPDATE 정책 6개 제거(P0-6 종결). CMS 시딩 완료(SiteContent 1→1,184 · FAQ 4 · 후기 30 보존, `scripts/seed-cms.ts`).
- ✅ **프로덕션 스모크** — 가입→상담(자동생성)→치프 배정→매칭→수락→첫수업→숙제분배→이미지 업로드/프록시 접근제어(익명 401)까지 관통. 테스트 데이터(pilot3-smoke) 전량 삭제.
- ✅ **GA4 이중 계측** — `trackEvent`가 gtag 동시 전송, purchase/begin_checkout 표준 이벤트 매핑. `API_REFERENCE.md` 166 라우트 재실측(서브에이전트).
- ✅ **UX 어색 지점 감사** — opus 5팀 병렬, 75건(§30-제품·디자인 Part F). P0: 첫 수업 시각 UTC 저장 버그(두 팀 교차 발견).
- ✅ **UX 수정 구현** — opus 5팀 병렬(파일 소유권 분할): P0 KST 픽스(직접), 앱 학생(알림 딥링크·오늘 할 일·QnA 갱신), 학부모(학생 앱 연결 코드 발급 UI 신설·결제 컨텍스트), 결제(PARENT 체크아웃 분기+`/api/parent/payments/complete` 신설·success 재시도·PAUSED 무마찰 투영 — **정지 신청 가능성 노출 금지가 오너 정책**), 가입·상담(자동 접수 배너·리드→가입 이관), 공급자(matchReason "학생 공개" 명시·분배 미리보기·케어로그 기본 비공개·강사 정산 탭 신설). 전체 tsc·lint 클린.
- ✅ **외부 PDF 5종 재생성** — 수락 강조 제거(매니저 직접 배정 중심) + 요금 정정, `public/docs/` 동기화.
- ⚠️ 코드 변경분은 동시 세션의 `06cbcd7`(feat/reports)에 함께 커밋·push됨 — 커밋 귀속 혼재, 내용은 검증 완료.
- ⚠️ 미해결: 환불정책 v1 요금 예시 v2 갱신(공제 기준 오너 결정 필요), 웹/앱 QnA 모델 통일·학생 웹 리포트 라우트(설계 결정), L급 폴리시 잔여(Part F 참조).

### 세션 로그 · 2026-07-13 (UX 전수조사 2차 + 대규모 수정 + 수업 확인 제도)

- ✅ **UX 전수조사 2차** — opus 8팀(5도메인 회귀+확장, 신규: 어드민·알림시스템·크로스커팅), 신규 108건. `docs/30-제품·디자인.md` Part G. 방법론은 `.claude/skills/ux-sweep` 스킬로 저장(트리거: "전수조사").
- ✅ **회귀 검증**: 07-12 수정 43건 중 42건 정상. 실회귀 1건(케어로그 기본 공개 리셋) 즉시 수정.
- ✅ **오너 결정 3건 반영**: ① 미수락 매칭 3일 자동 확정 ② 학부모 알림 = 결제+핵심만 팬아웃 ③ **수업 확인 제도**(자동완료 폐지 — 오너 직접 설계 스펙, 메모리 `project_lesson_confirm` 참조): 종료 시각→강사 확인 알림→완료/사유(학생 과실=정산 포함, 비과실="마지막 수업으로 변경" 이월)→3자 공지, D+7 무응답 자동완료(잠정). 마이그레이션 `20260713090000_lesson_confirm`(nullable 3컬럼).
- ✅ **수정 8커밋** (`ad60145`~`11ef9ea`): 4역할 앱 알림 개방+학부모 팬아웃+딥링크, 학부모 미납 인지·앱 비대칭 해소·탈퇴, 수업 확인 제도, 인증 잠금 안내·모바일 rate-limit(보안), 어드민 confirm 가드·치프 서류 열람·CMS 검색, QnA 배지 회귀, 크로스커팅(다크 토큰·테이블 overflow·a11y·용어), 모바일 정산 화면·보강 실날짜·nextStep.
- ✅ expo-image-picker·document-picker 설치, 강사 모바일 업로드 UI 연결(진행).
- ⚠️ **push 차단 중**: 로컬 히스토리의 hourly 워크플로 커밋(3f89879) 때문에 PAT workflow scope 없이는 전체 push 거부. 동시 세션 활동으로 rebase는 회피. **오너 PAT 갱신이 배포+hourly cron+향후 push 모두의 유일 해소책.**
- ✅ (같은 날 후속 완주) E-UPLOAD 업로드 UI 연결(`00671f1`), 만료 구독 D+3 자동 마감(`9d15fea`), 감사로그 이름 표시+반려 사유·SMS(`e532a53`), API_REFERENCE 173 라우트(`49ff10b`), 로컬 프로덕션 빌드 통과 확인. 잔여: 매니저 내부 화면 용어 통일(선택), 배포 후 프로덕션 스모크.

### 세션 로그 · 2026-07-13 (오너 결정 12건 확정 + 즉시 반영 + biz-rounds 스킬)

- **오너 결정 1~12 확정** (MASTER §5 확정 블록·메모리 `project_decisions_2026-07-13`): D+7=이월(기구현 확인, 수정 0) · 서사 B(대면·밀도·큐레이션) · 스토어 연기 · AI 질답 키 활성 방침 · PARENT 결제 기본화 · 강사 집중 배치 · 총량 수치 실측 교체(적용 시점 별도) · 차등시급 수동 프리셋 · 검증 요소 강조. 강사 계약·크레딧 상한 보류.
- **코드**: `Teacher.hourlyRateKrw`(프리셋 32/34/40k, 정산 3경로+어드민 UI) · `PaymentCompletion.paidByUserId` 결제자 귀속(학생/학부모 라우트, 웹훅 무수정) · ai-answer 모델 claude-sonnet-4-6. 마이그레이션 SQL 2건 준비만(`20260713150000_teacher_hourly_rate`, `20260713160500_payment_paid_by_user`) — **프로덕션 선적용 후 배포**(추가 전용, 선적용 무해).
- **검증**: tsc·lint·prisma validate 클린, 회귀 테스트 2종 PASS(신규 학생 단독 결제 6 + 정산·환불 8).
- **문서**: MANAGER_GUIDELINES §6(검증 요소 능동 안내+서사 B) 신설. `.claude/skills/biz-rounds` 스킬 신설(R0~R6 라운드 루프 방법론+개선 10종).
- **오너 대기**: ANTHROPIC_API_KEY 발급·env 등록, 마이그레이션 적용 지시, 결정 13~16. 잔여 AI 작업: IR·외부 문서 서사 B 스윕, 로그인 후 화면 검증 카피 실물 적용, 학부모 빌링키 등록 신설 여부(오너 결정 사안으로 이월).

---

**끝.** 이 문서를 갱신했다면 [세션 로그](#part-5)에 엔트리를 append하고, 논리 단위로 항상 커밋한다 (push는 오너 승인).
