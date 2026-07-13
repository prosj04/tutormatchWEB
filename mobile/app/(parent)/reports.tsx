import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  appbar as appbarS,
  card as cardS,
  font,
  lrow as lrowS,
  scroll as scrollS,
  sectT as sectTS,
} from "../../styles/app-styles";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { ChevronRightIcon } from "../../components/ui/Icons";
import { InfoIcon } from "../../components/ui/Icons";
import { apiFetch } from "../../lib/api";
import { useTheme } from "../../theme/ThemeProvider";
import { accTint } from "../../theme/tokens";
import type { Child, ChildrenResponse, Report, ReportsResponse } from "./_shared";
import { KidSwitch } from "./_KidSwitch";
import { useSelectedChildId } from "./_selectedChild";

export default function ReportsTab() {
  const { t } = useTheme();
  const router = useRouter();
  const [children, setChildren] = useState<Child[] | null>(null);
  const { selectedId, setSelectedId } = useSelectedChildId(
    (children ?? []).map((c) => c.id),
  );
  const [reports, setReports] = useState<Report[] | null>(null);
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [error, setError] = useState(false);

  const loadChildren = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const d = await apiFetch<ChildrenResponse>("/api/mobile/parent/children");
      setChildren(d.children ?? []);
    } catch {
      setChildren(null);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadChildren();
    }, [loadChildren]),
  );

  useEffect(() => {
    setExpandedMonth(null);
    if (!selectedId) {
      setReports(null);
      return;
    }
    let alive = true;
    setReportsLoading(true);
    apiFetch<ReportsResponse>(`/api/mobile/parent/children/${selectedId}/reports`)
      .then((d) => {
        if (alive) setReports(d.reports ?? []);
      })
      .catch(() => {
        if (alive) setReports([]);
      })
      .finally(() => {
        if (alive) setReportsLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [selectedId]);

  const latest = reports?.[0];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={scrollS} showsVerticalScrollIndicator={false}>
        {/* .appbar (제목형) */}
        <View style={appbarS.wrap}>
          <Text style={[styles.title, { color: t.fg }]}>리포트</Text>
        </View>

        {loading && !children ? (
          <View style={styles.center}>
            <ActivityIndicator color={t.acc} />
          </View>
        ) : error ? (
          <ErrorState title="리포트를 불러오지 못했어요" onRetry={() => void loadChildren()} />
        ) : (children?.length ?? 0) === 0 ? (
          <EmptyState
            title="연결된 자녀가 없어요"
            description="자녀를 연결하면 월간 학습 리포트를 볼 수 있어요."
            ctaLabel="자녀 연결하기"
            onCta={() => router.push("/(parent)/link" as never)}
          />
        ) : (
          <>
            <KidSwitch items={children ?? []} selectedId={selectedId} onSelect={setSelectedId} />

            {reportsLoading ? (
              <View style={styles.center}>
                <ActivityIndicator color={t.acc} />
              </View>
            ) : (reports?.length ?? 0) === 0 ? (
              <EmptyState
                title="아직 리포트가 없어요"
                description="첫 리포트가 준비되면 이곳에 표시됩니다."
              />
            ) : (
              <>
                {/* 최신 요약 카드 (ring-card 자리) */}
                {latest ? (
                  <View style={[cardS, styles.summaryCard, { backgroundColor: t.panel, borderColor: t.line, shadowColor: t.fg }]}>
                    <View style={[styles.summaryTag, { backgroundColor: accTint(t, 0.12) }]}>
                      <Text style={[styles.summaryTagText, { color: t.accText }]}>{latest.month}</Text>
                    </View>

                    {latest.overallScore != null ? (
                      <View style={styles.scoreRow}>
                        <Text style={[styles.scoreBig, { color: t.fg }]}>{latest.overallScore}</Text>
                        {latest.prevScore != null && latest.overallScore - latest.prevScore !== 0 ? (
                          <Text style={[styles.scoreDelta, { color: t.accText }]}>
                            {latest.overallScore - latest.prevScore > 0 ? "▲" : "▼"}
                            {Math.abs(latest.overallScore - latest.prevScore)} 지난달 대비
                          </Text>
                        ) : null}
                      </View>
                    ) : null}

                    <Text style={[styles.summaryText, { color: t.fg }]}>{latest.summary}</Text>

                    {(latest.subjectScores?.length ?? 0) > 0 ? (
                      <View style={styles.subjectList}>
                        {latest.subjectScores.map((s) => (
                          <View key={s.subject} style={styles.subjectRow}>
                            <Text style={[styles.subjectName, { color: t.fg }]}>{s.subject}</Text>
                            <View style={[styles.barTrack, { backgroundColor: t.panel2 }]}>
                              <View
                                style={[
                                  styles.barFill,
                                  { width: `${Math.max(0, Math.min(100, s.curr))}%`, backgroundColor: t.acc },
                                ]}
                              />
                            </View>
                            <Text style={[styles.subjectVal, { color: t.mut }]}>
                              {s.prev != null ? `${s.prev}→${s.curr}` : `${s.curr}`}
                            </Text>
                          </View>
                        ))}
                      </View>
                    ) : null}

                    {latest.teacherComment ? (
                      <View style={[styles.commentBox, { borderColor: t.line }]}>
                        <Text style={[styles.commentLabel, { color: t.mut2 }]}>선생님 코멘트</Text>
                        <Text style={[styles.commentText, { color: t.fg }]}>{latest.teacherComment}</Text>
                      </View>
                    ) : null}
                    {latest.managerComment ? (
                      <View style={[styles.commentBox, { borderColor: t.line }]}>
                        <Text style={[styles.commentLabel, { color: t.mut2 }]}>매니저 코멘트</Text>
                        <Text style={[styles.commentText, { color: t.fg }]}>{latest.managerComment}</Text>
                      </View>
                    ) : null}

                    {(latest.weakTypes?.length ?? 0) > 0 ? (
                      <Text style={[styles.summaryWeak, { color: t.mut }]}>
                        보완 유형 · {latest.weakTypes.join(", ")}
                      </Text>
                    ) : null}
                  </View>
                ) : null}

                <Text style={[sectTS, { color: t.fg }]}>월간 리포트</Text>
                <View style={[cardS, styles.listCard, { backgroundColor: t.panel, borderColor: t.line, shadowColor: t.fg }]}>
                  {(reports ?? []).map((r, i) => {
                    const expanded = expandedMonth === r.month;
                    return (
                      <View key={r.month}>
                        <Pressable
                          style={[lrowS.wrap, i > 0 && { borderTopWidth: 1, borderTopColor: t.line }]}
                          onPress={() => setExpandedMonth(expanded ? null : r.month)}
                        >
                          <View style={[lrowS.av, { backgroundColor: t.panel2, borderRadius: 10 }]}>
                            <Text style={[styles.avText, { color: t.accText }]}>{r.month.replace(/[^0-9]/g, "").slice(-2) || r.month}</Text>
                          </View>
                          <View style={lrowS.g}>
                            <Text style={[lrowS.gb, { color: t.fg }]}>{`${r.month} 학습 리포트`}</Text>
                            <Text style={[lrowS.gp, { color: t.mut }]} numberOfLines={expanded ? undefined : 1}>{r.summary}</Text>
                          </View>
                          <View style={[lrowS.chev, expanded && { transform: [{ rotate: "90deg" }] }]}>
                            <ChevronRightIcon color={t.mut2} size={18} />
                          </View>
                        </Pressable>

                        {expanded ? (
                          <View style={[styles.detailBox, { borderTopColor: t.line }]}>
                            {r.overallScore != null ? (
                              <Text style={[styles.detailScore, { color: t.fg }]}>
                                종합 {r.overallScore}
                                {r.prevScore != null && r.overallScore - r.prevScore !== 0
                                  ? `  (${r.overallScore - r.prevScore > 0 ? "▲" : "▼"}${Math.abs(r.overallScore - r.prevScore)} 지난달 대비)`
                                  : ""}
                              </Text>
                            ) : null}

                            {(r.subjectScores?.length ?? 0) > 0 ? (
                              <View style={styles.subjectList}>
                                {r.subjectScores.map((s) => (
                                  <View key={s.subject} style={styles.subjectRow}>
                                    <Text style={[styles.subjectName, { color: t.fg }]}>{s.subject}</Text>
                                    <View style={[styles.barTrack, { backgroundColor: t.panel2 }]}>
                                      <View
                                        style={[
                                          styles.barFill,
                                          { width: `${Math.max(0, Math.min(100, s.curr))}%`, backgroundColor: t.acc },
                                        ]}
                                      />
                                    </View>
                                    <Text style={[styles.subjectVal, { color: t.mut }]}>
                                      {s.prev != null ? `${s.prev}→${s.curr}` : `${s.curr}`}
                                    </Text>
                                  </View>
                                ))}
                              </View>
                            ) : null}

                            {r.detail ? (
                              <Text style={[styles.detailText, { color: t.fg }]}>{r.detail}</Text>
                            ) : null}

                            {r.teacherComment ? (
                              <View style={[styles.commentBox, { borderColor: t.line }]}>
                                <Text style={[styles.commentLabel, { color: t.mut2 }]}>선생님 코멘트</Text>
                                <Text style={[styles.commentText, { color: t.fg }]}>{r.teacherComment}</Text>
                              </View>
                            ) : null}
                            {r.managerComment ? (
                              <View style={[styles.commentBox, { borderColor: t.line }]}>
                                <Text style={[styles.commentLabel, { color: t.mut2 }]}>매니저 코멘트</Text>
                                <Text style={[styles.commentText, { color: t.fg }]}>{r.managerComment}</Text>
                              </View>
                            ) : null}

                            {(r.weakTypes?.length ?? 0) > 0 ? (
                              <Text style={[styles.summaryWeak, { color: t.mut }]}>
                                보완 유형 · {r.weakTypes.join(", ")}
                              </Text>
                            ) : null}
                          </View>
                        ) : null}
                      </View>
                    );
                  })}
                </View>

                {/* 정보 배너 */}
                <View style={[styles.banner, { backgroundColor: accTint(t, 0.08), borderColor: accTint(t, 0.2) }]}>
                  <InfoIcon color={t.accText} size={17} />
                  <Text style={[styles.bannerText, { color: t.accText }]}>
                    리포트는 선생님·매니저가 요약한 결과입니다. 상세 진도·숙제는 자녀 앱에서 관리돼요.
                  </Text>
                </View>
              </>
            )}
          </>
        )}
        <View style={{ height: 6 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { paddingVertical: 40, alignItems: "center" },
  title: { fontSize: 22, fontFamily: font.extrabold, letterSpacing: -0.66 },

  summaryCard: { padding: 16 },
  summaryTag: { alignSelf: "flex-start", paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999 },
  summaryTagText: { fontSize: 11, fontFamily: font.bold },
  summaryText: { fontSize: 15, fontFamily: font.bold, letterSpacing: -0.3, marginTop: 10, lineHeight: 22 },
  summaryWeak: { fontSize: 12.5, marginTop: 8 },

  scoreRow: { flexDirection: "row", alignItems: "baseline", gap: 10, marginTop: 10 },
  scoreBig: { fontSize: 36, fontFamily: font.extrabold, letterSpacing: -0.72 },
  scoreDelta: { fontSize: 13, fontFamily: font.bold },

  subjectList: { marginTop: 12, gap: 10 },
  subjectRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  subjectName: { width: 48, fontSize: 13, fontFamily: font.bold },
  barTrack: { flex: 1, height: 8, borderRadius: 5, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 5 },
  subjectVal: { width: 64, textAlign: "right", fontSize: 12.5 },

  commentBox: { marginTop: 12, paddingTop: 12, borderTopWidth: 1 },
  commentLabel: { fontSize: 11, fontFamily: font.bold, letterSpacing: 0.4, marginBottom: 4 },
  commentText: { fontSize: 13, lineHeight: 20 },

  listCard: { overflow: "hidden" },
  avText: { fontSize: 13, fontFamily: font.bold },

  detailBox: { paddingHorizontal: 15, paddingTop: 12, paddingBottom: 15, borderTopWidth: 1 },
  detailScore: { fontSize: 15, fontFamily: font.bold, letterSpacing: -0.3 },
  detailText: { fontSize: 13, lineHeight: 20, marginTop: 12 },

  // .banner.info
  banner: {
    flexDirection: "row",
    gap: 11,
    paddingVertical: 14,
    paddingHorizontal: 15,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 14,
  },
  bannerText: { flex: 1, fontSize: 12.5, lineHeight: 19, fontFamily: font.semibold },
});
