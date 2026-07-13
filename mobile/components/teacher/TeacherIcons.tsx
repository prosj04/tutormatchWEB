import React from "react";
import Svg, { Circle, Path, Rect } from "react-native-svg";

interface IconProps {
  color?: string;
  size?: number;
}

/**
 * 선생님 앱 전용 아이콘 — design handoff/app/icons.js 의 path를 그대로 이식.
 * 기존 components/ui/Icons.tsx 는 수정하지 않는다(계약).
 * 24×24 · currentColor(=color) · stroke 2 round cap/join.
 */

// 'message' (탭바 질문)
export function MessageIcon({ color = "currentColor", size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </Svg>
  );
}

// 'info' — 정보 배너
export function InfoCircleIcon({ color = "currentColor", size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={12} cy={12} r={10} />
      <Path d="M12 16v-4M12 8h.01" />
    </Svg>
  );
}

// 'image' — 사진 첨부(프로필 사진 · 질문 첨부)
export function ImageIcon({ color = "currentColor", size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Rect x={3} y={3} width={18} height={18} rx={2} />
      <Circle cx={8.5} cy={8.5} r={1.5} />
      <Path d="m21 15-5-5L5 21" />
    </Svg>
  );
}

// 'file-text' — 숙제 템플릿(문서+텍스트 라인)
export function FileTextIcon({ color = "currentColor", size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <Path d="M14 2v6h6M9 13h6M9 17h4" />
    </Svg>
  );
}

// 'file' — 일반 파일(불러오기 버튼)
export function FileBlankIcon({ color = "currentColor", size = 24 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <Path d="M14 2v6h6" />
    </Svg>
  );
}
