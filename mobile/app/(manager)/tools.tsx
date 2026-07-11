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

import { ChevronRightIcon, UserIcon } from "../../components/manager/ManagerIcons";
import { useAuth } from "../../hooks/useAuth";
import { apiFetch } from "../../lib/api";
import {
  appbar as appbarS,
  field as fieldS,
  font,
  lrow as lrowS,
  scroll as scrollS,
  sectT as sectTS,
} from "../../styles/app-styles";
import { useTheme } from "../../theme/ThemeProvider";
import { MCard } from "./_ui";

export default function ToolsScreen() {
  const { t } = useTheme();
  const router = useRouter();
  const { logout } = useAuth();

  // 학부모↔학생 수동 연결
  const [studentId, setStudentId] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [linking, setLinking] = useState(false);

  // 비밀번호 재설정
  const [identifier, setIdentifier] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetting, setResetting] = useState(false);

  async function link() {
    if (!studentId.trim() || !parentPhone.trim() || linking) return;
    setLinking(true);
    try {
      const r = await apiFetch<{ ok: boolean; alreadyLinked: boolean }>(
        "/api/mobile/manager/parent-link",
        {
          method: "POST",
          body: JSON.stringify({ studentId: studentId.trim(), parentPhone: parentPhone.trim() }),
        },
      );
      Alert.alert(
        "연결 완료",
        r.alreadyLinked ? "이미 연결된 학부모·학생입니다." : "학부모↔학생이 연결되었어요.",
      );
      setStudentId("");
      setParentPhone("");
    } catch (e) {
      Alert.alert("연결 실패", extractError((e as Error).message, "연결에 실패했어요."));
    } finally {
      setLinking(false);
    }
  }

  async function reset() {
    if (!identifier.trim() || !newPassword || resetting) return;
    if (newPassword.length < 8) {
      Alert.alert("비밀번호 확인", "새 비밀번호는 8자 이상이어야 해요.");
      return;
    }
    setResetting(true);
    try {
      const r = await apiFetch<{ ok: boolean; target: { role: string; name: string } }>(
        "/api/mobile/manager/password-reset",
        {
          method: "POST",
          body: JSON.stringify({ identifier: identifier.trim(), newPassword }),
        },
      );
      Alert.alert("재설정 완료", `${r.target.name || "대상 계정"}의 비밀번호가 재설정되었어요. (감사 로그 기록)`);
      setIdentifier("");
      setNewPassword("");
    } catch (e) {
      Alert.alert("재설정 실패", extractError((e as Error).message, "재설정에 실패했어요."));
    } finally {
      setResetting(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={scrollS}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={appbarS.wrap}>
            <Text style={[styles.title, { color: t.fg }]}>도구</Text>
          </View>

          {/* 학부모↔학생 수동 연결 */}
          <Text style={[sectTS, { color: t.fg }]}>학부모↔학생 수동 연결</Text>
          <View style={fieldS.wrap}>
            <Text style={[fieldS.label, { color: t.fg }]}>학부모 전화번호</Text>
            <TextInput
              style={[fieldS.inp, { backgroundColor: t.panel, borderColor: t.line2, color: t.fg }]}
              placeholder="010-1234-5678"
              placeholderTextColor={t.mut2}
              value={parentPhone}
              onChangeText={setParentPhone}
              keyboardType="phone-pad"
            />
          </View>
          <View style={fieldS.wrap}>
            <Text style={[fieldS.label, { color: t.fg }]}>학생 ID</Text>
            <TextInput
              style={[fieldS.inp, { backgroundColor: t.panel, borderColor: t.line2, color: t.fg }]}
              placeholder="학생 식별자"
              placeholderTextColor={t.mut2}
              value={studentId}
              onChangeText={setStudentId}
              autoCapitalize="none"
            />
          </View>
          <Pressable
            style={[styles.primaryBtn, { backgroundColor: t.acc, shadowColor: t.acc }, (linking || !studentId.trim() || !parentPhone.trim()) && styles.disabled]}
            onPress={link}
            disabled={linking || !studentId.trim() || !parentPhone.trim()}
          >
            {linking ? (
              <ActivityIndicator color={t.onAcc} size="small" />
            ) : (
              <Text style={[styles.primaryText, { color: t.onAcc }]}>연결하기</Text>
            )}
          </Pressable>

          {/* 비밀번호 재설정 */}
          <Text style={[sectTS, { color: t.fg }]}>비밀번호 재설정 (대면 확인 후)</Text>
          <View style={fieldS.wrap}>
            <Text style={[fieldS.label, { color: t.fg }]}>대상 (학생·학부모 전화/이메일)</Text>
            <TextInput
              style={[fieldS.inp, { backgroundColor: t.panel, borderColor: t.line2, color: t.fg }]}
              placeholder="전화번호 또는 이메일"
              placeholderTextColor={t.mut2}
              value={identifier}
              onChangeText={setIdentifier}
              autoCapitalize="none"
            />
          </View>
          <View style={fieldS.wrap}>
            <Text style={[fieldS.label, { color: t.fg }]}>
              새 비밀번호 <Text style={{ color: t.mut2, fontFamily: font.medium }}>· 8자 이상</Text>
            </Text>
            <TextInput
              style={[fieldS.inp, { backgroundColor: t.panel, borderColor: t.line2, color: t.fg }]}
              placeholder="새 비밀번호"
              placeholderTextColor={t.mut2}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>
          <Pressable
            style={[styles.ghostBtn, { backgroundColor: t.panel, borderColor: t.line2 }, (resetting || !identifier.trim() || !newPassword) && styles.disabled]}
            onPress={reset}
            disabled={resetting || !identifier.trim() || !newPassword}
          >
            {resetting ? (
              <ActivityIndicator color={t.fg} size="small" />
            ) : (
              <Text style={[styles.ghostText, { color: t.fg }]}>재설정 (감사 로그 기록)</Text>
            )}
          </Pressable>

          {/* 선생님 승인 진입 */}
          <Text style={[sectTS, { color: t.fg }]}>선생님 승인</Text>
          <MCard>
            <Pressable style={lrowS.wrap} onPress={() => router.push("/approval" as never)}>
              <View style={[lrowS.av, { backgroundColor: t.panel2 }]}>
                <UserIcon color={t.accText} size={18} />
              </View>
              <View style={lrowS.g}>
                <Text style={[styles.lrowB, { color: t.fg }]}>지원자 승인 검토</Text>
                <Text style={[styles.lrowP, { color: t.mut }]}>미승인 지원서 승인·반려</Text>
              </View>
              <View style={lrowS.chev}>
                <ChevronRightIcon color={t.mut2} size={20} />
              </View>
            </Pressable>
          </MCard>

          {/* 로그아웃 (MY 대체) */}
          <Pressable style={styles.logoutWrap} onPress={logout}>
            <Text style={[styles.logoutText, { color: t.mut2 }]}>로그아웃</Text>
          </Pressable>
          <View style={{ height: 6 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function extractError(message: string, fallback: string): string {
  const idx = message.indexOf("{");
  if (idx >= 0) {
    try {
      const parsed = JSON.parse(message.slice(idx)) as { error?: string };
      if (parsed.error) return parsed.error;
    } catch {
      /* noop */
    }
  }
  return fallback;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  title: { fontSize: 22, fontFamily: font.extrabold, letterSpacing: -0.66 },

  // .jbtn { padding:14; border-radius:13; font-weight:800; font-size:14.5; box-shadow acc }
  primaryBtn: {
    width: "100%",
    padding: 14,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    shadowOpacity: 0.26,
    elevation: 8,
  },
  primaryText: { fontSize: 14.5, fontFamily: font.extrabold },

  // 재설정 버튼: panel + line-2 border, weight700 font14
  ghostBtn: {
    width: "100%",
    padding: 14,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  ghostText: { fontSize: 14, fontFamily: font.bold },

  lrowB: { fontSize: 14, fontFamily: font.bold, letterSpacing: -0.14 },
  lrowP: { fontSize: 12.5, marginTop: 2 },

  logoutWrap: { paddingVertical: 18, paddingBottom: 4, alignItems: "center", marginTop: 8 },
  logoutText: { fontSize: 13, fontFamily: font.semibold },

  disabled: { opacity: 0.5 },
});
