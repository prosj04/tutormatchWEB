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

import {
  ctaBar as ctaBarS,
  field as fieldS,
  font,
  opt as optS,
  scroll as scrollS,
  steps as stepsS,
} from "../../styles/app-styles";
import { SubHead } from "../../components/ui/SubHead";
import { apiFetch } from "../../lib/api";
import { getAccessToken } from "../../lib/auth";
import { ANALYTICS_EVENTS, trackEvent } from "../../lib/analytics";
import { savePendingConsultation } from "../../lib/pending-consultation";
import { useTheme } from "../../theme/ThemeProvider";

const GRADES = ["중1", "중2", "중3", "고1", "고2", "고3"];
const SUBJECTS = ["과학", "국어", "사회", "수학", "영어"];
const GRADE_LEVELS = ["1~2등급", "3~4등급", "5등급 이하"];

// ─── .steps 진행 바 ────────────────────────────────────────────────────────────
// <i class="on"></i><i class="on"></i><i></i> — 3개, 앞 2개 활성
function Steps({ total, active }: { total: number; active: number }) {
  const { t } = useTheme();
  return (
    <View style={stepsS.wrap}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            stepsS.bar,
            { backgroundColor: i < active ? t.acc : t.line2 },
          ]}
        />
      ))}
    </View>
  );
}

// ─── .opts .opt 선택 그룹 ─────────────────────────────────────────────────────
// .opts { flex-wrap:wrap; gap:8; }
// .opt { padding:10 15; border-radius:12; border:1px; font-size:13.5; font-weight:600; }
// .opt[aria-pressed] { bg:acc; color:on-acc; border:transparent; }
// .opt-break { flex-basis:100%; height:0; } — 학년 선택 줄바꿈 후 고교
function OptGroup({
  items,
  selected,
  multi,
  breakAt,
  onSelect,
}: {
  items: string[];
  selected: string | string[];
  multi?: boolean;
  breakAt?: number;
  onSelect: (v: string) => void;
}) {
  const { t } = useTheme();
  return (
    <View style={styles.opts}>
      {items.map((item, idx) => {
        const active = multi
          ? (selected as string[]).includes(item)
          : selected === item;
        return (
          <React.Fragment key={item}>
            {breakAt !== undefined && idx === breakAt && (
              <View style={styles.optBreak} />
            )}
            <Pressable
              style={[
                optS.base,
                {
                  backgroundColor: active ? t.acc : t.panel,
                  borderColor: active ? "transparent" : t.line2,
                },
              ]}
              onPress={() => onSelect(item)}
            >
              <Text style={[styles.optText, { color: active ? t.onAcc : t.mut }]}>
                {item}
              </Text>
            </Pressable>
          </React.Fragment>
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function toggleSubject(s: string) {
    setSubjects((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  const canSubmit = grade && subjects.length > 0 && gradeLevel;

  async function handleSubmit() {
    if (!canSubmit) return;
    setError("");
    setLoading(true);
    const payload = {
      grade,
      subjects: subjects.join(", "),
      gradeLevel,
      memo,
    };
    try {
      const token = await getAccessToken();
      if (token) {
        await apiFetch("/api/mobile/consultation", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        trackEvent(ANALYTICS_EVENTS.consultationSubmitted);
        router.replace("/consult/done");
        return;
      }

      await savePendingConsultation(payload);
      trackEvent(ANALYTICS_EVENTS.consultationSubmitted);
      router.replace("/consult/done");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg.includes("409") || msg.includes("이미")) {
        setError("이미 진행 중인 상담 신청이 있어요. 상태 화면에서 확인해 주세요.");
      } else {
        setError("상담 신청에 실패했습니다. 잠시 후 다시 시도해 주세요.");
      }
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
        <ScrollView
          contentContainerStyle={[scrollS, styles.scrollContent]}
          showsVerticalScrollIndicator={false}
        >
          {/* .sub-head */}
          <SubHead title="무료 상담 신청" />

          {/* .steps — 3칸, 2개 활성 */}
          <Steps total={3} active={2} />

          {/* 설명 font-size:13.5 color:mut margin:0 2px 18px line-height:1.6 */}
          <Text style={[styles.desc, { color: t.mut }]}>
            학생 정보를 알려주시면{" "}
            <Text style={[styles.descBold, { color: t.fg }]}>10년 경력 매니저</Text>
            가 직접 연락드려 꼭 맞는 선생님을 찾아드립니다.
          </Text>

          {/* .field 학생 학년 — opt-break 중3 후 (idx=3) */}
          <View style={fieldS.wrap}>
            <Text style={[fieldS.label, { color: t.fg }]}>학생 학년</Text>
            <OptGroup
              items={GRADES}
              selected={grade}
              breakAt={3}
              onSelect={setGrade}
            />
          </View>

          {/* .field 희망 과목 (복수 선택) */}
          <View style={fieldS.wrap}>
            <Text style={[fieldS.label, { color: t.fg }]}>
              희망 과목{" "}
              <Text style={[styles.labelSub, { color: t.mut2 }]}>· 복수 선택</Text>
            </Text>
            <OptGroup items={SUBJECTS} selected={subjects} multi onSelect={toggleSubject} />
          </View>

          {/* .field 현재 성적대 */}
          <View style={fieldS.wrap}>
            <Text style={[fieldS.label, { color: t.fg }]}>현재 성적대</Text>
            <OptGroup items={GRADE_LEVELS} selected={gradeLevel} onSelect={setGradeLevel} />
          </View>

          {/* .field 목표·고민 (textarea) */}
          <View style={fieldS.wrap}>
            <Text style={[fieldS.label, { color: t.fg }]}>목표·고민을 자유롭게 적어주세요</Text>
            {/* .inp.area minHeight:78 */}
            <TextInput
              style={[
                fieldS.inp,
                styles.area,
                { backgroundColor: t.panel, borderColor: t.line2, color: t.fg },
              ]}
              placeholder="자유롭게 적어주세요"
              placeholderTextColor={t.mut2}
              value={memo}
              onChangeText={setMemo}
              multiline
              textAlignVertical="top"
            />
          </View>

          <View style={{ height: 6 }} />
        </ScrollView>

        {/* .cta-bar padding:14 18 26 border-top:1px */}
        <View style={[ctaBarS.wrap, { borderTopColor: t.line, backgroundColor: t.bg }]}>
          {error ? (
            <Text style={[styles.errorText, { color: t.accText }]}>{error}</Text>
          ) : null}
          {/* .sub text-align:center font-size:12 margin-bottom:10 */}
          <Text style={[ctaBarS.sub, { color: t.mut }]}>
            상담은{" "}
            <Text style={[styles.ctaAccent, { color: t.accText }]}>100% 무료</Text>
            {" "}· 평균 1일 내 연락
          </Text>
          {/* .cta-bar button padding:16 border-radius:15 font-weight:800 font-size:16 */}
          <Pressable
            style={[
              ctaBarS.btn,
              styles.ctaBtnShadow,
              {
                backgroundColor: canSubmit ? t.acc : t.line2,
                shadowColor: t.acc,
              },
            ]}
            onPress={handleSubmit}
            disabled={loading || !canSubmit}
          >
            <Text style={[styles.ctaBtnText, { color: canSubmit ? t.onAcc : t.mut }]}>
              {loading ? "신청 중…" : "상담 신청하기"}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { paddingBottom: 6 },

  // 설명 font-size:13.5 line-height:1.6×13.5=21.6 margin:0 2 18
  desc: { fontSize: 13.5, lineHeight: 22, marginHorizontal: 2, marginBottom: 18 },
  descBold: { fontFamily: font.bold },

  // .field > label 서브 텍스트 (font-weight:500)
  labelSub: { fontFamily: font.medium, fontSize: 13 },

  // .opts flex-wrap gap:8
  opts: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  // .opt-break flex-basis:100% height:0
  optBreak: { width: "100%", height: 0 },
  // opt text
  optText: { fontFamily: font.semibold, fontSize: 13.5 },

  // .inp.area min-height:78
  area: { minHeight: 78, textAlignVertical: "top" },

  ctaAccent: { fontFamily: font.bold },

  // cta button shadow
  ctaBtnShadow: {
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 22,
    shadowOpacity: 0.24,
    elevation: 8,
  },
  ctaBtnText: { fontFamily: font.extrabold, fontSize: 16, textAlign: "center" },
  errorText: { fontSize: 12.5, textAlign: "center", marginBottom: 8, fontFamily: font.semibold },
});
