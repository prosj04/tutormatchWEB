# Concord 디자인 적용 — Claude Code 핸드오프 (전체 패키지)

TutorMatch(Concord) 서비스 전체 — **웹 마케팅 페이지 · 웹 포털 · 모바일 앱 4역할** — 에 통일된 디자인 시스템(그린·블루 × 라이트·다크)을 적용하기 위한 패키지입니다.

> ⚠️ **먼저 `IMPLEMENTATION_CONTRACT.md`를 읽으세요.** 디자인이 자꾸 틀어지는(폰트·여백·색·크기) 근본 원인과, 1픽셀도 어긋나지 않게 구현하는 규칙이 담겨 있습니다. 핵심: **CSS를 다시 만들지 말고 그대로 import. 아이콘을 새로 그리지 말고 `app/icons.js`에서 이름으로 호출.**

---

## 읽는 순서

1. `IMPLEMENTATION_CONTRACT.md` — 드리프트 방지 규칙 (재작성 금지·폰트 고정·아이콘 고정·검수 체크리스트)
2. `README.md` (이 파일) — 패키지 구성 파악
3. `CLAUDE_CODE_PROMPT.md` — 단계별 작업 지시 (그대로 붙여넣어 사용 가능)
4. 작업 대상 영역의 소스 CSS + 시안 HTML

---

## 패키지 구성

### 규칙·문서
| 파일 | 역할 |
|---|---|
| **`IMPLEMENTATION_CONTRACT.md`** | ★ 최우선. 드리프트 방지 규칙·폰트 고정·아이콘 규칙(§3b)·검수 체크리스트 |
| `DESIGN_SYSTEM.md` | 토큰 사용 규칙·타이포 위계·간격·모션·접근성·금지사항 |
| `tokens-reference.css` | 토큰만 추린 참고본 (웹/앱 공통 원본, RN 포팅용) |
| `ROUTE_MAP.md` | 시안 HTML ↔ 라우트/컴포넌트 매핑 (웹 + 포털 + 앱) |
| `MOBILE_HANDOFF.md` | 모바일 앱 화면 흐름·라우트·컴포넌트 매핑 |
| `CLAUDE_CODE_PROMPT.md` | 단계별 작업 프롬프트 |
| `reference/*.png` | **정답 스크린샷** (green-light 전체 + blue-dark 샘플). 구현 결과를 픽셀로 대조 |

### 진짜 소스 (그대로 import — 수정 금지)
| 파일 | 적용 대상 |
|---|---|
| `site/concord.css` | 웹 마케팅 페이지 전체 (토큰 4조합 + 모든 컴포넌트) |
| `site/concord.js` | 웹 동작: 테마 토글·영속화, 헤더 스크롤, 리빌, 아코디언, 탭 |
| `web/portal.css` | 웹 포털 (선생님·매니저·학부모 데스크톱 화면) |
| `app/concord-app.css` | 모바일 앱 전체 (4역할 공통 토큰 + 컴포넌트) |
| `app/icons.js` | **전체 아이콘 단일 소스** — `icon('bell')` 형태로 호출. 새 아이콘 생성 금지 |

### 시안 HTML (구조·마크업 레퍼런스 — 브라우저로 열어 대조)
| 파일 | 내용 |
|---|---|
| `Concord - Green v2.html` / `Concord - Blue.html` | 홈(랜딩) 그린/블루 |
| `Pricing.html` `Tutors.html` `FAQ.html` `Reviews.html` `Login.html` | 웹 마케팅 라우트별 |
| `Concord - 웹 포털.html` | 웹 포털: 선생님·매니저 역할 전환 데스크톱 |
| `Concord - 웹 학부모.html` | 웹 포털: 학부모 데스크톱 |
| `Concord - 모바일 앱.html` | 학생 앱 전체 흐름 (온보딩~구독~학습~질문) |
| `Concord - 학부모 앱.html` | 학부모 앱 (숙제 확인·선생님 메시지·결제) |
| `Concord - 선생님 앱.html` | 선생님 앱 |
| `Concord - 매니저 앱.html` | 매니저 앱 |
| `Concord - 아이콘 세트.html` | 아이콘 전체 갤러리 (icons.js에서 렌더, 이름 확인용) |
| `Concord - 로고 키트.html` | 확정 로고(C-Bed 새싹) 사용 가이드 |
| `Concord - 페이지 디자인.html` | 서브페이지 종합 비교 뷰 |

모든 시안은 우측 상단에서 **그린/블루 × 라이트/다크** 4조합을 전환하며 확인할 수 있습니다.

---

## 적용 원칙 (요약)

0. **`IMPLEMENTATION_CONTRACT.md` 규칙을 따른다** — CSS 재작성 금지, 그대로 import. 폰트 Pretendard 1.3.9 고정.
1. **토큰이 단일 소스** — 색·px·반경·폰트크기를 컴포넌트에 직접 쓰지 말고 `var(--…)`만 사용. Tailwind는 `theme.extend`에서 `var()` 참조.
2. **테마 상태는 `<html data-color="green|blue" data-theme="light|dark">`** — localStorage 키 `concord-color` / `concord-mode`. 웹·포털·앱 모두 동일 메커니즘.
3. **아이콘은 `app/icons.js`에서만** — 다른 라이브러리 대체 금지, 임의 생성 금지 (계약서 §3b).
4. **HTML 시안은 구조 레퍼런스** — 기존 React 컴포넌트/CMS/DB 데이터 바인딩은 유지하고, 클래스·마크업 구조와 토큰만 맞춘다.
5. **모바일(RN)은 CSS를 import할 수 없으므로** `concord-app.css`의 값을 `app-styles.ts`로 1:1 복사 이식 — 값을 "비슷하게"가 아니라 그대로.
6. 구현 후 같은 화면의 시안 HTML을 브라우저로 열어 **나란히 대조**하고, 4조합 모두에서 색이 토큰대로 바뀌는지 확인한다.
