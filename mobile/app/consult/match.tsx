import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
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
import { ErrorState } from "../../components/ui/ErrorState";
import { apiFetch } from "../../lib/api";
import { useTheme } from "../../theme/ThemeProvider";
import { accTint } from "../../theme/tokens";

function MatchBadge() {
  const { t } = useTheme();
  return (
    <View style={[recS.badge, { backgroundColor: accTint(t, 0.12) }]}>
      <Text style={{ color: t.accText, fontSize: 14, fontFamily: font.bold }}>✓</Text>
      <Text style={[styles.badgeText, { color: t.accText }]}>매니저가 직접 배정했어요</Text>
    </View>
  );
}

function RecCard({
  name,
  subject,
  edu,
  why,
  initials,
  accepted,
}: {
  name: string;
  subject: string;
  edu: string;
  why: string;
  initials: string;
  accepted: boolean;
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
            {accepted ? (
              <View style={[styles.acceptedPill, { backgroundColor: accTint(t, 0.16) }]}>
                <Text style={[styles.acceptedPillText, { color: t.accText }]}>수락 완료</Text>
              </View>
            ) : null}
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
    accepted: boolean;
  }>;
}

export default function ConsultMatch() {
  const { t } = useTheme();
  const router = useRouter();
  const [data, setData] = useState<MatchesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    setAcceptError(null);
    apiFetch<MatchesData>("/api/mobile/matches")
      .then((res) => { setData(res); })
      .catch(() => {
        setData(null);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const pendingTeacher = data?.teachers.find((teacher) => !teacher.accepted) ?? data?.teachers[0];
  const allAccepted = data?.teachers.length
    ? data.teachers.every((teacher) => teacher.accepted)
    : false;

  async function handleAcceptTeacher() {
    if (!pendingTeacher || pendingTeacher.accepted) {
      router.replace("/");
      return;
    }

    setAccepting(true);
    setAcceptError(null);
    try {
      await apiFetch<{ ok: boolean; accepted: boolean }>("/api/mobile/matches", {
        method: "POST",
        body: JSON.stringify({ teacherId: pendingTeacher.id }),
      });
      router.replace("/");
    } catch {
      setAcceptError("선생님 수락 처리에 실패했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setAccepting(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      <View style={styles.flex}>
        <ScrollView contentContainerStyle={[scrollS, styles.scrollContent]} showsVerticalScrollIndicator={false}>
          <SubHead title="추천 선생님" />

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={t.acc} />
            </View>
          ) : error ? (
            <ErrorState
              title="추천 선생님을 불러오지 못했어요"
              onRetry={load}
            />
          ) : !data?.teachers.length ? (
            <EmptyState
              title="아직 추천 선생님이 없어요"
              description="매니저가 배정을 마치면 이곳에서 선생님을 확인할 수 있어요."
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
                  accepted={teacher.accepted}
                />
              ))}
            </>
          )}
          <View style={{ height: 6 }} />
        </ScrollView>

        {data && data.teachers.length > 0 && (
          <View style={[ctaBarS.wrap, { borderTopColor: t.line, backgroundColor: t.bg }]}>
            {acceptError ? (
              <Text style={[styles.acceptError, { color: t.accText }]}>{acceptError}</Text>
            ) : null}
            <Text style={[ctaBarS.sub, { color: t.mut }]}>
              {allAccepted
                ? "수락이 완료되었어요. 선생님이 첫 수업 날짜를 안내할 예정이에요"
                : "선생님 정보를 확인한 뒤 배정을 수락해 주세요"}
            </Text>
            <Pressable
              style={[ctaBarS.btn, styles.ctaBtnShadow, { backgroundColor: t.acc, shadowColor: t.acc }]}
              disabled={accepting}
              onPress={() => void handleAcceptTeacher()}
            >
              <Text style={[styles.ctaBtnText, { color: t.onAcc }]}>
                {accepting
                  ? "수락 처리 중…"
                  : allAccepted
                    ? "홈으로 이동"
                    : "이 선생님 수락하기"}
              </Text>
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
  acceptedPill: { paddingVertical: 3, paddingHorizontal: 9, borderRadius: 999 },
  acceptedPillText: { fontSize: 11, fontFamily: font.bold },
  why: { fontSize: 12.5, lineHeight: 19 },
  acceptError: { marginBottom: 8, fontSize: 12, fontFamily: font.bold, textAlign: "center" },
  ctaBtnShadow: {
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 22,
    shadowOpacity: 0.28,
    elevation: 8,
  },
  ctaBtnText: { fontFamily: font.extrabold, fontSize: 16, textAlign: "center" },
});
