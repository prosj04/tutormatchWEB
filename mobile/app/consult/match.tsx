import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  ctaBar as ctaBarS,
  font,
  rec as recS,
  scroll as scrollS,
} from "../../styles/app-styles";
import { SubHead } from "../../components/ui/SubHead";
import { useTheme } from "../../theme/ThemeProvider";
import { accTint } from "../../theme/tokens";

// ─── 매칭 배지 ────────────────────────────────────────────────────────────────
// .match-badge { flex-row; gap:6; font-size:12; font-weight:800; padding:7 13; border-radius:999; }
function MatchBadge() {
  const { t } = useTheme();
  return (
    <View style={[recS.badge, { backgroundColor: accTint(t, 0.12) }]}>
      <Text style={{ color: t.accText, fontSize: 14, fontFamily: font.bold }}>✓</Text>
      <Text style={[styles.badgeText, { color: t.accText }]}>매니저가 직접 매칭했어요</Text>
    </View>
  );
}

// ─── 추천 강사 카드 ────────────────────────────────────────────────────────────
// .card.rec-card { padding:16; margin-top:11; border:1px solid line; border-radius:20; shadow-sm; }
// .rec-card .h { flex-row; gap:13; }
// .rec-card .ph { width:58; height:58; border-radius:16; border:1px; }
// .rec-card .vb { bottom:-5; right:-5; width:22; height:22; border-radius:11; }
// .rec-card .nm { font-size:16; font-weight:800; letter-spacing:-.02em; }
// .rec-card .subj { font-size:11; font-weight:700; padding:3 9; border-radius:999; }
// .rec-card .edu { font-size:12.5; margin-top:3; }
// .rec-card .why { margin-top:13; padding:12 13; border-radius:12; font-size:12.5; line-height:19; }
function RecCard({
  name,
  subject,
  edu,
  why,
  initials,
}: {
  name: string;
  subject: string;
  edu: string;
  why: string;
  initials: string;
}) {
  const { t } = useTheme();
  return (
    <View style={[styles.recCard, { backgroundColor: t.panel, borderColor: t.line }]}>
      <View style={styles.recH}>
        {/* .ph placeholder avatar */}
        <View style={[recS.ph, styles.phWrap, { backgroundColor: t.panel2, borderColor: t.line }]}>
          <Text style={[styles.phText, { color: t.mut }]}>{initials}</Text>
          {/* .vb check badge */}
          <View style={[recS.vb, { backgroundColor: t.acc }]}>
            <Text style={{ color: t.onAcc, fontSize: 11, fontFamily: font.bold }}>✓</Text>
          </View>
        </View>

        <View style={styles.recInfo}>
          {/* .nm font-size:16 font-weight:800 letter-spacing:-.02em */}
          <View style={styles.recNmRow}>
            <Text style={[recS.nm, { color: t.fg }]}>{name}</Text>
            {/* .subj font-size:11 font-weight:700 padding:3 9 border-radius:999 */}
            <View style={[styles.subj, { backgroundColor: accTint(t, 0.10) }]}>
              <Text style={[styles.subjText, { color: t.accText }]}>{subject}</Text>
            </View>
          </View>
          {/* .edu font-size:12.5 margin-top:3 */}
          <Text style={[recS.edu, { color: t.mut }]}>{edu}</Text>
        </View>
      </View>

      {/* .why margin-top:13 padding:12 13 border-radius:12 font-size:12.5 line-height:19 */}
      <View style={[recS.why, { backgroundColor: accTint(t, 0.06) }]}>
        <Text style={[styles.why, { color: t.fg }]}>
          <Text style={{ fontFamily: font.bold }}>왜 이 선생님일까요?{"\n"}</Text>
          {why}
        </Text>
      </View>
    </View>
  );
}

export default function ConsultMatch() {
  const { t } = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      <View style={styles.flex}>
        <ScrollView
          contentContainerStyle={[scrollS, styles.scrollContent]}
          showsVerticalScrollIndicator={false}
        >
          {/* .sub-head */}
          <SubHead title="추천 선생님" />

          {/* .match-badge centered */}
          <View style={styles.badgeWrap}>
            <MatchBadge />
          </View>

          {/* 설명 font-size:13 color:mut text-align:center margin:8 18 4 line-height:1.6 */}
          <Text style={[styles.desc, { color: t.mut }]}>
            지우의 성적·성향·일정을 분석해{"\n"}가장 잘 맞는 선생님을 찾았어요.
          </Text>

          {/* 추천 강사 카드 */}
          <RecCard
            name="Teacher Noah"
            subject="수학"
            edu="서울대학교 수리과학부 · 경력 7년"
            why="전교 꼴등에서 서울대까지 — 막힌 개념을 정확히 짚어주는 스타일이 지우에게 잘 맞아요. 3~4등급에서 끌어올린 사례가 많습니다."
            initials="N"
          />

          <RecCard
            name="Teacher Olivia"
            subject="영어"
            edu="연세대학교 영어영문학과 · 경력 5년"
            why="읽기 습관부터 바로잡는 지도. 자기주도 학습을 만들고 싶다는 목표와 잘 맞습니다."
            initials="O"
          />

          <View style={{ height: 6 }} />
        </ScrollView>

        {/* .cta-bar */}
        <View style={[ctaBarS.wrap, { borderTopColor: t.line, backgroundColor: t.bg }]}>
          <Text style={[ctaBarS.sub, { color: t.mut }]}>선생님이 마음에 드시면 수업을 시작해요</Text>
          <Pressable
            style={[ctaBarS.btn, styles.ctaBtnShadow, { backgroundColor: t.acc, shadowColor: t.acc }]}
            onPress={() => router.push("/subscribe")}
          >
            <Text style={[styles.ctaBtnText, { color: t.onAcc }]}>이 선생님으로 시작하기</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { paddingBottom: 6 },

  badgeWrap: { alignItems: "center", paddingVertical: 4 },

  // .match-badge text
  badgeText: { fontSize: 12, fontFamily: font.extrabold },

  // 설명 font-size:13 margin:8 18 4 line-height:1.6×13=20.8
  desc: {
    fontSize: 13,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 8,
    marginHorizontal: 18,
    marginBottom: 4,
  },

  // .card.rec-card
  recCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginTop: 11,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 10,
    shadowOpacity: 0.06,
    elevation: 3,
  },

  // .rec-card .h
  recH: { flexDirection: "row", gap: 13 },

  // .ph placeholder avatar
  phWrap: { alignItems: "center", justifyContent: "center" },
  phText: { fontSize: 20, fontFamily: font.bold },

  // .rec-card name+subj row
  recInfo: { flex: 1 },
  recNmRow: { flexDirection: "row", alignItems: "center", gap: 7, flexWrap: "wrap" },

  // .subj padding:3 9 border-radius:999
  subj: { paddingVertical: 3, paddingHorizontal: 9, borderRadius: 999 },
  subjText: { fontSize: 11, fontFamily: font.bold },

  // .why font-size:12.5 line-height:19
  why: { fontSize: 12.5, lineHeight: 19 },

  ctaBtnShadow: {
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 22,
    shadowOpacity: 0.28,
    elevation: 8,
  },
  ctaBtnText: { fontFamily: font.extrabold, fontSize: 16, textAlign: "center" },
});
