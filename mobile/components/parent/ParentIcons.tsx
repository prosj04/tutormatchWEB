import React from "react";
import Svg, { Path, Rect } from "react-native-svg";

interface IconProps {
  color?: string;
  size?: number;
}

// icons.js 'plus' 대응 — 자녀 추가 연결 등
export function PlusIcon({ color = "currentColor", size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 5v14M5 12h14" />
    </Svg>
  );
}

// 학부모 앱 시안 QR 스캔 버튼 인라인 svg 그대로
export function QrIcon({ color = "currentColor", size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Rect x={3} y={3} width={7} height={7} rx={1} />
      <Rect x={14} y={3} width={7} height={7} rx={1} />
      <Rect x={3} y={14} width={7} height={7} rx={1} />
      <Path d="M14 14h3v3M21 14v7h-7" />
    </Svg>
  );
}

// 경고 배너 아이콘 (circle + ! ) — 학부모 시안 .banner.warn
export function AlertCircleIcon({ color = "currentColor", size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 8v4M12 16h.01" />
      <Path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" />
    </Svg>
  );
}

// icons.js 'info' 대응 — 정보 배너
export function InfoIcon({ color = "currentColor", size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" />
      <Path d="M12 16v-4M12 8h.01" />
    </Svg>
  );
}

// 자동 갱신(카드 교체) 아이콘 — 학부모 결제 시안 .tok .ic
export function RenewIcon({ color = "currentColor", size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M17 2v6M14 5h6M21 12v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" />
    </Svg>
  );
}
