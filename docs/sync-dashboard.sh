#!/usr/bin/env bash
# docs/*.md -> 브랜드 HTML 재빌드 -> 개인 대시보드(concord-docs) 반영 -> push(=Vercel 배포).
# 수동: bash docs/sync-dashboard.sh   |   자동: premium-tutoring post-commit 훅에서 호출.
set -euo pipefail
REPO="/Users/mac/Documents/premium-tutoring"
DASH="/Users/mac/Documents/dashboards"
cd "$REPO"

# marked 자기치유(없으면 설치, package.json 불변)
node -e "require.resolve('marked')" 2>/dev/null || npm i marked --no-save >/dev/null 2>&1

# 대시보드로 직접 빌드(premium 트리 오염 없음)
OUT_DIR="$DASH/concord-docs" node docs/build-html.mjs >/dev/null

cd "$DASH"
git add concord-docs
if git diff --cached --quiet; then
  echo "sync: 변경 없음"
  exit 0
fi
git commit -q -m "chore(docs): Concord 문서 자동 동기화 $(date +%F' '%H:%M)"
git push -q && echo "sync: 반영+배포 완료" || echo "sync: 커밋됨(푸시 실패 — 수동 push 필요)"
