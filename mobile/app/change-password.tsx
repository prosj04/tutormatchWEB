import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { field as fieldS, font, scroll as scrollS } from "../styles/app-styles";
import { CheckIcon } from "../components/ui/Icons";
import { SubHead } from "../components/ui/SubHead";
import { apiFetch } from "../lib/api";
import { useTheme } from "../theme/ThemeProvider";

// ≥8자 + 영문·숫자 포함
function isStrongPassword(pw: string): boolean {
  return pw.length >= 8 && /[A-Za-z]/.test(pw) && /[0-9]/.test(pw);
}

export default function ChangePasswordScreen() {
  const { t, mode } = useTheme();
  const router = useRouter();
  const errColor = mode === "dark" ? "#E58A8A" : "#A93636";

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextInvalid = next.length > 0 && !isStrongPassword(next);
  const confirmInvalid = confirm.length > 0 && confirm !== next;
  const canSubmit =
    current.length > 0 &&
    isStrongPassword(next) &&
    confirm === next &&
    !submitting;

  async function submit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch("/api/mobile/me/password", {
        method: "POST",
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      router.back();
    } catch {
      setError("비밀번호를 변경하지 못했어요. 현재 비밀번호를 확인해 주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      <ScrollView contentContainerStyle={[scrollS, styles.content]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <SubHead title="비밀번호 변경" />

        <View style={fieldS.wrap}>
          <Text style={[fieldS.label, { color: t.fg }]}>현재 비밀번호</Text>
          <TextInput
            style={[fieldS.inp, { backgroundColor: t.panel, borderColor: t.line2, color: t.fg, shadowColor: t.fg }]}
            secureTextEntry
            placeholder="현재 비밀번호"
            placeholderTextColor={t.mut2}
            value={current}
            onChangeText={setCurrent}
            autoCapitalize="none"
          />
        </View>

        <View style={fieldS.wrap}>
          <Text style={[fieldS.label, { color: t.fg }]}>새 비밀번호</Text>
          <TextInput
            style={[
              fieldS.inp,
              { backgroundColor: t.panel, color: t.fg, shadowColor: t.fg, borderColor: nextInvalid ? "#C24141" : t.line2 },
            ]}
            secureTextEntry
            placeholder="8자 이상, 영문·숫자 포함"
            placeholderTextColor={t.mut2}
            value={next}
            onChangeText={setNext}
            autoCapitalize="none"
          />
          {nextInvalid ? (
            <Text style={[styles.fErr, { color: errColor }]}>
              8자 이상, 영문과 숫자를 포함해야 합니다.
            </Text>
          ) : isStrongPassword(next) ? (
            <View style={styles.okLine}>
              <CheckIcon color={t.accText} size={14} />
              <Text style={[styles.okText, { color: t.accText }]}>사용할 수 있어요</Text>
            </View>
          ) : null}
        </View>

        <View style={fieldS.wrap}>
          <Text style={[fieldS.label, { color: t.fg }]}>새 비밀번호 확인</Text>
          <TextInput
            style={[
              fieldS.inp,
              { backgroundColor: t.panel, color: t.fg, shadowColor: t.fg, borderColor: confirmInvalid ? "#C24141" : t.line2 },
            ]}
            secureTextEntry
            placeholder="한 번 더 입력"
            placeholderTextColor={t.mut2}
            value={confirm}
            onChangeText={setConfirm}
            autoCapitalize="none"
          />
          {confirmInvalid ? (
            <Text style={[styles.fErr, { color: errColor }]}>
              새 비밀번호와 일치하지 않습니다.
            </Text>
          ) : null}
        </View>

        {error ? (
          <Text style={[styles.fErr, styles.formErr, { color: errColor }]}>
            {error}
          </Text>
        ) : null}

        <Text
          onPress={submit}
          style={[
            styles.submit,
            {
              backgroundColor: t.acc,
              color: t.onAcc,
              shadowColor: t.acc,
              opacity: canSubmit ? 1 : 0.5,
            },
          ]}
          suppressHighlighting
        >
          비밀번호 변경
        </Text>

        <Text style={[styles.foot, { color: t.mut2 }]}>
          변경 시 다른 기기에서 자동 로그아웃됩니다.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingBottom: 24 },
  // .f-err { font-size:12; font-weight:600; margin-top:7 }
  fErr: { fontSize: 12, fontFamily: font.semibold, marginTop: 7 },
  formErr: { marginTop: 0, marginBottom: 14, textAlign: "center" },
  // .ok-line { flex-row; gap:8; margin-top:7 }
  okLine: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 7 },
  okText: { fontSize: 12.5, fontFamily: font.bold },
  // 시안 버튼: padding:15; border-radius:14; font-weight:800; font-size:15; shadow
  submit: {
    width: "100%",
    paddingVertical: 15,
    borderRadius: 14,
    fontFamily: font.extrabold,
    fontSize: 15,
    textAlign: "center",
    overflow: "hidden",
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    shadowOpacity: 0.26,
    elevation: 6,
  },
  // p { font-size:12; text-align:center; margin-top:12 }
  foot: { fontSize: 12, textAlign: "center", marginTop: 12 },
});
