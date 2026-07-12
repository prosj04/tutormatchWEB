import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  card,
  font,
  my as myS,
  scroll as scrollS,
  sectT as sectTS,
} from "../../styles/app-styles";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import {
  BellIcon,
  CalendarIcon,
  CardIcon,
  DocumentIcon,
  FileIcon,
  LockIcon,
  QuestionIcon,
} from "../../components/ui/Icons";
import { useAuth } from "../../hooks/useAuth";
import { apiFetch } from "../../lib/api";
import { useTheme } from "../../theme/ThemeProvider";
import { accTint } from "../../theme/tokens";

const SUPPORT_EMAIL = "mailto:hello@concord.school";
const TERMS_URL = "https://concord.school/terms";
const PRIVACY_URL = "https://concord.school/privacy";

interface MeData {
  student: { name: string; grade: string; subjects: string[]; email: string };
  subscription: {
    plan: string;
    planLabel: string;
    nextBilling: string | null;
  } | null;
  enrollmentStatus: string;
  journey: { stage: string; label: string };
  latestReportMonth: string | null;
}

function MRow({
  icon,
  label,
  sub,
  trailing,
  onPress,
  divider,
}: {
  icon: React.ReactNode;
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
        {icon}
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

interface ParentLinkCode {
  code: string | null;
  expiresAt: string | null;
}

function formatExpiry(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("ko-KR", {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Seoul",
  });
}

// C4: 학생 앱에서 학부모 연결 코드 발급
function ParentLinkSection() {
  const { t } = useTheme();
  const [code, setCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [issuing, setIssuing] = useState(false);

  useEffect(() => {
    apiFetch<ParentLinkCode>("/api/mobile/me/parent-link-code")
      .then((d) => {
        setCode(d.code);
        setExpiresAt(d.expiresAt);
      })
      .catch(() => {});
  }, []);

  async function issue() {
    if (issuing) return;
    setIssuing(true);
    try {
      const d = await apiFetch<ParentLinkCode>("/api/mobile/me/parent-link-code", {
        method: "POST",
      });
      setCode(d.code);
      setExpiresAt(d.expiresAt);
    } catch {
      Alert.alert("오류", "코드 발급에 실패했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIssuing(false);
    }
  }

  const expiryLabel = formatExpiry(expiresAt);

  return (
    <>
      <Text style={[sectTS, styles.sectT, { color: t.fg }]}>학부모 연결</Text>
      <View style={[card, styles.linkCard, { backgroundColor: t.panel, borderColor: t.line, shadowColor: t.fg }]}>
        {code ? (
          <>
            <Text style={[styles.linkCode, { color: t.fg }]}>{code}</Text>
            {expiryLabel ? (
              <Text style={[styles.linkExpiry, { color: t.mut }]}>{`${expiryLabel}까지 유효`}</Text>
            ) : null}
            <Text style={[styles.linkHelp, { color: t.mut }]}>
              학부모 앱의 “자녀 연결”에 이 코드를 입력하면 계정이 연결돼요.
            </Text>
          </>
        ) : (
          <Text style={[styles.linkHelp, { color: t.mut }]}>
            코드를 발급해 학부모 앱의 “자녀 연결”에 입력하면 계정이 연결돼요.
          </Text>
        )}
        <Pressable
          style={[styles.linkBtn, { backgroundColor: accTint(t, 0.12) }, issuing && styles.linkBtnDisabled]}
          onPress={() => void issue()}
          disabled={issuing}
        >
          {issuing ? (
            <ActivityIndicator color={t.accText} size="small" />
          ) : (
            <Text style={[styles.linkBtnText, { color: t.accText }]}>
              {code ? "코드 재발급" : "코드 발급"}
            </Text>
          )}
        </Pressable>
      </View>
    </>
  );
}

export default function MyScreen() {
  const { t } = useTheme();
  const router = useRouter();
  const { logout } = useAuth();
  const [data, setData] = useState<MeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    const mountAt = Date.now();
    try {
      const d = await apiFetch<MeData>("/api/mobile/me");
      setData(d);
      console.log(`[perf] MY탭 mount→render: ${Date.now() - mountAt}ms`);
    } catch {
      setData(null);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const name = data?.student.name ?? "";
  const initial = name[0] ?? "?";
  const gradeSubjects = [
    data?.student.grade,
    ...(data?.student.subjects ?? []),
  ].filter(Boolean).join(" · ");
  const billingSub = data?.subscription
    ? `${data.subscription.planLabel}${data.subscription.nextBilling ? ` · 다음 결제 ${data.subscription.nextBilling}` : ""}`
    : "플랜을 선택해 보세요";

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      <ScrollView contentContainerStyle={[scrollS, styles.content]} showsVerticalScrollIndicator={false}>
        {loading && !data && !error ? (
          <View style={styles.center}>
            <ActivityIndicator color={t.acc} />
          </View>
        ) : error ? (
          <ErrorState
            title="프로필을 불러오지 못했어요"
            onRetry={() => void load()}
          />
        ) : !data ? (
          <EmptyState
            title="프로필 정보가 없어요"
            description="계정 정보를 확인해 주세요."
          />
        ) : (
          <>
            {/* 학생 프로필 헤더 */}
            <View style={[myS.top]}>
              <View style={[myS.av, { backgroundColor: accTint(t, 0.12) }]}>
                <Text style={[styles.avText, { color: t.accText }]}>{initial}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[myS.nm, { color: t.fg }]}>{name}</Text>
                {gradeSubjects ? (
                  <Text style={[myS.sub, { color: t.mut }]}>{gradeSubjects}</Text>
                ) : null}
                {data.student.email ? (
                  <Text style={[myS.sub, { color: t.mut, marginTop: 1 }]}>{data.student.email}</Text>
                ) : null}
              </View>
              <View style={[styles.statusBadge, { backgroundColor: accTint(t, 0.12) }]}>
                <Text style={[styles.statusText, { color: t.accText }]}>
                  {data.enrollmentStatus}
                </Text>
              </View>
            </View>

            <Text style={[sectTS, styles.sectT, { color: t.fg }]}>관리</Text>
            <View style={[card, styles.menuCard, { backgroundColor: t.panel, borderColor: t.line, shadowColor: t.fg }]}>
              <MRow
                icon={<CardIcon color={t.accText} size={18} />}
                label="구독·결제"
                sub={billingSub}
                onPress={() => router.push("/billing")}
              />
              <MRow
                icon={<BellIcon color={t.accText} size={18} />}
                label="알림"
                onPress={() => router.push("/notifications")}
                divider
              />
              <MRow
                icon={<DocumentIcon color={t.accText} size={18} />}
                label="학습 리포트"
                sub={data.latestReportMonth ? `${data.latestReportMonth} 리포트` : "아직 리포트 없음"}
                onPress={() => {
                  if (data.latestReportMonth) {
                    router.push(`/report/${data.latestReportMonth}` as Parameters<typeof router.push>[0]);
                  } else {
                    router.push("/(tabs)/learning" as Parameters<typeof router.push>[0]);
                  }
                }}
                divider
              />
              <MRow
                icon={<CalendarIcon color={t.accText} size={18} />}
                label="상담 진행 상태"
                sub={data.journey.label}
                onPress={() => router.push("/consult/status" as Parameters<typeof router.push>[0])}
                divider
              />
            </View>

            <ParentLinkSection />

            <Text style={[sectTS, styles.sectT, { color: t.fg }]}>설정</Text>
            <View style={[card, styles.menuCard, { backgroundColor: t.panel, borderColor: t.line, shadowColor: t.fg }]}>
              <MRow
                icon={<LockIcon color={t.accText} size={18} />}
                label="비밀번호 변경"
                onPress={() => router.push("/change-password" as Parameters<typeof router.push>[0])}
              />
              <MRow
                icon={<QuestionIcon color={t.accText} size={18} />}
                label="고객센터"
                sub="이메일로 문의하기"
                onPress={() => void Linking.openURL(SUPPORT_EMAIL)}
                divider
              />
              <MRow
                icon={<FileIcon color={t.accText} size={18} />}
                label="이용약관"
                onPress={() => void Linking.openURL(TERMS_URL)}
                divider
              />
              <MRow
                icon={<LockIcon color={t.accText} size={18} />}
                label="개인정보 처리방침"
                onPress={() => void Linking.openURL(PRIVACY_URL)}
                divider
              />
            </View>

            <Pressable style={styles.logoutWrap} onPress={logout}>
              <Text style={[styles.logoutText, { color: t.mut2 }]}>로그아웃</Text>
            </Pressable>

            <Pressable
              style={styles.deleteWrap}
              onPress={() => {
                Alert.alert(
                  "계정 삭제",
                  "계정을 삭제하면 개인정보가 익명화되며 되돌릴 수 없습니다. 결제 기록은 법령에 따라 보관됩니다.",
                  [
                    { text: "취소", style: "cancel" },
                    {
                      text: "삭제",
                      style: "destructive",
                      onPress: () => {
                        apiFetch<{ ok: boolean }>("/api/mobile/me", { method: "DELETE" })
                          .then(() => logout())
                          .catch(() => {
                            Alert.alert("오류", "계정 삭제에 실패했습니다. 잠시 후 다시 시도해 주세요.");
                          });
                      },
                    },
                  ],
                );
              }}
            >
              <Text style={[styles.deleteText, { color: t.mut2 }]}>계정 삭제</Text>
            </Pressable>
          </>
        )}
        <View style={{ height: 6 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingBottom: 8 },
  center: { paddingVertical: 48, alignItems: "center" },
  avText: { fontSize: 22, fontFamily: font.extrabold },
  statusBadge: { paddingVertical: 5, paddingHorizontal: 11, borderRadius: 999 },
  statusText: { fontSize: 11, fontFamily: font.bold },
  sectT: { fontSize: 14 },
  menuCard: { overflow: "hidden" },
  linkCard: { padding: 18, alignItems: "center" },
  linkCode: { fontSize: 30, fontFamily: font.extrabold, letterSpacing: 8, textAlign: "center" },
  linkExpiry: { fontSize: 12, marginTop: 6, fontFamily: font.semibold },
  linkHelp: { fontSize: 12.5, marginTop: 8, lineHeight: 19, textAlign: "center" },
  linkBtn: {
    marginTop: 14,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "stretch",
  },
  linkBtnText: { fontSize: 14, fontFamily: font.bold },
  linkBtnDisabled: { opacity: 0.6 },
  chev: { fontSize: 20, fontFamily: font.bold },
  logoutWrap: { paddingVertical: 18, paddingBottom: 4, alignItems: "center" },
  logoutText: { fontSize: 13, fontFamily: font.semibold },
  deleteWrap: { paddingVertical: 8, paddingBottom: 16, alignItems: "center" },
  deleteText: { fontSize: 12, fontFamily: font.semibold },
});
