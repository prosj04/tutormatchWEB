import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
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

import { auth as authS, field as fieldS, font } from "../../styles/app-styles";
import { API_BASE } from "../../lib/api";
import { saveRole, saveTokens } from "../../lib/auth";
import { registerPushToken } from "../../lib/push";
import { useTheme } from "../../theme/ThemeProvider";
import { SubHead } from "../../components/ui/SubHead";

interface RegisterResponse {
  accessToken?: string;
  refreshToken?: string;
  user?: { id: string; role: string; name: string };
  error?: string;
}

export default function ParentSignup() {
  const { t } = useTheme();
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSignup() {
    if (!name.trim() || !phone.trim() || !password) return;
    if (password.length < 8) {
      setError("비밀번호는 8자 이상이어야 해요.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/mobile/parent/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          password,
        }),
      });
      const data = (await res.json()) as RegisterResponse;
      if (!res.ok || !data.accessToken || !data.refreshToken) {
        setError(data.error ?? "가입에 실패했어요. 다시 시도해 주세요.");
        return;
      }
      await saveTokens(data.accessToken, data.refreshToken);
      await saveRole("PARENT");
      void registerPushToken().catch(() => {});
      router.replace("/(parent)/link" as never);
    } catch {
      setError("네트워크 오류가 발생했어요.");
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = name.trim() && phone.trim() && password;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={authS.wrap}>
          <View style={styles.subHeadWrap}>
            <SubHead title="학부모 가입" />
          </View>

          <ScrollView style={styles.flex} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={[styles.lede, { color: t.mut }]}>
              가입 후 <Text style={{ color: t.fg, fontFamily: font.bold }}>자녀 연결 코드</Text>를 입력하면 리포트·결제·상담을 이용할 수 있어요.
            </Text>

            <View style={fieldS.wrap}>
              <Text style={[fieldS.label, { color: t.fg }]}>이름</Text>
              <TextInput
                style={[fieldS.inp, { backgroundColor: t.panel, borderColor: t.line2, color: t.fg }]}
                placeholder="홍길동"
                placeholderTextColor={t.mut2}
                value={name}
                onChangeText={setName}
                returnKeyType="next"
              />
            </View>

            <View style={fieldS.wrap}>
              <Text style={[fieldS.label, { color: t.fg }]}>전화번호</Text>
              <TextInput
                style={[fieldS.inp, { backgroundColor: t.panel, borderColor: t.line2, color: t.fg }]}
                placeholder="010-0000-0000"
                placeholderTextColor={t.mut2}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                returnKeyType="next"
              />
            </View>

            <View style={fieldS.wrap}>
              <Text style={[fieldS.label, { color: t.fg }]}>이메일</Text>
              <TextInput
                style={[fieldS.inp, { backgroundColor: t.panel, borderColor: t.line2, color: t.fg }]}
                placeholder="name@email.com"
                placeholderTextColor={t.mut2}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                returnKeyType="next"
              />
            </View>

            <View style={fieldS.wrap}>
              <Text style={[fieldS.label, { color: t.fg }]}>
                비밀번호 <Text style={{ color: t.mut2, fontFamily: font.medium }}>· 8자 이상</Text>
              </Text>
              <TextInput
                style={[fieldS.inp, { backgroundColor: t.panel, borderColor: t.line2, color: t.fg }]}
                placeholder="비밀번호"
                placeholderTextColor={t.mut2}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleSignup}
              />
            </View>

            {error !== "" ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable
              style={[authS.p1, styles.p1Shadow, { backgroundColor: t.acc, shadowColor: t.acc }, (loading || !canSubmit) && styles.disabled]}
              onPress={handleSignup}
              disabled={loading || !canSubmit}
            >
              <Text style={[styles.p1Text, { color: t.onAcc }]}>
                {loading ? "가입 중…" : "가입하고 자녀 연결하기"}
              </Text>
            </Pressable>
          </ScrollView>

          <Text style={[authS.foot, { color: t.mut }]}>
            이미 계정이 있으신가요?{" "}
            <Text style={{ color: t.accText, fontFamily: font.bold }} onPress={() => router.replace("/(auth)/login")}>
              로그인
            </Text>
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  subHeadWrap: { marginTop: 8 },
  lede: { fontSize: 13.5, marginHorizontal: 2, marginBottom: 18, lineHeight: 22 },
  p1Shadow: { shadowOffset: { width: 0, height: 10 }, shadowRadius: 22, shadowOpacity: 0.28, elevation: 8 },
  p1Text: { fontFamily: font.extrabold, fontSize: 15, textAlign: "center" },
  error: { fontSize: 13, color: "#E53E3E", marginBottom: 8, fontFamily: font.semibold },
  disabled: { opacity: 0.5 },
});
