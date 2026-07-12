-- ============================================================================
-- RLS + Storage 정책 (BR-14 / R-2) — 준비본
--
-- 2026-07-12 갱신: question-images를 private 모델로 정정(07-09 보안 전환 반영).
-- ⚠️ 경영자 승인(E4-5) — 2026-07-12 승인 완료, 적용 진행. Supabase 대시보드 SQL Editor에서
--    프로덕션에 직접 실행한다. prisma migrate 대상 아님(storage 스키마 포함).
--
-- 전제 (2026-07-05 코드 실측):
--  - 앱 DB 접근은 전부 Prisma(직결) + 서버 라우트의 service_role 키 경유.
--  - anon/authenticated 키로는 DB·스토리지 쓰기를 하지 않는다
--    (업로드는 /api/* 라우트가 service_role로 수행).
--  - 따라서 anon/authenticated는 전면 차단해도 앱 동작에 영향 없음.
--    service_role과 Prisma 직결(postgres 롤)은 RLS를 우회한다.
--
-- 버킷 접근 모델:
--  - teacher-photos  : 공개 읽기 (getPublicUrl) → public 유지
--  - cms-images      : 공개 읽기 (getPublicUrl) → public 유지
--  - question-images : 비공개 — 2026-07-09 private 전환 완료(7f1949f),
--                      서빙은 /api/question-images/[...path] 프록시 경유
--  - teacher-documents: 비공개 (createSignedUrl 10분) → private 유지
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) public 스키마 전 테이블: RLS 활성화 + anon/authenticated 권한 회수
--    정책을 하나도 만들지 않으므로 RLS 활성화 = 전면 거부 (deny-by-default).
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  t record;
BEGIN
  FOR t IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated', t.tablename);
  END LOOP;
END $$;

-- 시퀀스·함수 기본 권한도 회수 (anon 키로 nextval 등 호출 차단)
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2) 스토리지: 버킷 공개 설정 정합 + objects 정책
--    (storage.objects는 Supabase가 RLS를 기본 활성화)
-- ---------------------------------------------------------------------------

-- 버킷 공개/비공개 플래그를 코드의 접근 모델과 일치시킨다.
UPDATE storage.buckets SET public = true  WHERE id IN ('teacher-photos', 'cms-images');
UPDATE storage.buckets SET public = false WHERE id IN ('teacher-documents', 'question-images');

-- 기존의 과도한(permissive) 정책이 있으면 제거 후 최소 정책만 재생성.
DROP POLICY IF EXISTS "public read buckets" ON storage.objects;
DROP POLICY IF EXISTS "anon uploads" ON storage.objects;
DROP POLICY IF EXISTS "authenticated uploads" ON storage.objects;

-- 공개 버킷 읽기만 허용 (public URL 서빙 경로). 쓰기 정책은 만들지 않는다 —
-- 업로드·삭제는 전부 service_role(정책 우회) 경유.
CREATE POLICY "public read buckets"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id IN ('teacher-photos', 'cms-images'));

-- ---------------------------------------------------------------------------
-- 3) 적용 후 검증 쿼리 (수동 실행)
-- ---------------------------------------------------------------------------
-- RLS 활성화 확인:
--   SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public' ORDER BY 1;
-- anon 권한 회수 확인(0행이어야 함):
--   SELECT table_name, privilege_type FROM information_schema.role_table_grants
--   WHERE grantee IN ('anon','authenticated') AND table_schema='public';
-- 스토리지 정책 확인:
--   SELECT polname, polcmd FROM pg_policy WHERE polrelid = 'storage.objects'::regclass;
-- 앱 회귀 확인: 강사 사진/서류 업로드, 학생 질문 이미지 업로드, CMS 이미지 업로드,
--   강사 서류 signed URL 열람이 모두 정상인지 확인.
--
-- 롤백(비상시):
--   각 테이블 ALTER TABLE public."<t>" DISABLE ROW LEVEL SECURITY;
--   GRANT는 Supabase 기본값 복원: GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
