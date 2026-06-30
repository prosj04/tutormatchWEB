import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  ctaBar as ctaBarS,
  font,
  rec as recS,
  scroll as scrollS,
} from "../../styles/app-styles";
import { SubHead } from "../../components/ui/SubHead";
import { EmptyState } from "../../components/ui/EmptyState";
import { apiFetch } from "../../lib/api";
import { useTheme } from "../../theme/ThemeProvider";
import { accTint } from "../../theme/tokens";

function MatchBadge() {
  const { t } = useTheme();
  return (
    <View style={[recS.badge, { backgroundColor: accTint(t, 0.12) }]}>
      <Text style={{ color: t.accText, fontSize: 14, fontFamily: font.bold }}>✓</Text>
      <Text style={[styles.badgeText, { color: t.accText }]}>매니저가 직접 매칭했어요</Text>
    </View>
  );
}

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
        <View style={[recS.ph, styles.phWrap, { backgroundColor: t.panel2, borderColor: t.line }]}>
          <Text style={[styles.phText, { color: t.mut }]}>{initials}</Text>
          <View style={[recS.vb, { backgroundColor: t.acc }]}>
            <Text style={{ color: t.onAcc, fontSize: 11, fontFamily: font.bold }}>✓</Text>
          </View>
        </View>
        <View style={styles.recInfo}>
          <View style={styles.recNmRow}>
            <Text style={[recS.nm, { color: t.fg }]}>{name}</Text>
            <View style={[styles.subj, { backgroundColor: accTint(t, 0.10) }]}>
              <Text style={[styles.subjText, { color: t.accText }]}>{subject}</Text>
            </View>
          </View>
          <Text style={[recS.edu, { color: t.mut }]}>{edu}</Text>
        </View>
      </View>
      <View style={[recS.why, { backgroundColor: accTint(t, 0.06) }]}>
        <Text style={[styles.why, { color: t.fg }]}>
          <Text style={{ fontFamily: font.bold }}>왜 이 선생님일까요?{"\n"}</Text>
          {why}
        </Text>
      </View>
    </View>
  );
}

interface MatchesData {
  studentName: string;
  teachers: Array<{
    id: string;
    name: string;
    subject: string;
    education: string;
    experience: string;
    why: string;
    initials: string;
  }>;
}

export default function ConsultMatch() {
  const { t } = useTheme();
  const router = useRouter();
  const [data, setData] = useState<MatchesData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<MatchesData>("/api/mobile/matches")
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      <View style={styles.flex}>
        <ScrollView contentContainerStyle={[scrollS, styles.scrollContent]} showsVerticalScrollIndicator={false}>
          <SubHead title="추천 선생님" />

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={t.acc} />
            </View>
          ) : !data?.teachers.length ? (
            <EmptyState
              title="아직 추천 선생님이 없어요"
              description="매니저가 매칭을 마치면 이곳에서 선생님을 확인할 수 있어요."
              ctaLabel="상담 진행 상태 보기"
              onCta={() => router.push("/consult/status")}
            />
          ) : (
            <>
              <View style={styles.badgeWrap}>
                <MatchBadge />
              </View>
              <Text style={[styles.desc, { color: t.mut }]}>
                {data.studentName}의 성적·성향·일정을 분석해{"\n"}
                가장 잘 맞는 선생님을 찾았어요.
              </Text>
              {data.teachers.map((teacher) => (
                <RecCard
                  key={teacher.id}
                  name={teacher.name}
                  subject={teacher.subject}
                  edu={`${teacher.education}${teacher.experience ? ` · ${teacher.experience}` : ""}`}
                  why={teacher.why}
                  initials={teacher.initials}
                />
              ))}
            </>
          )}
          <View style={{ height: 6 }} />
        </ScrollView>

        {data && data.teachers.length > 0 && (
          <View style={[ctaBarS.wrap, { borderTopColor: t.line, backgroundColor: t.bg }]}>
            <Text style={[ctaBarS.sub, { color: t.mut }]}>선생님이 마음에 드시면 수업을 시작해요</Text>
            <Pressable
              style={[ctaBarS.btn, styles.ctaBtnShadow, { backgroundColor: t.acc, shadowColor: t.acc }]}
              onPress={() => router.push("/subscribe")}
            >
              <Text style={[styles.ctaBtnText, { color: t.onAcc }]}>이 선생님으로 시작하기</Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { paddingBottom: 6 },
  center: { paddingVertical: 40, alignItems: "center" },
  badgeWrap: { alignItems: "center", paddingVertical: 4 },
  badgeText: { fontSize: 12, fontFamily: font.extrabold },
  desc: {
    fontSize: 13,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 8,
    marginHorizontal: 18,
    marginBottom: 4,
  },
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
  recH: { flexDirection: "row", gap: 13 },
  phWrap: { alignItems: "center", justifyContent: "center" },
  phText: { fontSize: 20, fontFamily: font.bold },
  recInfo: { flex: 1 },
  recNmRow: { flexDirection: "row", alignItems: "center", gap: 7, flexWrap: "wrap" },
  subj: { paddingVertical: 3, paddingHorizontal: 9, borderRadius: 999 },
  subjText: { fontSize: 11, fontFamily: font.bold },
  why: { fontSize: 12.5, lineHeight: 19 },
  ctaBtnShadow: {
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 22,
    shadowOpacity: 0.28,
    elevation: 8,
  },
  ctaBtnText: { fontFamily: font.extrabold, fontSize: 16, textAlign: "center" },
});
