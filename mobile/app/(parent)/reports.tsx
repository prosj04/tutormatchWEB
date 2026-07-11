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
import { InfoIcon } from "../../components/parent/ParentIcons";
import { apiFetch } from "../../lib/api";
import { useTheme } from "../../theme/ThemeProvider";
import { accTint } from "../../theme/tokens";
import type { Child, ChildrenResponse, Report, ReportsResponse } from "./_shared";
import { KidSwitch } from "./_KidSwitch";

export default function ReportsTab() {
  const { t } = useTheme();
  const router = useRouter();
  const [children, setChildren] = useState<Child[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reports, setReports] = useState<Report[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [error, setError] = useState(false);

  const loadChildren = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const d = await apiFetch<ChildrenResponse>("/api/mobile/parent/children");
      setChildren(d.children ?? []);
      setSelectedId((prev) => prev ?? d.children?.[0]?.id ?? null);
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
            <KidSwitch children={children ?? []} selectedId={selectedId} onSelect={setSelectedId} />

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
                    <Text style={[styles.summaryText, { color: t.fg }]}>{latest.summary}</Text>
                    {(latest.weakTypes?.length ?? 0) > 0 ? (
                      <Text style={[styles.summaryWeak, { color: t.mut }]}>
                        보완 유형 · {latest.weakTypes.join(", ")}
                      </Text>
                    ) : null}
                  </View>
                ) : null}

                <Text style={[sectTS, { color: t.fg }]}>월간 리포트</Text>
                <View style={[cardS, styles.listCard, { backgroundColor: t.panel, borderColor: t.line, shadowColor: t.fg }]}>
                  {(reports ?? []).map((r, i) => (
                    <Pressable
                      key={r.month}
                      style={[lrowS.wrap, i > 0 && { borderTopWidth: 1, borderTopColor: t.line }]}
                      onPress={() => router.push(`/report/${r.month}` as never)}
                    >
                      <View style={[lrowS.av, { backgroundColor: t.panel2, borderRadius: 10 }]}>
                        <Text style={[styles.avText, { color: t.accText }]}>{r.month.replace(/[^0-9]/g, "").slice(-2) || r.month}</Text>
                      </View>
                      <View style={lrowS.g}>
                        <Text style={[lrowS.gb, { color: t.fg }]}>{`${r.month} 학습 리포트`}</Text>
                        <Text style={[lrowS.gp, { color: t.mut }]} numberOfLines={1}>{r.summary}</Text>
                      </View>
                      <View style={lrowS.chev}>
                        <ChevronRightIcon color={t.mut2} size={18} />
                      </View>
                    </Pressable>
                  ))}
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

  listCard: { overflow: "hidden" },
  avText: { fontSize: 13, fontFamily: font.bold },

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
