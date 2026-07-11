import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  card as cardS,
  field as fieldS,
  font,
  lrow as lrowS,
  my as myS,
  scroll as scrollS,
  sectT as sectTS,
  switchStyle,
} from "../../styles/app-styles";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { BellIcon, ChevronRightIcon, DocumentIcon, LockIcon, QuestionIcon } from "../../components/ui/Icons";
import { PlusIcon } from "../../components/parent/ParentIcons";
import { useAuth } from "../../hooks/useAuth";
import { apiFetch } from "../../lib/api";
import { useTheme } from "../../theme/ThemeProvider";
import { accTint } from "../../theme/tokens";
import type { Child, ChildrenResponse } from "./_shared";
import { linkedViaLabel } from "./_shared";

const SUPPORT_EMAIL = "mailto:hello@concord.school";
const TERMS_URL = "https://concord.school/terms";

interface Profile {
  name: string;
  phone: string;
  email?: string;
}

export default function ParentMy() {
  const { t } = useTheme();
  const router = useRouter();
  const { logout } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [children, setChildren] = useState<Child[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [notifyOn, setNotifyOn] = useState(true);
  const [pwOpen, setPwOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [p, c] = await Promise.all([
        apiFetch<Profile>("/api/mobile/parent/profile"),
        apiFetch<ChildrenResponse>("/api/mobile/parent/children"),
      ]);
      setProfile(p);
      setChildren(c.children ?? []);
    } catch {
      setProfile(null);
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

  function confirmUnlink(child: Child) {
    Alert.alert(
      "자녀 연결 해제",
      `${child.name} 님과의 연결을 해제할까요? 리포트·결제·상담을 더 이상 볼 수 없습니다.`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "해제",
          style: "destructive",
          onPress: () => {
            apiFetch<{ ok: boolean }>(`/api/mobile/parent/link/${child.id}`, { method: "DELETE" })
              .then(() => load())
              .catch(() => Alert.alert("오류", "연결 해제에 실패했어요. 잠시 후 다시 시도해 주세요."));
          },
        },
      ],
    );
  }

  const name = profile?.name ?? "";
  const initial = name[0] ?? "?";

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={scrollS} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {loading && !profile && !error ? (
          <View style={styles.center}>
            <ActivityIndicator color={t.acc} />
          </View>
        ) : error ? (
          <ErrorState title="프로필을 불러오지 못했어요" onRetry={() => void load()} />
        ) : !profile ? (
          <EmptyState title="프로필 정보가 없어요" description="계정 정보를 확인해 주세요." />
        ) : (
          <>
            {/* 프로필 헤더 (.my-top) */}
            <View style={myS.top}>
              <View style={[myS.av, { backgroundColor: t.acc }]}>
                <Text style={[styles.avText, { color: t.onAcc }]}>{initial}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[myS.nm, { color: t.fg }]}>{`${name} 님`}</Text>
                <Text style={[myS.sub, { color: t.mut }]}>
                  {[profile.email, "학부모 계정"].filter(Boolean).join(" · ")}
                </Text>
              </View>
            </View>

            {/* 연결된 자녀 */}
            <Text style={[sectTS, { color: t.fg }]}>연결된 자녀</Text>
            {(children?.length ?? 0) === 0 ? (
              <View style={[cardS, styles.listCard, { backgroundColor: t.panel, borderColor: t.line, shadowColor: t.fg }]}>
                <View style={lrowS.wrap}>
                  <View style={lrowS.g}>
                    <Text style={[lrowS.gb, { color: t.fg }]}>아직 연결된 자녀가 없어요</Text>
                    <Text style={[lrowS.gp, { color: t.mut }]}>아래에서 코드/QR로 연결하세요.</Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={[cardS, styles.listCard, { backgroundColor: t.panel, borderColor: t.line, shadowColor: t.fg }]}>
                {(children ?? []).map((c, i) => (
                  <View
                    key={c.id}
                    style={[lrowS.wrap, i > 0 && { borderTopWidth: 1, borderTopColor: t.line }]}
                  >
                    <View style={[lrowS.av, { backgroundColor: t.panel2 }]}>
                      <Text style={[styles.avSmText, { color: t.accText }]}>{c.name?.[0] ?? "?"}</Text>
                    </View>
                    <View style={lrowS.g}>
                      <Text style={[lrowS.gb, { color: t.fg }]}>
                        {[c.name, c.grade].filter(Boolean).join(" · ")}
                      </Text>
                      <Text style={[lrowS.gp, { color: t.mut }]}>{linkedViaLabel(c.linkedVia)}</Text>
                    </View>
                    <Pressable onPress={() => confirmUnlink(c)} hitSlop={8}>
                      <Text style={[styles.unlink, { color: t.mut2 }]}>해제</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            {/* 자녀 추가 연결 (.add-child) */}
            <Pressable
              style={[styles.addChild, { borderColor: t.line2 }]}
              onPress={() => router.push("/(parent)/link" as never)}
            >
              <PlusIcon color={t.mut} size={17} />
              <Text style={[styles.addChildText, { color: t.mut }]}>자녀 추가 연결 (코드/QR)</Text>
            </Pressable>

            {/* 계정 */}
            <Text style={[sectTS, { color: t.fg }]}>계정</Text>
            <View style={[cardS, styles.listCard, { backgroundColor: t.panel, borderColor: t.line, shadowColor: t.fg }]}>
              {/* 비밀번호 변경 */}
              <Pressable style={myS.mrow} onPress={() => setPwOpen((v) => !v)}>
                <View style={[myS.mrowIc, { backgroundColor: t.panel2 }]}>
                  <LockIcon color={t.accText} size={18} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[myS.mrowGb, { color: t.fg }]}>비밀번호 변경</Text>
                  <Text style={[myS.mrowGp, { color: t.mut }]}>현재 비밀번호 확인 후 변경</Text>
                </View>
                <View style={pwOpen ? styles.chevOpen : undefined}>
                  <ChevronRightIcon color={t.mut2} size={18} />
                </View>
              </Pressable>

              {pwOpen ? <PasswordForm onDone={() => setPwOpen(false)} /> : null}

              {/* 알림 설정 */}
              <Pressable
                style={[myS.mrow, { borderTopWidth: 1, borderTopColor: t.line }]}
                onPress={() => setNotifyOn((v) => !v)}
              >
                <View style={[myS.mrowIc, { backgroundColor: t.panel2 }]}>
                  <BellIcon color={t.accText} size={18} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[myS.mrowGb, { color: t.fg }]}>알림 설정</Text>
                  <Text style={[myS.mrowGp, { color: t.mut }]}>리포트·결제·상담 알림</Text>
                </View>
                <View style={[switchStyle.track, { backgroundColor: notifyOn ? t.acc : t.line2 }]}>
                  <View style={[switchStyle.thumb, { left: notifyOn ? 19.5 : 2.5 }]} />
                </View>
              </Pressable>

              {/* 고객센터 */}
              <Pressable
                style={[myS.mrow, { borderTopWidth: 1, borderTopColor: t.line }]}
                onPress={() => void Linking.openURL(SUPPORT_EMAIL)}
              >
                <View style={[myS.mrowIc, { backgroundColor: t.panel2 }]}>
                  <QuestionIcon color={t.accText} size={18} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[myS.mrowGb, { color: t.fg }]}>고객센터</Text>
                </View>
                <ChevronRightIcon color={t.mut2} size={18} />
              </Pressable>

              {/* 약관·정책 */}
              <Pressable
                style={[myS.mrow, { borderTopWidth: 1, borderTopColor: t.line }]}
                onPress={() => void Linking.openURL(TERMS_URL)}
              >
                <View style={[myS.mrowIc, { backgroundColor: t.panel2 }]}>
                  <DocumentIcon color={t.accText} size={18} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[myS.mrowGb, { color: t.fg }]}>약관·정책</Text>
                </View>
                <ChevronRightIcon color={t.mut2} size={18} />
              </Pressable>
            </View>

            {/* 로그아웃 */}
            <Pressable style={styles.logoutWrap} onPress={logout}>
              <Text style={[styles.logoutText, { color: t.mut2 }]}>로그아웃</Text>
            </Pressable>
          </>
        )}
        <View style={{ height: 6 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// 비밀번호 변경 인라인 폼 — POST /api/mobile/me/password
function PasswordForm({ onDone }: { onDone: () => void }) {
  const { t } = useTheme();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function save() {
    setErr("");
    if (next.length < 8) {
      setErr("새 비밀번호는 8자 이상이어야 해요.");
      return;
    }
    setSaving(true);
    try {
      await apiFetch<{ ok: boolean }>("/api/mobile/me/password", {
        method: "POST",
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      Alert.alert("완료", "비밀번호가 변경됐어요.");
      setCurrent("");
      setNext("");
      onDone();
    } catch {
      setErr("현재 비밀번호가 올바르지 않거나 변경에 실패했어요.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={[styles.pwForm, { borderTopColor: t.line, backgroundColor: t.panel2 }]}>
      <View style={fieldS.wrap}>
        <Text style={[fieldS.label, { color: t.fg }]}>현재 비밀번호</Text>
        <TextInput
          style={[fieldS.inp, { backgroundColor: t.panel, borderColor: t.line2, color: t.fg }]}
          placeholderTextColor={t.mut2}
          placeholder="현재 비밀번호"
          value={current}
          onChangeText={setCurrent}
          secureTextEntry
        />
      </View>
      <View style={fieldS.wrap}>
        <Text style={[fieldS.label, { color: t.fg }]}>
          새 비밀번호 <Text style={{ color: t.mut2, fontFamily: font.medium }}>· 8자 이상</Text>
        </Text>
        <TextInput
          style={[fieldS.inp, { backgroundColor: t.panel, borderColor: t.line2, color: t.fg }]}
          placeholderTextColor={t.mut2}
          placeholder="새 비밀번호"
          value={next}
          onChangeText={setNext}
          secureTextEntry
        />
      </View>
      {err !== "" ? <Text style={styles.error}>{err}</Text> : null}
      <Pressable
        style={[styles.pwSave, { backgroundColor: t.acc }, (saving || !current || !next) && styles.disabled]}
        onPress={save}
        disabled={saving || !current || !next}
      >
        {saving ? (
          <ActivityIndicator color={t.onAcc} size="small" />
        ) : (
          <Text style={[styles.pwSaveText, { color: t.onAcc }]}>비밀번호 변경</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { paddingVertical: 48, alignItems: "center" },
  avText: { fontSize: 22, fontFamily: font.extrabold },
  avSmText: { fontSize: 14, fontFamily: font.bold },

  listCard: { overflow: "hidden" },
  unlink: { fontSize: 12, fontFamily: font.bold },

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

  chevOpen: { transform: [{ rotate: "90deg" }] },
  pwForm: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 16, borderTopWidth: 1 },
  pwSave: {
    paddingVertical: 13,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  pwSaveText: { fontFamily: font.extrabold, fontSize: 14 },

  error: { fontSize: 12.5, color: "#E53E3E", marginBottom: 10, fontFamily: font.semibold },
  disabled: { opacity: 0.5 },

  logoutWrap: { paddingVertical: 18, paddingBottom: 4, alignItems: "center" },
  logoutText: { fontSize: 13, fontFamily: font.semibold },
});
