#!/usr/bin/env bash
#
# 구 Supabase(인도네시아) → 신 Supabase(서울) 데이터만 이전
# 전제: 서울 DB에 이미 npx prisma migrate deploy 완료 (빈 테이블)
#
# 사용: chmod +x scripts/migrate-data-only.sh && ./scripts/migrate-data-only.sh
#
set -euo pipefail

PROJECT_REF_OLD="${PROJECT_REF_OLD:-orvqtnrdxlfyyoscejqf}"
BACKUP_DATA="backup_data.sql"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$SCRIPT_DIR"

load_direct_url() {
  if [[ -f "${SCRIPT_DIR}/.env" ]]; then
    local line
    line=$(grep -E '^DIRECT_URL=' "${SCRIPT_DIR}/.env" | head -1 || true)
    if [[ -n "${line}" ]]; then
      DIRECT_URL="${line#DIRECT_URL=}"
      DIRECT_URL="${DIRECT_URL%\"}"
      DIRECT_URL="${DIRECT_URL#\"}"
    fi
  fi
}

load_direct_url

echo "==> 사전 검사"
command -v supabase >/dev/null || { echo "supabase CLI 필요"; exit 1; }
command -v psql >/dev/null || { echo "psql 필요"; exit 1; }
docker info >/dev/null 2>&1 || {
  echo "Docker Desktop을 실행한 뒤 다시 시도하세요."
  exit 1
}

if [[ -z "${DIRECT_URL:-}" ]]; then
  echo "오류: .env 의 DIRECT_URL 이 없습니다."
  exit 1
fi

if ! supabase projects list >/dev/null 2>&1; then
  echo "supabase login 필요"
  supabase login
fi

echo ""
echo "==> [1/2] 구 프로젝트(${PROJECT_REF_OLD}) 데이터 덤프"
echo "  (DB 비밀번호 입력이 나오면 구 프로젝트 Database password)"
supabase link --project-ref "${PROJECT_REF_OLD}"

supabase db dump --linked -f "${BACKUP_DATA}" --data-only --use-copy \
  -x "storage.buckets_vectors" -x "storage.vector_indexes"

if [[ ! -s "${BACKUP_DATA}" ]]; then
  echo "오류: ${BACKUP_DATA} 비어 있음"
  exit 1
fi
echo "  덤프 완료: ${BACKUP_DATA}"

echo ""
echo "==> [2/2] 서울 DB에 데이터 복원"
psql "${DIRECT_URL}" \
  --single-transaction \
  --variable ON_ERROR_STOP=1 \
  --command "SET session_replication_role = replica" \
  --file "${BACKUP_DATA}"

echo ""
echo "==> 완료"
echo "  Storage 실제 파일(이미지·PDF)은 DB와 별도 — 버킷 파일은 수동 이전이 필요할 수 있습니다."
echo "  관리자 없으면: /login?setup=admin (ADMIN_SETUP_SECRET 설정 후)"
