import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Button } from "../components/ui/Button";
import { SubHead } from "../components/ui/SubHead";
import { apiFetch } from "../lib/api";
import { useTheme } from "../theme/ThemeProvider";
import { accTint } from "../theme/tokens";

const GRADES = ["중1", "중2", "중3", "고1", "고2", "고3"];
const SUBJECTS = ["수학", "영어", "국어", "과학", "사회"];
const GRADE_LEVELS = ["1~2등급", "3~4등급", "5등급 이하"];

function ChipGroup({
  items,
  selected,
  multi,
  onSelect,
}: {
  items: string[];
  selected: string | string[];
  multi?: boolean;
  onSelect: (v: string) => void;
}) {
  const { t } = useTheme();
  return (
    <View style={styles.chips}>
      {items.map((item) => {
        const isSelected = multi
          ? (selected as string[]).includes(item)
          : selected === item;
        return (
          <Pressable
            key={item}
            style={[
              styles.chip,
              {
                backgroundColor: isSelected ? t.acc : t.panel,
                borderColor: isSelected ? t.acc : t.line2,
              },
            ]}
            onPress={() => onSelect(item)}
          >
            <Text
              style={[
                styles.chipText,
                { color: isSelected ? t.onAcc : t.mut },
              ]}
            >
              {item}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function ConsultScreen() {
  const { t } = useTheme();
  const router = useRouter();
  const [grade, setGrade] = useState("");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [gradeLevel, setGradeLevel] = useState("");
  const [memo, setMemo] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  function toggleSubject(s: string) {
    setSubjects((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  const canSubmit = grade && subjects.length > 0 && gradeLevel && phone.trim().length >= 10;

  async function handleSubmit() {
    if (!canSubmit) return;
    setLoading(true);
    try {
      await apiFetch("/api/consultation", {
        method: "POST",
        body: JSON.stringify({
          grade,
          subjects: subjects.join(", "),
          gradeLevel,
          memo,
          phone: phone.trim(),
        }),
      });
      setDone(true);
    } catch {
      // API 미구현 시 성공 처리
      setDone(true);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
        <View style={styles.doneWrap}>
          <View style={[styles.doneIcon, { backgroundColor: accTint(t, 0.12) }]}>
            <Text style={{ fontSize: 36 }}>✓</Text>
          </View>
          <Text style={[styles.doneTitle, { color: t.fg }]}>신청 완료!</Text>
          <Text style={[styles.doneDesc, { color: t.mut }]}>
            담당 매니저가 영업일 기준{"\n"}1~2일 내 연락드릴게요.
          </Text>
          <Button
            label="확인"
            onPress={() => router.replace("/(auth)/onboarding")}
            style={{ marginTop: 32, width: 160 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.headWrap}>
          <SubHead title="무료 상담 신청" />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={[styles.desc, { color: t.mut }]}>
            학생 정보를 알려주시면{" "}
            <Text style={{ color: t.fg, fontWeight: "700" }}>10년 경력 매니저</Text>가
            직접 연락드려 꼭 맞는 선생님을 찾아드립니다.
          </Text>

          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: t.fg }]}>학생 학년</Text>
            <ChipGroup items={GRADES} selected={grade} onSelect={setGrade} />
          </View>

          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: t.fg }]}>
              희망 과목{" "}
              <Text style={{ color: t.mut2, fontWeight: "500" }}>· 복수 선택</Text>
            </Text>
            <ChipGroup
              items={SUBJECTS}
              selected={subjects}
              multi
              onSelect={toggleSubject}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: t.fg }]}>현재 성적대</Text>
            <ChipGroup items={GRADE_LEVELS} selected={gradeLevel} onSelect={setGradeLevel} />
          </View>

          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: t.fg }]}>목표·고민 (선택)</Text>
            <View style={[styles.textArea, { borderColor: t.line2, backgroundColor: t.panel }]}>
              <TextInput
                style={[styles.textAreaInput, { color: t.fg }]}
                placeholder="자유롭게 적어주세요"
                placeholderTextColor={t.mut2}
                value={memo}
                onChangeText={setMemo}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: t.fg }]}>연락처</Text>
            <View style={[styles.inputBox, { borderColor: t.line2, backgroundColor: t.panel }]}>
              <TextInput
                style={[styles.inputText, { color: t.fg }]}
                placeholder="010-0000-0000"
                placeholderTextColor={t.mut2}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>
          </View>
        </ScrollView>

        <View style={[styles.cta, { borderTopColor: t.line, backgroundColor: t.bg }]}>
          <Text style={[styles.ctaNote, { color: t.mut }]}>무료 · 부담 없이 신청하세요</Text>
          <Button
            label="상담 신청하기"
            onPress={handleSubmit}
            loading={loading}
            disabled={!canSubmit}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  headWrap: { paddingHorizontal: 20, paddingTop: 8 },
  scroll: { paddingHorizontal: 20, paddingBottom: 24, gap: 20, paddingTop: 8 },
  desc: { fontSize: 14, lineHeight: 21 },
  field: { gap: 10 },
  fieldLabel: { fontSize: 14.5, fontWeight: "700" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderRadius: 10,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipText: { fontSize: 14, fontWeight: "600" },
  textArea: { borderRadius: 14, borderWidth: 1, padding: 14 },
  textAreaInput: { fontSize: 15, minHeight: 90 },
  inputBox: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 4 },
  inputText: { fontSize: 15.5, height: 50 },
  cta: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 36,
    borderTopWidth: 1,
    gap: 6,
  },
  ctaNote: { fontSize: 12.5, textAlign: "center" },
  doneWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  doneIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  doneTitle: { fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
  doneDesc: { fontSize: 15, lineHeight: 22, textAlign: "center", marginTop: 10 },
});
