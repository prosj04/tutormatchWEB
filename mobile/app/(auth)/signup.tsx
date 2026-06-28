import { SafeAreaView } from "react-native-safe-area-context";
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

import { auth as authS, field as fieldS, font } from "../../styles/app-styles";
import { saveTokens } from "../../lib/auth";
import { API_BASE } from "../../lib/api";
import { useTheme } from "../../theme/ThemeProvider";
import { SubHead } from "../../components/ui/SubHead";

export default function Signup() {
  const { t } = useTheme();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSignup() {
    if (!name.trim() || !password || !phone.trim()) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/mobile/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password, phone: phone.trim() }),
      });
      const data = await res.json() as { accessToken?: string; refreshToken?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? "가입에 실패했습니다. 다시 시도해 주세요.");
        return;
      }
      await saveTokens(data.accessToken!, data.refreshToken!);
      router.replace("/(tabs)");
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = name.trim() && password && phone.trim();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* .auth */}
        <View style={authS.wrap}>

          {/* .sub-head padding-top:14 */}
          <View style={styles.subHeadWrap}>
            <SubHead title="회원가입" />
          </View>

          {/* .mid justify-content:flex-start */}
          <ScrollView style={styles.flex} showsVerticalScrollIndicator={false}>

            {/* .field 이름 */}
            <View style={fieldS.wrap}>
              <Text style={[fieldS.label, { color: t.fg }]}>이름</Text>
              <TextInput
                style={[fieldS.inp, { backgroundColor: t.panel, borderColor: t.line2, color: t.fg }]}
                placeholder="김지우 학부모"
                placeholderTextColor={t.mut2}
                value={name}
                onChangeText={setName}
                returnKeyType="next"
              />
            </View>

            {/* .field 이메일 */}
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

            {/* .field 비밀번호 */}
            <View style={fieldS.wrap}>
              <Text style={[fieldS.label, { color: t.fg }]}>비밀번호</Text>
              <TextInput
                style={[fieldS.inp, { backgroundColor: t.panel, borderColor: t.line2, color: t.fg }]}
                placeholder="8자 이상, 영문·숫자 포함"
                placeholderTextColor={t.mut2}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                returnKeyType="next"
              />
            </View>

            {/* .field 휴대폰 번호 */}
            <View style={fieldS.wrap}>
              <Text style={[fieldS.label, { color: t.fg }]}>휴대폰 번호</Text>
              <TextInput
                style={[fieldS.inp, { backgroundColor: t.panel, borderColor: t.line2, color: t.fg }]}
                placeholder="010-0000-0000"
                placeholderTextColor={t.mut2}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                returnKeyType="done"
                onSubmitEditing={handleSignup}
              />
            </View>

            {error !== "" && (
              <Text style={styles.error}>{error}</Text>
            )}

            {/* .p1 shadow:0 10 22 acc/.28 */}
            <Pressable
              style={[authS.p1, styles.p1Shadow, { backgroundColor: t.acc, shadowColor: t.acc }]}
              onPress={handleSignup}
              disabled={loading || !canSubmit}
            >
              <Text style={[styles.p1Text, { color: t.onAcc }]}>
                {loading ? "가입 중…" : "가입하고 시작하기"}
              </Text>
            </Pressable>

            {/* .agree font-size:11.5 color:mut-2 line-height:1.6 margin-top:14 */}
            <Text style={[authS.agree, { color: t.mut2 }]}>
              가입 시{" "}
              <Text style={{ color: t.mut, textDecorationLine: "underline" }}>이용약관</Text>
              {" "}및{" "}
              <Text style={{ color: t.mut, textDecorationLine: "underline" }}>개인정보처리방침</Text>
              에{"\n"}동의하는 것으로 간주됩니다.
            </Text>
          </ScrollView>

          {/* .foot text-align:center font-size:13 color:mut padding-top:18 */}
          <Text style={[authS.foot, { color: t.mut }]}>
            이미 계정이 있으신가요?{" "}
            <Text
              style={{ color: t.accText, fontFamily: font.bold }}
              onPress={() => router.replace("/(auth)/login")}
            >
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

  // .sub-head padding-top:14px override
  subHeadWrap: { marginTop: 8 },

  p1Shadow: {
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 22,
    shadowOpacity: 0.28,
    elevation: 8,
  },
  p1Text: { fontFamily: font.extrabold, fontSize: 15, textAlign: "center" },

  error: { fontSize: 13, color: "#E53E3E", marginBottom: 8, fontFamily: font.semibold },
});
