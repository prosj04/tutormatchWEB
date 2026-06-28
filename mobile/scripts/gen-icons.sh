#!/usr/bin/env bash
# Concord 앱 아이콘 생성 스크립트 (ImageMagick + SVG)
# 사용: bash mobile/scripts/gen-icons.sh
set -e

ASSETS="$(cd "$(dirname "$0")/../assets" && pwd)"
GREEN="#10B981"

echo "→ Generating Concord C· icons..."

# iOS app icon — 1024×1024, 초록 둥근사각 배경 + 흰 C·
magick -background none -density 300 <(cat << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" rx="230" ry="230" fill="#10B981"/>
  <text x="470" y="650" font-family="Pretendard Black,Pretendard,sans-serif" font-weight="900" font-size="560" fill="white" text-anchor="middle">C</text>
  <circle cx="750" cy="290" r="68" fill="white"/>
</svg>
EOF
) -resize 1024x1024 "$ASSETS/icon.png"
echo "  ✓ icon.png (1024×1024)"

# Android adaptive foreground — 432×432, 흰 C· on 투명
magick -background none -density 300 <(cat << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 432 432">
  <text x="196" y="278" font-family="Pretendard Black,Pretendard,sans-serif" font-weight="900" font-size="236" fill="white" text-anchor="middle">C</text>
  <circle cx="316" cy="122" r="29" fill="white"/>
</svg>
EOF
) -resize 432x432 "$ASSETS/android-icon-foreground.png"
echo "  ✓ android-icon-foreground.png (432×432, white on transparent)"

# Android adaptive background — 432×432, 단색 초록
magick -size 432x432 xc:"$GREEN" "$ASSETS/android-icon-background.png"
echo "  ✓ android-icon-background.png (432×432, solid green)"

# Android monochrome — foreground와 동일
cp "$ASSETS/android-icon-foreground.png" "$ASSETS/android-icon-monochrome.png"
echo "  ✓ android-icon-monochrome.png"

# Splash icon — 512×512, 초록 C· on 투명
magick -background none -density 300 <(cat << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <text x="230" y="330" font-family="Pretendard Black,Pretendard,sans-serif" font-weight="900" font-size="280" fill="#10B981" text-anchor="middle">C</text>
  <circle cx="374" cy="144" r="34" fill="#10B981"/>
</svg>
EOF
) -resize 512x512 "$ASSETS/splash-icon.png"
echo "  ✓ splash-icon.png (512×512)"

# Favicon — 48×48, 작은 초록 타일
magick -background none -density 300 <(cat << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <rect width="48" height="48" rx="10" ry="10" fill="#10B981"/>
  <text x="21" y="37" font-family="Pretendard Black,Pretendard,sans-serif" font-weight="900" font-size="30" fill="white" text-anchor="middle">C</text>
  <circle cx="36" cy="13" r="4" fill="white"/>
</svg>
EOF
) -resize 48x48 "$ASSETS/favicon.png"
echo "  ✓ favicon.png (48×48)"

echo "Done. 색상 변경 시 GREEN 변수만 수정 후 재실행."
