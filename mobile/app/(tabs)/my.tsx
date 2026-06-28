import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  card,
  font,
  iconbtn,
  my as myS,
  scroll as scrollS,
  sectT as sectTS,
  switchStyle,
} from "../../styles/app-styles";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../theme/ThemeProvider";
import { accTint } from "../../theme/tokens";

// ─── .mrow 메뉴 행 ─────────────────────────────────────────────────────────────
// .mrow { flex-row; align:center; gap:13; padding:15 16; }
// .mrow .ic { width:36; height:36; border-radius:11; }
// .mrow .g b { font-size:14.5; font-weight:600; }
// .mrow .g p { font-size:12; margin-top:1; }
function MRow({
  icon,
  label,
  sub,
  trailing,
  onPress,
  divider,
}: {
  icon: string;
  label: string;
  sub?: string;
  trailing?: React.ReactNode;
  onPress?: () => void;
  divider?: boolean;
}) {
  const { t } = useTheme();
  const inner = (
    <View style={[myS.mrow, divider && { borderTopWidth: 1, borderTopColor: t.line }]}>
      <View style={[myS.mrowIc, { backgroundColor: t.panel2 }]}>
        <Text style={{ fontSize: 16 }}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[myS.mrowGb, { color: t.fg }]}>{label}</Text>
        {sub && <Text style={[myS.mrowGp, { color: t.mut }]}>{sub}</Text>}
      </View>
      {trailing ?? <Text style={[styles.chev, { color: t.mut2 }]}>›</Text>}
    </View>
  );
  return onPress ? <Pressable onPress={onPress}>{inner}</Pressable> : inner;
}

// ─── .switch (.on) ────────────────────────────────────────────────────────────
// .switch { width:42; height:25; border-radius:999; }
// .switch i { top:2.5; left:2.5; width:20; height:20; border-radius:10; bg:#fff; }
// .switch.on → bg:acc, thumb at right (left:42-2.5-20=19.5)
function Switch({ on }: { on: boolean }) {
  const { t } = useTheme();
  return (
    <View style={[switchStyle.track, { backgroundColor: on ? t.acc : t.line2 }]}>
      <View style={[switchStyle.thumb, { left: on ? 19.5 : 2.5 }]} />
    </View>
  );
}

export default function MyScreen() {
  const { t } = useTheme();
  const router = useRouter();
  const { logout } = useAuth();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      <ScrollView contentContainerStyle={[scrollS, styles.content]} showsVerticalScrollIndicator={false}>

        {/* .my-top flex-row align:center gap:14 padding:8 4 18 */}
        <View style={[myS.top]}>
          {/* .my-av width:60 height:60 border-radius:18 font-size:22 font-weight:800 */}
          <View style={[myS.av, { backgroundColor: accTint(t, 0.12) }]}>
            <Text style={[styles.avText, { color: t.accText }]}>지</Text>
          </View>
          <View style={{ flex: 1 }}>
            {/* .my-top .nm font-size:19 font-weight:800 letter-spacing:-.02em */}
            <Text style={[myS.nm, { color: t.fg }]}>지우 학부모님</Text>
            {/* .my-top .sub font-size:13 margin-top:2 */}
            <Text style={[myS.sub, { color: t.mut }]}>jiwoo.parent@email.com</Text>
          </View>
          {/* .iconbtn edit button */}
          <Pressable style={[iconbtn, { backgroundColor: t.panel, borderColor: t.line }]}>
            <Text style={{ fontSize: 16 }}>✏️</Text>
          </Pressable>
        </View>

        {/* 자녀 카드 */}
        <View style={[card, styles.childCard, { backgroundColor: t.panel, borderColor: t.line, shadowColor: t.fg }]}>
          <View style={[styles.childAv, { backgroundColor: t.panel2 }]}>
            <Text style={[styles.childAvText, { color: t.accText }]}>우</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.childName, { color: t.fg }]}>김지우</Text>
            <Text style={[styles.childSub, { color: t.mut }]}>중3 · 수학·영어 · 주 3회</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: accTint(t, 0.12) }]}>
            <Text style={[styles.statusText, { color: t.accText }]}>수강 중</Text>
          </View>
        </View>

        {/* .sect-t 관리 */}
        <Text style={[sectTS, styles.sectT, { color: t.fg }]}>관리</Text>

        <View style={[card, styles.menuCard, { backgroundColor: t.panel, borderColor: t.line, shadowColor: t.fg }]}>
          <MRow icon="💳" label="구독·결제" sub="주 2회 플랜 · 다음 결제 10/1" onPress={() => router.push("/billing")} />
          <MRow icon="📄" label="학습 리포트" onPress={() => {}} divider />
        </View>

        {/* .sect-t 설정 */}
        <Text style={[sectTS, styles.sectT, { color: t.fg }]}>설정</Text>

        <View style={[card, styles.menuCard, { backgroundColor: t.panel, borderColor: t.line, shadowColor: t.fg }]}>
          <MRow icon="🔔" label="알림 설정" trailing={<Switch on />} />
          <MRow icon="❓" label="고객센터" onPress={() => {}} divider />
          <MRow icon="📄" label="약관·정책" onPress={() => {}} divider />
        </View>

        {/* 로그아웃 */}
        <Pressable style={styles.logoutWrap} onPress={logout}>
          <Text style={[styles.logoutText, { color: t.mut2 }]}>로그아웃</Text>
        </Pressable>

        <View style={{ height: 6 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingBottom: 8 },

  avText: { fontSize: 22, fontFamily: font.extrabold },

  // 자녀 카드
  childCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    padding: 15,
    paddingHorizontal: 16,
  },
  childAv: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  childAvText: { fontSize: 16, fontFamily: font.bold },
  childName: { fontSize: 14.5, fontFamily: font.bold },
  childSub: { fontSize: 12.5, marginTop: 2 },
  statusBadge: { paddingVertical: 5, paddingHorizontal: 11, borderRadius: 999 },
  statusText: { fontSize: 11, fontFamily: font.bold },

  sectT: { fontSize: 14 },

  menuCard: { overflow: "hidden" },

  chev: { fontSize: 20, fontFamily: font.bold },

  logoutWrap: { paddingVertical: 18, paddingBottom: 4, alignItems: "center" },
  logoutText: { fontSize: 13, fontFamily: font.semibold },
});
