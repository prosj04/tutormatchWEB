import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { field as fieldS, font, scroll as scrollS } from "../../styles/app-styles";
import { SubHead } from "../../components/ui/SubHead";
import { AlertCircleIcon, QrIcon } from "../../components/parent/ParentIcons";
import { apiFetch } from "../../lib/api";
import { useTheme } from "../../theme/ThemeProvider";

interface LinkResult {
  ok: boolean;
  child?: { id: string; name: string };
  error?: string;
}

export default function ChildLink() {
  const { t } = useTheme();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLink() {
    const trimmed = code.replace(/\s/g, "");
    if (!trimmed || loading) return;
    setLoading(true);
    setError("");
    try {
      const r = await apiFetch<LinkResult>("/api/mobile/parent/link", {
        method: "POST",
        body: JSON.stringify({ code: trimmed, via: "CODE" }),
      });
      if (!r.ok) {
        setError(r.error ?? "연결에 실패했어요. 코드를 확인해 주세요.");
        return;
      }
      Alert.alert("연결 완료", r.child ? `${r.child.name} 님과 연결됐어요.` : "자녀와 연결됐어요.", [
        { text: "확인", onPress: () => router.replace("/(parent)" as never) },
      ]);
    } catch {
      setError("코드가 만료되었거나 올바르지 않아요. 자녀 앱에서 재발급 후 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]} edges={["top", "left", "right", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={scrollS} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <SubHead title="자녀 연결" />

          <Text style={[styles.lede, { color: t.mut }]}>
            자녀의 앱 <Text style={{ color: t.fg, fontFamily: font.bold }}>MY → 학부모 연결</Text>에 표시된 코드를 입력하거나 QR을 스캔하세요.
          </Text>

          {/* 연결 코드 입력 */}
          <View style={fieldS.wrap}>
            <Text style={[fieldS.label, { color: t.fg }]}>연결 코드</Text>
            <TextInput
              style={[fieldS.inp, styles.codeInput, { backgroundColor: t.panel, borderColor: t.line2, color: t.fg }]}
              placeholder="0 0 0 0 0 0"
              placeholderTextColor={t.mut2}
              value={code}
              onChangeText={setCode}
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleLink}
            />
          </View>

          {/* 코드로 연결 */}
          <Pressable
            style={[styles.primaryBtn, styles.primaryShadow, { backgroundColor: t.acc, shadowColor: t.acc }, (loading || !code.trim()) && styles.disabled]}
            onPress={handleLink}
            disabled={loading || !code.trim()}
          >
            {loading ? (
              <ActivityIndicator color={t.onAcc} size="small" />
            ) : (
              <Text style={[styles.primaryText, { color: t.onAcc }]}>코드로 연결</Text>
            )}
          </Pressable>

          {/* 또는 */}
          <View style={styles.daysep}>
            <View style={[styles.daysepLine, { backgroundColor: t.line }]} />
            <Text style={[styles.daysepText, { color: t.mut2 }]}>또는</Text>
            <View style={[styles.daysepLine, { backgroundColor: t.line }]} />
          </View>

          {/* QR 코드 스캔 */}
          <Pressable
            style={[styles.qrBtn, { backgroundColor: t.panel, borderColor: t.line2 }]}
            onPress={() =>
              Alert.alert("QR 스캔", "QR 스캔은 준비 중이에요. 지금은 연결 코드를 입력해 주세요.")
            }
          >
            <QrIcon color={t.fg} size={18} />
            <Text style={[styles.qrText, { color: t.fg }]}>QR 코드 스캔</Text>
          </Pressable>

          {/* 오류 배너 */}
          {error !== "" ? (
            <View style={[styles.banner, { backgroundColor: "rgba(217,119,6,0.1)", borderColor: "rgba(217,119,6,0.25)" }]}>
              <AlertCircleIcon color="#92610a" size={17} />
              <Text style={[styles.bannerText, { color: "#92610a" }]}>{error}</Text>
            </View>
          ) : null}

          <View style={{ height: 6 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },

  lede: { fontSize: 13.5, marginHorizontal: 2, marginBottom: 16, lineHeight: 22 },

  // .inp 중앙정렬·큰 자간 (시안 인라인)
  codeInput: {
    textAlign: "center",
    fontSize: 22,
    fontFamily: font.extrabold,
    letterSpacing: 6,
  },

  // .jbtn (코드로 연결)
  primaryBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: { fontFamily: font.extrabold, fontSize: 14.5 },
  primaryShadow: {
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    shadowOpacity: 0.26,
    elevation: 8,
  },

  // .daysep
  daysep: { flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 16 },
  daysepLine: { flex: 1, height: 1 },
  daysepText: { fontSize: 11, fontFamily: font.semibold },

  // QR 버튼
  qrBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 13,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  qrText: { fontFamily: font.bold, fontSize: 14 },

  // .banner.warn
  banner: {
    flexDirection: "row",
    gap: 11,
    paddingVertical: 14,
    paddingHorizontal: 15,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 16,
  },
  bannerText: { flex: 1, fontSize: 12.5, lineHeight: 19, fontFamily: font.semibold },

  disabled: { opacity: 0.5 },
});
