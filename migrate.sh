#!/usr/bin/env bash
#
# Supabase DB 마이그레이션: 구 프로젝트(인도네시아) → 신 프로젝트(서울)
# 공식 가이드: https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore
#
# 사용 전:
#   1) brew install supabase/tap/supabase  (또는 npm i -g supabase)
#   2) Docker Desktop 실행
#   3) brew install postgresql@17  (psql)
#   4) supabase login
#   5) 아래 변수 3개 채우기
#   6) chmod +x migrate.sh && ./migrate.sh
#
set -euo pipefail

# =============================================================================
# 설정 — 실행 전에 직접 채워 주세요
# =============================================================================
#
# PROJECT_REF_OLD: 구 프로젝트(인도네시아) ref
#   대시보드 URL 예) https://supabase.com/dashboard/project/abcdefghijklmnop
#   → ref = "abcdefghijklmnop"
#
PROJECT_REF_OLD=""

# PROJECT_REF_NEW: 신 프로젝트(서울) ref (복원 대상·확인용)
PROJECT_REF_NEW=""

# DIRECT_URL_NEW: 신 프로젝트 Direct connection (포트 5432, pooler 아님)
#   Dashboard → Connect → Direct connection
#   형식 예)
#   postgresql://postgres.[PROJECT_REF_NEW]:[DB_PASSWORD]@db.[PROJECT_REF_NEW].supabase.co:5432/postgres
#   서울 리전이면 호스트가 db.xxx.supabase.co 또는 pooler 호스트와 다를 수 있음 — 대시보드 값 그대로 사용
#
DIRECT_URL_NEW=""

# =============================================================================
# 경로·파일명 (보통 수정 불필요)
# =============================================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# backup.sql: 스키마 (Supabase CLI 기본 덤프)
# backup_data.sql: 데이터 (공식 가이드상 별도 덤프 필요 — 복원 시 함께 사용)
BACKUP_FILE="backup.sql"
BACKUP_DATA="backup_data.sql"

# =============================================================================
# 사전 검사
# =============================================================================
echo "==> 사전 검사"

if ! command -v supabase >/dev/null 2>&1; then
  echo "오류: Supabase CLI가 없습니다."
  echo "  macOS: brew install supabase/tap/supabase"
  echo "  또는: npm install -g supabase"
  exit 1
fi
echo "  Supabase CLI: $(supabase --version 2>/dev/null | head -1)"

if ! docker info >/dev/null 2>&1; then
  echo "오류: Docker Desktop이 실행 중이 아닙니다. supabase db dump에 Docker가 필요합니다."
  exit 1
fi
echo "  Docker: OK"

if ! command -v psql >/dev/null 2>&1; then
  echo "오류: psql이 없습니다. brew install postgresql@17"
  exit 1
fi
echo "  psql: $(psql --version)"

if [[ -z "${PROJECT_REF_OLD}" ]]; then
  echo "오류: PROJECT_REF_OLD를 스크립트 상단에 설정해 주세요."
  exit 1
fi
if [[ -z "${PROJECT_REF_NEW}" ]]; then
  echo "오류: PROJECT_REF_NEW를 스크립트 상단에 설정해 주세요."
  exit 1
fi
if [[ -z "${DIRECT_URL_NEW}" ]]; then
  echo "오류: DIRECT_URL_NEW를 스크립트 상단에 설정해 주세요."
  exit 1
fi

echo "  구 프로젝트 ref: ${PROJECT_REF_OLD}"
echo "  신 프로젝트 ref: ${PROJECT_REF_NEW}"

# 로그인 여부 (실패 시 login 안내)
if ! supabase projects list >/dev/null 2>&1; then
  echo ""
  echo "Supabase에 로그인되어 있지 않습니다. 브라우저 인증을 진행합니다."
  supabase login
fi
echo "  Supabase 로그인: OK"

# =============================================================================
# 1) 구 프로젝트 DB 덤프
# =============================================================================
echo ""
echo "==> [1/2] 구 프로젝트(${PROJECT_REF_OLD}) DB 덤프"

echo "  구 프로젝트에 link 중… (DB 비밀번호 입력이 필요할 수 있습니다)"
echo "  비밀번호: Dashboard → Project Settings → Database → Database password"
supabase link --project-ref "${PROJECT_REF_OLD}"

echo "  스키마 덤프 → ${BACKUP_FILE}"
supabase db dump --linked -f "${BACKUP_FILE}"

echo "  데이터 덤프 → ${BACKUP_DATA} (--data-only --use-copy)"
supabase db dump --linked -f "${BACKUP_DATA}" --data-only --use-copy \
  -x "storage.buckets_vectors" -x "storage.vector_indexes"

if [[ ! -s "${BACKUP_FILE}" ]]; then
  echo "오류: ${BACKUP_FILE}이 비어 있습니다. 덤프가 실패했을 수 있습니다."
  exit 1
fi
echo "  덤프 완료: ${BACKUP_FILE} ($(wc -c < "${BACKUP_FILE}" | tr -d ' ') bytes)"
if [[ -f "${BACKUP_DATA}" ]]; then
  echo "           ${BACKUP_DATA} ($(wc -c < "${BACKUP_DATA}" | tr -d ' ') bytes)"
fi

# =============================================================================
# 2) 신 프로젝트 DB 복원
# =============================================================================
echo ""
echo "==> [2/2] 신 프로젝트(${PROJECT_REF_NEW}) DB 복원"
echo "  주의: 신 프로젝트는 비어 있거나, 스키마 충돌이 없는 상태에서 실행하세요."
echo "  Prisma를 쓰는 경우: 스키마 덤프 vs prisma migrate deploy 중 하나로 통일하는 것을 권장합니다."

echo "  스키마 복원 중 (${BACKUP_FILE})…"
psql "${DIRECT_URL_NEW}" \
  --single-transaction \
  --variable ON_ERROR_STOP=1 \
  --file "${BACKUP_FILE}"

if [[ -f "${BACKUP_DATA}" && -s "${BACKUP_DATA}" ]]; then
  echo "  데이터 복원 중 (${BACKUP_DATA})…"
  psql "${DIRECT_URL_NEW}" \
    --single-transaction \
    --variable ON_ERROR_STOP=1 \
    --command "SET session_replication_role = replica" \
    --file "${BACKUP_DATA}"
else
  echo "  경고: ${BACKUP_DATA} 없음 — 스키마만 복원했습니다."
fi

echo ""
echo "==> 완료"
echo "  다음 작업:"
echo "  1) .env / Vercel의 DATABASE_URL, DIRECT_URL을 서울 프로젝트(${PROJECT_REF_NEW})로 변경"
echo "  2) NEXT_PUBLIC_SUPABASE_URL, ANON_KEY 갱신"
echo "  3) 필요 시: npx prisma migrate deploy (스키마를 Prisma로만 맞출 때)"
echo "  4) Storage 버킷·파일은 DB와 별도 — 대시보드에서 수동 이전 검토"
