import React from "react";
import Svg, { Path } from "react-native-svg";

interface IconProps {
  color?: string;
  size?: number;
}

// 매니저 앱 시안 탭바 인라인 svg 그대로 — 상담 (chat bubble)
export function ConsultTabIcon({ color = "currentColor", size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </Svg>
  );
}

// 매칭 (expand arrows)
export function MatchTabIcon({ color = "currentColor", size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M16 3h5v5M8 21H3v-5M21 3l-7 7M3 21l7-7" />
    </Svg>
  );
}

// 모니터링 (chart)
export function MonitorTabIcon({ color = "currentColor", size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 3v18h18" />
      <Path d="m7 14 4-4 4 3 5-6" />
    </Svg>
  );
}

// 도구 (wrench)
export function ToolTabIcon({ color = "currentColor", size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M14.7 6.3a5 5 0 0 0-6.6 6.6L3 18v3h3l5.1-5.1a5 5 0 0 0 6.6-6.6L14 13l-3-3z" />
    </Svg>
  );
}
