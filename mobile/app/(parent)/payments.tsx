import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
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
  ctaBar as ctaBarS,
  font,
  lrow as lrowS,
  plan as planS,
  scroll as scrollS,
  sectT as sectTS,
} from "../../styles/app-styles";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { InfoIcon, RenewIcon } from "../../components/parent/ParentIcons";
import { apiFetch } from "../../lib/api";
import { useTheme } from "../../theme/ThemeProvider";
import { accTint } from "../../theme/tokens";
import type { Child, ChildrenResponse, PaymentsResponse, PaymentChild } from "./_shared";
import { KidSwitch } from "./_KidSwitch";

function won(n: number): string {
  return `${n.toLocaleString("ko-KR")}원`;
}

export default function PaymentsTab() {
  const { t } = useTheme();
  const router = useRouter();
  const [children, setChildren] = useState<Child[] | null>(null);
  const [pay, setPay] = useState<PaymentChild[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [c, p] = await Promise.all([
        apiFetch<ChildrenResponse>("/api/mobile/parent/children"),
        apiFetch<PaymentsResponse>("/api/mobile/parent/payments"),
      ]);
      setChildren(c.children ?? []);
      setPay(p.children ?? []);
      setSelectedId((prev) => prev ?? c.children?.[0]?.id ?? null);
    } catch {
      setChildren(null);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const selectedChild = useMemo(
    () => (children ?? []).find((c) => c.id === selectedId) ?? null,
    [children, selectedId],
  );
  const selectedPayments = useMemo(
    () => (pay ?? []).find((p) => p.studentId === selectedId)?.payments ?? [],
    [pay, selectedId],
  );
  const sub = selectedChild?.subscription;
  // PAUSED는 학부모에게 구독중과 동일 취급(매니저 전용 상태)
  const active = sub?.status === "ACTIVE" || sub?.status === "PAUSED";

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={scrollS} showsVerticalScrollIndicator={false}>
        <View style={appbarS.wrap}>
          <Text style={[styles.title, { color: t.fg }]}>결제</Text>
        </View>

        {loading && !children ? (
          <View style={styles.center}>
            <ActivityIndicator color={t.acc} />
          </View>
        ) : error ? (
          <ErrorState title="결제 정보를 불러오지 못했어요" onRetry={() => void load()} />
        ) : (children?.length ?? 0) === 0 ? (
          <EmptyState
            title="연결된 자녀가 없어요"
            description="자녀를 연결하면 결제 현황을 볼 수 있어요."
            ctaLabel="자녀 연결하기"
            onCta={() => router.push("/(parent)/link" as never)}
          />
        ) : (
          <>
            <KidSwitch
              items={children ?? []}
              selectedId={selectedId}
              onSelect={setSelectedId}
              labelMode="nameOnly"
            />

            {/* 현재 플랜 (.plan-now) */}
            {active && sub ? (
              <View style={[planS.now, styles.planShadow, { backgroundColor: t.acc, shadowColor: t.acc }]}>
                <Text style={[planS.nowK, { color: t.onAcc }]}>
                  {`${selectedChild?.name ?? ""} · 현재 플랜`}
                </Text>
                <Text style={[planS.nowNm, { color: t.onAcc }]}>{sub.plan}</Text>
                {(selectedChild?.subjects?.length ?? 0) > 0 ? (
                  <Text style={[styles.nowPr, { color: t.onAcc }]}>
                    {selectedChild!.subjects.join("·")}
                  </Text>
                ) : null}
                <View style={planS.nowNx}>
                  <Text style={[styles.nxSpan, { color: t.onAcc }]}>다음 결제일</Text>
                  <Text style={[styles.nxB, { color: t.onAcc }]}>{sub.periodEnd ?? "-"}</Text>
                </View>
              </View>
            ) : (
              <View style={[cardS, styles.emptyPlan, { backgroundColor: t.panel, borderColor: t.line, shadowColor: t.fg }]}>
                <Text style={[styles.emptyPlanH, { color: t.fg }]}>진행 중인 플랜이 없어요</Text>
                <Text style={[styles.emptyPlanP, { color: t.mut }]}>
                  아래 버튼으로 자녀의 수업 플랜을 결제할 수 있어요.
                </Text>
              </View>
            )}

            {/* 자동 갱신 (.tok) — 정보성 표시 */}
            {active ? (
              <View style={[cardS, styles.tok, { backgroundColor: t.panel, borderColor: t.line, shadowColor: t.fg }]}>
                <View style={[styles.tokIc, { backgroundColor: accTint(t, 0.12) }]}>
                  <RenewIcon color={t.accText} size={19} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.tokB, { color: t.fg }]}>자동 갱신</Text>
                  <Text style={[styles.tokP, { color: t.mut }]}>
                    {sub?.periodEnd ? `${sub.periodEnd} 갱신 예정` : "매월 자동 결제"}
                  </Text>
                </View>
                <View style={[styles.switchTrack, { backgroundColor: t.acc }]}>
                  <View style={[styles.switchThumb, { left: 19.5 }]} />
                </View>
              </View>
            ) : null}

            {/* 결제 이력 */}
            <Text style={[sectTS, { color: t.fg }]}>결제 이력</Text>
            {selectedPayments.length === 0 ? (
              <View style={[cardS, styles.listCard, { backgroundColor: t.panel, borderColor: t.line, shadowColor: t.fg }]}>
                <View style={lrowS.wrap}>
                  <View style={lrowS.g}>
                    <Text style={[lrowS.gb, { color: t.fg }]}>결제 이력이 없어요</Text>
                    <Text style={[lrowS.gp, { color: t.mut }]}>결제가 완료되면 이곳에 표시됩니다.</Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={[cardS, styles.listCard, { backgroundColor: t.panel, borderColor: t.line, shadowColor: t.fg }]}>
                {selectedPayments.map((p, i) => (
                  <Pressable
                    key={p.orderId}
                    style={[lrowS.wrap, i > 0 && { borderTopWidth: 1, borderTopColor: t.line }]}
                    onPress={() => {
                      if (p.cashReceiptUrl) void Linking.openURL(p.cashReceiptUrl);
                    }}
                  >
                    <View style={lrowS.g}>
                      <Text style={[lrowS.gb, { color: t.fg }]}>
                        {`${p.plan} · ${selectedChild?.name ?? ""}`}
                      </Text>
                      <Text style={[lrowS.gp, { color: t.mut }]}>
                        {`${p.completedAt ?? p.createdAt} · ${statusLabel(p.status)}`}
                      </Text>
                    </View>
                    <Text style={[styles.amount, { color: t.fg }]}>{won(p.amount)}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            {/* 정보 배너 */}
            <View style={[styles.banner, { backgroundColor: accTint(t, 0.08), borderColor: accTint(t, 0.2) }]}>
              <InfoIcon color={t.accText} size={17} />
              <Text style={[styles.bannerText, { color: t.accText }]}>
                결제는 학생·학부모 계정 모두 가능해요. 중복 결제는 구독 상태로 자동 방지됩니다.
              </Text>
            </View>
            <View style={{ height: 6 }} />
          </>
        )}
      </ScrollView>

      {/* 미구독 자녀 결제 CTA */}
      {!loading && !error && selectedChild && !active ? (
        <View style={[ctaBarS.wrap, { borderTopColor: t.line, backgroundColor: t.panel }]}>
          <Pressable
            style={[ctaBarS.btn, styles.ctaShadow, { backgroundColor: t.acc, shadowColor: t.acc }]}
            onPress={() =>
              router.push(
                `/subscribe?studentId=${encodeURIComponent(selectedChild.id)}&childName=${encodeURIComponent(selectedChild.name)}` as never,
              )
            }
          >
            <Text style={[styles.ctaText, { color: t.onAcc }]}>
              {`${selectedChild.name} 플랜 결제하기`}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

function statusLabel(s: string): string {
  if (s === "PAID" || s === "DONE" || s === "COMPLETED") return "결제 완료";
  if (s === "PENDING" || s === "READY") return "결제 대기";
  if (s === "CANCELED" || s === "CANCELLED") return "취소됨";
  if (s === "REFUNDED") return "환불됨";
  return s;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { paddingVertical: 40, alignItems: "center" },
  title: { fontSize: 22, fontFamily: font.extrabold, letterSpacing: -0.66 },

  planShadow: {
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 26,
    shadowOpacity: 0.3,
    elevation: 12,
  },
  nowPr: { fontSize: 14, opacity: 0.92, marginTop: 4, fontVariant: ["tabular-nums"] },
  nxSpan: { opacity: 0.85, fontSize: 13, fontFamily: font.regular },
  nxB: { marginLeft: "auto", fontSize: 13, fontFamily: font.bold, fontVariant: ["tabular-nums"] },

  emptyPlan: { padding: 20 },
  emptyPlanH: { fontSize: 17, fontFamily: font.extrabold, letterSpacing: -0.34 },
  emptyPlanP: { fontSize: 13, marginTop: 6, lineHeight: 20 },

  // .tok
  tok: {
    marginTop: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingVertical: 15,
    paddingHorizontal: 16,
  },
  tokIc: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  tokB: { fontSize: 14, fontFamily: font.bold },
  tokP: { fontSize: 12, marginTop: 1 },
  // .switch
  switchTrack: { width: 42, height: 25, borderRadius: 999, marginLeft: "auto" },
  switchThumb: {
    position: "absolute",
    top: 2.5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#fff",
  },

  listCard: { overflow: "hidden" },
  amount: { fontSize: 12.5, fontFamily: font.bold, fontVariant: ["tabular-nums"] },

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

  ctaShadow: {
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 24,
    shadowOpacity: 0.3,
    elevation: 10,
  },
  ctaText: { fontFamily: font.extrabold, fontSize: 16, textAlign: "center" },
});
