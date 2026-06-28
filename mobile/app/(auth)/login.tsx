import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Button } from "../../components/ui/Button";
import { Logo } from "../../components/ui/Logo";
import { SubHead } from "../../components/ui/SubHead";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../theme/ThemeProvider";

export default function Login() {
  const { t } = useTheme();
  const { login } = useAuth();
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
        <View style={styles.content}>
          <SubHead title="" onBack={() => router.back()} />
          <Logo size={26} />
          <Text style={[styles.title, { color: t.fg }]}>로그인</Text>

          <View style={[styles.field, { borderColor: t.line2, backgroundColor: t.panel }]}>
            <TextInput
              style={[styles.input, { color: t.fg }]}
              placeholder="전화번호 또는 이메일"
              placeholderTextColor={t.mut2}
              value={identifier}
              onChangeText={setIdentifier}
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="next"
            />
          </View>

          <View
            style={[
              styles.field,
              { borderColor: t.line2, backgroundColor: t.panel, marginTop: 10 },
            ]}
          >
            <TextInput
              style={[styles.input, { color: t.fg }]}
              placeholder="비밀번호"
              placeholderTextColor={t.mut2}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
          </View>

          {error !== "" && (
            <Text style={styles.error}>{error}</Text>
          )}
        </View>

        <View style={[styles.cta, { borderTopColor: t.line, backgroundColor: t.bg }]}>
          <Button
            label="로그인"
            onPress={handleLogin}
            loading={loading}
            disabled={!identifier.trim() || !password}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 8 },
  title: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -1,
    marginTop: 24,
    marginBottom: 28,
  },
  field: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  input: { fontSize: 15.5, height: 50 },
  error: { fontSize: 13, color: "#E53E3E", marginTop: 10, fontWeight: "500" },
  cta: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
    borderTopWidth: 1,
  },
});
