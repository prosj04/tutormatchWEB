import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { auth as authS, field as fieldS, font } from "../../styles/app-styles";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../theme/ThemeProvider";

// ─── 브랜드 아이콘 C. (auth 64×64, font-size:34) ─────────────────────────────
// .auth .brand .icon { width:64; height:64; border-radius:20; background:acc; shadow:0 12 26 acc/.32 }
// .auth .brand .icon .t { font-size:34; font-weight:800; letter-spacing:-.05em; }
// .auth .brand .icon .t .d { width:.17em=5.8; height:5.8; margin-left:.04em=1.4; }
function BrandIcon() {
  const { t } = useTheme();
  return (
    <View style={[authS.brandIcon, styles.brandIconShadow, { backgroundColor: t.acc, shadowColor: t.acc }]}>
      <View style={styles.iconT}>
        <Text style={[styles.iconLetter, { color: t.onAcc }]}>C</Text>
        <View style={[styles.iconDot, { backgroundColor: t.onAcc }]} />
      </View>
    </View>
  );
}

export default function Login() {
  const { t } = useTheme();
  const { login } = useAuth();
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 로그인 전에는 셀프 리셋이 불가하므로, 담당 매니저 재설정 요청 안내만 노출한다.
  function handleForgotPassword() {
    Alert.alert(
      "비밀번호 재설정",
      "로그인 전에는 직접 재설정할 수 없어요.\n담당 매니저에게 재설정을 요청할 수 있어요.\n\n상담 전화: 010-0000-0000",
      [{ text: "확인" }],
    );
  }

  async function handleLogin() {
    if (!identifier.trim() || !password) return;
    setError("");
    setLoading(true);
    try {
      await login(identifier.trim(), password);
    } catch (e) {
      setError(e instanceof Error ? e.message : "로그인 실패");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* .auth */}
        <View style={authS.wrap}>

          {/* .top-sp height:42 */}
          <View style={authS.topSp} />

          {/* .brand flex-col align-items:center gap:14 padding:30 0 26 */}
          <View style={authS.brand}>
            <BrandIcon />
            <View>
              {/* h2 font-size:22 font-weight:800 letter-spacing:-.03em text-align:center */}
              <Text style={[authS.h2, { color: t.fg }]}>다시 오신 걸 환영해요</Text>
              {/* .sub font-size:13.5 color:mut margin-top:7 text-align:center */}
              <Text style={[authS.sub, { color: t.mut }]}>Concord 계정으로 로그인하세요</Text>
            </View>
          </View>

          {/* .mid flex:1 justify-content:center */}
          <View style={authS.mid}>

            {/* .field 전화번호 또는 이메일 (웹 로그인 폼과 통일) */}
            <View style={fieldS.wrap}>
              <Text style={[fieldS.label, { color: t.fg }]}>전화번호 또는 이메일</Text>
              <TextInput
                style={[fieldS.inp, { backgroundColor: t.panel, borderColor: t.line2, color: t.fg }]}
                placeholder="전화번호 또는 이메일"
                placeholderTextColor={t.mut2}
                value={identifier}
                onChangeText={setIdentifier}
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
                placeholder="비밀번호"
                placeholderTextColor={t.mut2}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
            </View>

            {/* .forgot text-align:right font-size:12.5 font-weight:600 color:acc-text margin-top:-6 */}
            <Text
              style={[authS.forgot, { color: t.accText }]}
              onPress={handleForgotPassword}
            >
              비밀번호를 잊으셨나요?
            </Text>

            {error !== "" && (
              <Text style={styles.error}>{error}</Text>
            )}

            {/* .p1 padding:15 border-radius:14 font-weight:800 font-size:15 margin-top:6 shadow:0 10 22 acc/.28 */}
            <Pressable
              style={[authS.p1, styles.p1Shadow, { backgroundColor: t.acc, shadowColor: t.acc }]}
              onPress={handleLogin}
              disabled={loading || !identifier.trim() || !password}
            >
              <Text style={[styles.p1Text, { color: t.onAcc }]}>
                {loading ? "로그인 중…" : "로그인"}
              </Text>
            </Pressable>

            {/* 카카오/Apple 소셜 로그인 미구현 — 죽은 버튼 노출 금지 (추후 구현 시 복원) */}
          </View>

          {/* .foot text-align:center font-size:13 color:mut padding-top:18 */}
          <Text style={[authS.foot, { color: t.mut }]}>
            계정이 없으신가요?{" "}
            <Text
              style={{ color: t.accText, fontFamily: font.bold }}
              onPress={() => router.push("/(auth)/signup")}
            >
              회원가입
            </Text>
          </Text>

          {/* 학부모 가입 진입 */}
          <Text style={[authS.foot, { color: t.mut, paddingTop: 8 }]}>
            학부모이신가요?{" "}
            <Text
              style={{ color: t.accText, fontFamily: font.bold }}
              onPress={() => router.push("/(auth)/parent-signup" as never)}
            >
              학부모 가입
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

  // brand icon shadow: 0 12px 26px rgba(acc,.32)
  brandIconShadow: {
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 26,
    shadowOpacity: 0.32,
    elevation: 10,
  },

  // .auth .brand .icon .t
  iconT: { flexDirection: "row", alignItems: "baseline" },
  // font-size:34; letter-spacing:-.05*34=-1.7
  iconLetter: { fontSize: 34, fontFamily: font.extrabold, letterSpacing: -1.7 },
  // .d width:.17*34=5.78, height:5.78, margin-left:.04*34=1.36
  iconDot: { width: 5.8, height: 5.8, borderRadius: 999, marginLeft: 1.4 },

  // .p1 shadow: 0 10px 22px rgba(acc,.28)
  p1Shadow: {
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 22,
    shadowOpacity: 0.28,
    elevation: 8,
  },
  // p1 text: font-weight:800 font-size:15
  p1Text: { fontFamily: font.extrabold, fontSize: 15, textAlign: "center" },

  error: { fontSize: 13, color: "#E53E3E", marginTop: 8, fontFamily: font.semibold },
});
