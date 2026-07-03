# 실사 인물 사진 생성 프롬프트 (이미지 생성 AI 전달용)

> 용도: 홈페이지 선생님 카드 4종 + 매니저 1종 + 히어로 보조 1종.
> 각 이미지는 **선별용으로 5장씩 변형 생성** (총 30장), 최종 채택은 이미지당 1장.
> 기술 스펙: 카드가 4:3 비율 + 상단 크롭(`object-top`)이므로 머리 위 여백(headroom)이 필수.

---

## 공통 지시 (모든 이미지 앞에 붙이기)

```
Generate 5 distinct variations of each image described below, so the client can select the best one. Keep the same person, outfit, lighting, and background across the 5 variations of a single image — vary only the pose, head angle, and expression slightly.

Ultra-realistic professional portrait photograph, shot on a full-frame DSLR with an 85mm lens at f/2.8, soft diffused studio lighting, clean warm off-white seamless background (#FAF9F4 tone). Natural skin texture, no beauty-filter smoothing, no AI artifacts. Subject framed chest-up with generous headroom above the head (image will be cropped from the top). Warm, approachable, trustworthy expression — premium education brand tone. No text, no watermark, no logo. Aspect ratio 4:3, minimum 1280×960px.

All portraits in this series must share identical lighting, background color, and camera distance so they look like one photoshoot.
```

## 개별 이미지 (4종 × 5장 — 선생님 카드)

```
1) teacher-math (5 variations) — A Korean man in his late 20s, tutor. Navy knit sweater over white shirt. Confident gentle smile, arms relaxed. (수학 · Teacher Noah)

2) teacher-english (5 variations) — A Korean woman in her late 20s, tutor. Beige blazer over ivory top, shoulder-length dark hair. Bright friendly smile. (영어 · Teacher Olivia)

3) teacher-physics (5 variations) — A Korean man in his early 30s, tutor. Charcoal cardigan, thin metal glasses. Calm intelligent expression, slight smile. (물리 · Teacher Peter)

4) teacher-korean (5 variations) — A Korean woman in her early 30s, tutor. Soft grey blouse, neat low ponytail. Warm composed smile. (국어 · Teacher Jiwoo)
```

## 개별 이미지 (1종 × 5장 — 매니저, 대면 상담 신뢰용)

```
5) manager (5 variations) — A Korean woman in her late 30s, education consultant/manager. Dark tailored jacket, minimal accessories. Sincere reassuring smile, slightly leaning forward as if listening to a parent. Same studio setup as the tutor series.
```

## 선택 (1종 × 5장 — 히어로 보조 카드)

```
6) hero-lesson (5 variations) — Candid documentary-style photo: a Korean tutor in their 20s and a Korean high-school student sitting side by side at a bright desk, tutor pointing at a workbook, student focused. Natural window light, shallow depth of field, warm tones matching the portrait series. Landscape 4:3, no text or logos. For the 5 variations, vary the camera angle and moment (explaining, writing, smiling together) while keeping the same two people and setting.
```

## 네거티브 프롬프트 (지원되는 도구라면)

```
cartoon, illustration, 3D render, plastic skin, over-smoothed, extra fingers, distorted hands, watermark, text, logo, stock-photo cheesiness, harsh shadows, cluttered background
```

## 파일명 규칙 (선별 후)

- 변형 5장: `teacher-math-1.jpg` ~ `teacher-math-5.jpg` 형식으로 받기
- 최종 채택본만 `teacher-math.jpg` 등으로 리네임 후 `public/images/teachers/`에 배치
- 상단 크롭 특성상 이마가 잘리지 않도록 headroom이 넉넉한 컷 위주로 선별

## 적용 절차 (개발 측)

1. 최종 6장을 `public/images/teachers/` (히어로는 `public/images/`)에 배치
2. `LandingPageV2.tsx`의 `teachers` 배열 image 경로 교체
3. `cms-page-defaults.ts`의 `tutors_page.public_photo_male/female` 기본값 교체 검토
4. 다크 모드에서 카드 배경과의 조화 확인
