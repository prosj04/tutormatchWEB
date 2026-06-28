import { SafeAreaView } from "react-native-safe-area-context";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import {
  card,
  notif as notifS,
  scroll as scrollS,
} from "../styles/app-styles";
import { SubHead } from "../components/ui/SubHead";
import { useTheme } from "../theme/ThemeProvider";
import { accTint } from "../theme/tokens";

// ─── .ncat ────────────────────────────────────────────────────────────────────
// .ncat { padding:11 16 7; font-size:11; font-weight:800; letter-spacing:.06em; text-transform:uppercase; }
function NCategory({ label }: { label: string }) {
  const { t } = useTheme();
  return <Text style={[notifS.cat, { color: t.mut2 }]}>{label}</Text>;
}

// ─── .nrow (.unread) ──────────────────────────────────────────────────────────
function NRow({ accent, unread, icon, title, body, time, divider }: {
  accent: boolean; unread?: boolean; icon: string;
  title: string; body: string; time: string; divider?: boolean;
}) {
  const { t } = useTheme();
  return (
    <View style={[notifS.row, divider && { borderTopWidth: 1, borderTopColor: t.line }]}>
      <View style={[notifS.ic, { backgroundColor: accent ? accTint(t, 0.12) : t.panel2 }]}>
        <Text style={{ fontSize: 16 }}>{icon}</Text>
      </View>
      <View style={notifS.g}>
        <Text style={[notifS.gb, { color: t.fg }]}>{title}</Text>
        <Text style={[notifS.gp, { color: t.mut }]}>{body}</Text>
        <Text style={[notifS.tm, { color: t.mut2 }]}>{time}</Text>
      </View>
      {/* .nrow .ud width:8 height:8 border-radius:4 bg:acc margin-top:6 */}
      {unread && <View style={[notifS.ud, { backgroundColor: t.acc }]} />}
    </View>
  );
}

const SECTIONS = [
  { cat: "수업", items: [
    { accent: true, unread: true, icon: "📅", title: "오늘 수학 수업 19:00", body: "Teacher Noah · 시작 30분 전 다시 알려드릴게요.", time: "방금" },
  ]},
  { cat: "리포트 · 학습", items: [
    { accent: true, unread: true, icon: "📄", title: "9월 학습 리포트가 도착했어요", body: "이번 달 취약 유형 분석과 다음 달 계획을 확인하세요.", time: "2시간 전" },
    { accent: false, unread: false, icon: "✓", title: "과제 2개가 등록되었어요", body: "미적분 4단원 · 영어 독해 3편", time: "2일 전" },
  ]},
  { cat: "메시지", items: [
    { accent: false, unread: false, icon: "💬", title: "매니저 메시지", body: "지우 어머님, 이번 주 영어 진도 관련해 말씀드릴 게 있어요.", time: "어제" },
  ]},
  { cat: "결제", items: [
    { accent: false, unread: false, icon: "💳", title: "9월 수업료 결제 완료", body: "주 2회 플랜 · 740,000원", time: "9월 1일" },
  ]},
];

export default function NotificationsScreen() {
  const { t } = useTheme();
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      <ScrollView contentContainerStyle={[scrollS, styles.content]} showsVerticalScrollIndicator={false}>
        <SubHead title="알림" actionLabel="모두 읽음" />
        <View style={[card, styles.notifCard, { backgroundColor: t.panel, borderColor: t.line, shadowColor: t.fg }]}>
          {SECTIONS.map((section) => (
            <View key={section.cat}>
              <NCategory label={section.cat} />
              {section.items.map((item, i) => (
                <NRow key={item.title} {...item} divider={i > 0} />
              ))}
            </View>
          ))}
        </View>
        <View style={{ height: 6 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingBottom: 8 },
  notifCard: { overflow: "hidden" },
});
