import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
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
  iconbtn as iconbtnS,
  iconbtnBadge,
  scroll as scrollS,
  sectT as sectTS,
} from "../../styles/app-styles";
import { ErrorState } from "../../components/ui/ErrorState";
import { BellIcon, CardIcon, DocumentIcon } from "../../components/ui/Icons";
import { PlusIcon } from "../../components/parent/ParentIcons";
import { apiFetch } from "../../lib/api";
import { useTheme } from "../../theme/ThemeProvider";
import { accTint } from "../../theme/tokens";
import type { Child, ChildrenResponse } from "./_shared";

interface NotifSummary {
  unreadCount: number;
}

export default function ParentHome() {
  const { t } = useTheme();
  const router = useRouter();
  const [children, setChildren] = useState<Child[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  const load = useCallback(async () => {
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

  // 알림 미읽음 여부 — 벨 뱃지를 실제 데이터로 반영(하드코딩 점 제거).
  const loadUnread = useCallback(async () => {
    try {
      const d = await apiFetch<NotifSummary>("/api/mobile/notifications");
      setHasUnread((d.unreadCount ?? 0) > 0);
    } catch {
      setHasUnread(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
      void loadUnread();
    }, [load, loadUnread]),
  );

  const hasChildren = (children?.length ?? 0) > 0;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]} edges={["top", "left", "right"]}>
      {loading && !children && !error ? (
        <View style={styles.center}>
          <ActivityIndicator color={t.acc} />
        </View>
      ) : error ? (
        <ScrollView contentContainerStyle={scrollS} showsVerticalScrollIndicator={false}>
          <ErrorState title="자녀 정보를 불러오지 못했어요" onRetry={() => void load()} />
        </ScrollView>
      ) : !hasChildren ? (
        <EmptyHome />
      ) : (
        <ScrollView contentContainerStyle={scrollS} showsVerticalScrollIndicator={false}>
          {/* .appbar */}
          <View style={appbarS.wrap}>
            <View style={{ flex: 1 }}>
              <Text style={[appbarS.hi, { color: t.mut }]}>안녕하세요 👋</Text>
              <Text style={[appbarS.nm, { color: t.fg }]}>학부모 님</Text>
            </View>
            <Pressable
              style={[iconbtnS, { backgroundColor: t.panel, borderColor: t.line }]}
              onPress={() => router.push("/notifications" as never)}
            >
              {hasUnread && <View style={[iconbtnBadge, { backgroundColor: t.acc }]} />}
              <BellIcon color={t.fg} size={19} />
            </Pressable>
          </View>

          {(children ?? []).map((child) => (
            <ChildCard key={child.id} child={child} />
          ))}

          {/* .add-child */}
          <Pressable
            style={[styles.addChild, { borderColor: t.line2 }]}
            onPress={() => router.push("/(parent)/link" as never)}
          >
            <PlusIcon color={t.mut} size={17} />
            <Text style={[styles.addChildText, { color: t.mut }]}>자녀 추가 연결</Text>
          </Pressable>

          {/* 새 소식 */}
          <Text style={[sectTS, { color: t.fg }]}>새 소식</Text>
          <View style={[cardS, styles.newsCard, { backgroundColor: t.panel, borderColor: t.line, shadowColor: t.fg }]}>
            {(children ?? []).some((c) => c.latestReportMonth) ? (
              (children ?? [])
                .filter((c) => c.latestReportMonth)
                .map((c, i) => (
                  <Pressable
                    key={c.id}
                    style={[styles.nrow, i > 0 && { borderTopWidth: 1, borderTopColor: t.line }]}
                    onPress={() => router.push("/(parent)/reports" as never)}
                  >
                    <View style={[styles.nrowIc, { backgroundColor: accTint(t, 0.12) }]}>
                      <DocumentIcon color={t.accText} size={18} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.nrowB, { color: t.fg }]}>{`${c.name} ${c.latestReportMonth} 학습 리포트 도착`}</Text>
                      <Text style={[styles.nrowP, { color: t.mut }]}>리포트 탭에서 확인해 보세요</Text>
                    </View>
                  </Pressable>
                ))
            ) : (
              <View style={styles.nrow}>
                <View style={[styles.nrowIc, { backgroundColor: t.panel2 }]}>
                  <CardIcon color={t.mut} size={18} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.nrowB, { color: t.fg }]}>아직 새 소식이 없어요</Text>
                  <Text style={[styles.nrowP, { color: t.mut }]}>리포트·결제 소식이 여기에 표시됩니다</Text>
                </View>
              </View>
            )}
          </View>
          <View style={{ height: 6 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// 자녀 요약 카드 — 진도·숙제 데이터 없음(스펙 §3)
function ChildCard({ child }: { child: Child }) {
  const { t } = useTheme();
  const router = useRouter();
  const initial = child.name?.[0] ?? "?";
  const subjects = (child.subjects ?? []).join("·");
  const active = child.subscription?.status === "ACTIVE";
  const stateLabel = active ? "수업 중" : "선생님 배정 중";
  const meta = active
    ? [subjects, child.subscription?.plan].filter(Boolean).join(" · ")
    : "선생님 배정 중";

  return (
    <View style={[cardS, styles.childCard, { backgroundColor: t.panel, borderColor: t.line, shadowColor: t.fg }]}>
      <View style={styles.childHead}>
        <View style={[styles.childAv, { backgroundColor: t.panel2 }]}>
          <Text style={[styles.childAvText, { color: t.accText }]}>{initial}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.childNm, { color: t.fg }]}>
            {[child.name, child.grade].filter(Boolean).join(" · ")}
          </Text>
          {meta ? <Text style={[styles.childMeta, { color: t.mut }]}>{meta}</Text> : null}
        </View>
        <View style={[styles.bst, { backgroundColor: active ? accTint(t, 0.12) : t.panel2 }]}>
          <Text style={[styles.bstText, { color: active ? t.accText : t.mut }]}>{stateLabel}</Text>
        </View>
      </View>
      <View style={styles.childActs}>
        <Pressable
          style={[styles.childBtn, { backgroundColor: t.panel, borderColor: t.line2 }]}
          onPress={() => router.push("/(parent)/reports" as never)}
        >
          <Text style={[styles.childBtnText, { color: t.fg }]}>리포트</Text>
        </Pressable>
        <Pressable
          style={[styles.childBtn, { backgroundColor: t.panel, borderColor: t.line2 }]}
          onPress={() => router.push("/(parent)/payments" as never)}
        >
          <Text style={[styles.childBtnText, { color: t.fg }]}>결제 현황</Text>
        </Pressable>
        <Pressable
          style={[styles.childBtn, { backgroundColor: t.panel, borderColor: t.line2 }]}
          onPress={() => router.push("/(parent)/consult" as never)}
        >
          <Text style={[styles.childBtnText, { color: t.fg }]}>상담 신청</Text>
        </Pressable>
      </View>
    </View>
  );
}

// 홈 — 자녀 미연결 (empty-mid)
function EmptyHome() {
  const { t } = useTheme();
  const router = useRouter();
  return (
    <View style={[styles.emptyWrap]}>
      <View style={appbarS.wrap}>
        <View style={{ flex: 1 }}>
          <Text style={[appbarS.hi, { color: t.mut }]}>안녕하세요 👋</Text>
          <Text style={[appbarS.nm, { color: t.fg }]}>학부모 님</Text>
        </View>
      </View>
      <View style={styles.emptyMid}>
        <View style={[styles.emptyIc, { backgroundColor: accTint(t, 0.1) }]}>
          <PlusIcon color={t.accText} size={34} />
        </View>
        <Text style={[styles.emptyH3, { color: t.fg }]}>아직 연결된 자녀가 없어요</Text>
        <Text style={[styles.emptyP, { color: t.mut }]}>
          자녀 계정과 연결하면 학습 리포트,{"\n"}결제, 상담을 한 곳에서 관리할 수 있어요.
        </Text>
        <Pressable
          style={[styles.emptyCta, styles.ctaShadow, { backgroundColor: t.acc, shadowColor: t.acc }]}
          onPress={() => router.push("/(parent)/link" as never)}
        >
          <Text style={[styles.emptyCtaText, { color: t.onAcc }]}>자녀 연결하기</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  // .add-child { margin-top:11; padding:15; border-radius:16; border:1.5px dashed; }
  addChild: {
    marginTop: 11,
    padding: 15,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: "dashed",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  addChildText: { fontFamily: font.bold, fontSize: 14 },

  // 자녀 요약 카드 (.card padding:16, margin-top:11 for 2nd)
  childCard: { padding: 16, marginTop: 11 },
  childHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  // .av 44×44 border-radius:13
  childAv: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  childAvText: { fontFamily: font.bold, fontSize: 15 },
  childNm: { fontSize: 15, fontFamily: font.extrabold },
  childMeta: { fontSize: 12, marginTop: 2 },
  // 하위 액션 버튼
  childActs: { flexDirection: "row", gap: 8, marginTop: 14 },
  childBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  childBtnText: { fontFamily: font.bold, fontSize: 12.5 },

  // .bst
  bst: { paddingVertical: 4, paddingHorizontal: 9, borderRadius: 999 },
  bstText: { fontSize: 10.5, fontFamily: font.bold },

  // 새 소식 카드
  newsCard: { overflow: "hidden" },
  nrow: { flexDirection: "row", gap: 12, paddingVertical: 14, paddingHorizontal: 16 },
  nrowIc: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  nrowB: { fontSize: 13.5, fontFamily: font.bold },
  nrowP: { fontSize: 12.5, marginTop: 2, lineHeight: 18 },

  // empty-mid
  emptyWrap: { flex: 1, paddingHorizontal: 18, paddingTop: 8 },
  emptyMid: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    paddingHorizontal: 12,
  },
  emptyIc: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyH3: { fontSize: 19, fontFamily: font.extrabold, letterSpacing: -0.475, textAlign: "center" },
  emptyP: { fontSize: 13, lineHeight: 21, textAlign: "center" },
  emptyCta: { marginTop: 4, paddingVertical: 14, paddingHorizontal: 26, borderRadius: 13 },
  emptyCtaText: { fontFamily: font.extrabold, fontSize: 14.5 },
  ctaShadow: {
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    shadowOpacity: 0.26,
    elevation: 8,
  },
});
