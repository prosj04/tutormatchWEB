# 전량 보안 감사 (2026-07-14)

4개 도메인(인증/인가, 결제, 입력/XSS, 시크릿/설정) 감사. 도구: ecc security-review 스킬 + opus 서브에이전트. 검증: tsc(웹·모바일)·lint·프로덕션 빌드 전부 통과.

## 수정 완료 (7커밋, push 대기)

| 커밋 | 내용 |
|------|------|
| 2189693 | 범용 rate limiter src/lib/rate-limit.ts 신설(인스턴스 메모리) — AI 질답(유저당 1분 5회)·회원가입 4종·관리자 복구(IP당 10분 5회)·이벤트 수집(IP당 1분 30회) 적용 |
| 90c0a6d | 입력 상한 — /api/events body 10KB(413), /api/questions content 5,000자(400) |
| 3b5d9c4 | 사진 업로드 3곳 error.message 노출 제거 — 일반 메시지 + 서버 로그 |
| 1ffa8b7 | Toss ALREADY_PROCESSED_PAYMENT 재시도 시 fetchTossPayment 재조회로 orderId·status·amount 3중 검증 — FAILED 재시도 금액 부풀리기로 상위 플랜 취득 경로 차단 |
| c36aa16 | 전역 보안 헤더 5종 — X-Frame-Options DENY·nosniff·Referrer-Policy·HSTS 2년·Permissions-Policy (CSP는 인라인 테마 스크립트 때문에 보류) |
| bffa33d | CLAUDE_HANDOFF.md 평문 비밀번호 플레이스홀더화 + 시드 스크립트 SEED_PORTAL_PASSWORD/SEED_STAFF_PASSWORD env 필수화 |
| 5906c62 | 모바일 토큰 AsyncStorage 평문 → expo-secure-store (기존 사용자 무손실 이관 폴백 포함) |

## 통과 판정 (수정 불요)

- 결제: 금액 무결성(Toss confirm + planIdFromAmount 서버 도출), orderId 멱등성(unique + 상태 가드), 웹훅(본문 불신·Toss 서버 재조회 검증), 환불(역할 가드·Toss 선취소·원자 전환·감사로그), 빌링키 customerKey 세션 학생 바인딩, TOSS_SECRET_KEY 서버 전용
- 인증: 160개 라우트 중 150 가드·10 의도적 공개, SQL 인젝션 0(전부 Prisma), dangerouslySetInnerHTML 전부 정적, SSRF 없음, 오픈 리다이렉트 없음, cron Bearer 인증

## 오너 결정 대기 (코드 미수정)

| 항목 | 위험 | 필요 조치 |
|------|------|-----------|
| 프로덕션 실 비밀번호 회전 | HIGH — "11111111"/"Sample1234!"가 git 히스토리에 잔존, 레포 GitHub 존재 | 오너가 prod DB 계정 비밀번호 변경. 히스토리 정리(BFG)는 선택 |
| 모바일 refresh 토큰 무회전·무폐기 | HIGH — 60일 stateless, 로그아웃해도 서버측 무효화 없음 | 스키마 변경(tokenVersion 등) 필요 — 설계 결정 |
| next 14 취약점 6건(high 4) | HIGH — 캐시 포이즈닝·DoS 등, 패치판 없음(14.2.35가 마지막) | next 15/16 업그레이드 결정 필요(브레이킹) |
| 웹·모바일 AUTH_SECRET 공유 | LOW | 키 분리 시 모바일 전원 재로그인 발생 — 트레이드오프 판단 |
| 액세스 토큰 7일 + 비밀번호 변경 시 미무효화 | MEDIUM | refresh 회전과 같은 설계 건으로 묶어 처리 권장 |
| CSP 도입 | MEDIUM | 인라인 스크립트 정리 필요 — 디자인 영향, 눈확인 사안 |
| 시드 스크립트 실행 절차 변화 | 참고 | 이제 SEED_PORTAL_PASSWORD·SEED_STAFF_PASSWORD env 필요 |

## 잔여 LOW (기록만)

- /api/events 비인증 쓰기(rate limit로 완화됨), imageUrl 임의 문자열 허용, question-images MIME 클라이언트 신뢰, db-check가 CHIEF_MANAGER에 정보 노출
