-- 모바일 JWT 회전·폐기: 토큰 버전 컬럼. 로그아웃·비밀번호 변경 시 +1하면
-- 이전에 발급된 access·refresh 토큰이 전부 무효화된다. 추가 전용 — 기존 행 영향 없음.
ALTER TABLE "User" ADD COLUMN "tokenVersion" INTEGER NOT NULL DEFAULT 0;
