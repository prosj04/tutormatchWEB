import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  chat as chatS,
  font,
} from "../../styles/app-styles";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { apiFetch } from "../../lib/api";
import { ANALYTICS_EVENTS, trackEvent } from "../../lib/analytics";
import { EMPTY_STATE_COPY } from "../../lib/student-journey";
import { useTheme } from "../../theme/ThemeProvider";
import { accTint } from "../../theme/tokens";

// KST(Asia/Seoul) 기준: 오늘이면 HH:MM, 이전이면 M/D
function formatMsgTime(iso: string): string {
  const d = new Date(iso);
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const now = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const sameDay =
    kst.getUTCFullYear() === now.getUTCFullYear() &&
    kst.getUTCMonth() === now.getUTCMonth() &&
    kst.getUTCDate() === now.getUTCDate();
  if (sameDay) {
    const hh = String(kst.getUTCHours()).padStart(2, "0");
    const mm = String(kst.getUTCMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }
  return `${kst.getUTCMonth() + 1}/${kst.getUTCDate()}`;
}

// ─── 메시지 말풍선 ─────────────────────────────────────────────────────────────
function MsgBubble({ type, text, aiTag, time }: {
  type: "me" | "them" | "ai";
  text: string;
  aiTag?: string;
  time?: string;
}) {
  const { t } = useTheme();

  const bgColor =
    type === "me" ? t.acc
    : type === "ai" ? accTint(t, 0.10)
    : t.panel;

  return (
    <View style={type === "me" ? styles.bubbleWrapMe : styles.bubbleWrapThem}>
      <View style={[
        chatS.msg,
        type === "me" ? [chatS.me, { backgroundColor: bgColor }]
        : type === "ai" ? [chatS.ai, { backgroundColor: bgColor, borderColor: t.line2 }]
        : [chatS.them, { backgroundColor: bgColor, borderColor: t.line2 }],
      ]}>
        {(type === "ai" && aiTag) && (
          <View style={chatS.aiTag}>
            <Text style={{ color: t.accText, fontSize: 10 }}>✨</Text>
            <Text style={[styles.aiTagText, { color: t.accText }]}>{aiTag}</Text>
          </View>
        )}
        <Text style={[styles.msgText, {
          color: type === "me" ? t.onAcc : t.fg,
        }]}>{text}</Text>
      </View>
      {time && <Text style={[styles.msgTime, { color: t.mut2 }]}>{time}</Text>}
    </View>
  );
}

interface QnaMessage {
  id: string;
  sender: "me" | "tutor" | "ai";
  body: string;
  imageUrl: string | null;
  tokenCost: number;
  createdAt: string;
}

interface Wallet {
  month: string;
  used: number;
  quota: number;
  remaining: number;
}

interface QnaTeacher {
  id: string;
  name: string;
  subjects: string;
}

interface QnaData {
  teacher: QnaTeacher | null;
  teachers: QnaTeacher[];
  messages: QnaMessage[];
  wallet: Wallet;
}

function bubbleType(sender: QnaMessage["sender"]): "me" | "them" | "ai" {
  if (sender === "me") return "me";
  if (sender === "ai") return "ai";
  return "them";
}

export default function QnAScreen() {
  const { t } = useTheme();
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [data, setData] = useState<QnaData | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(false);
    try {
      const res = await apiFetch<QnaData>("/api/mobile/qna");
      setData(res);
      trackEvent(ANALYTICS_EVENTS.qnaViewed);
      if (!res.teacher) {
        trackEvent(ANALYTICS_EVENTS.qnaEmptyNoTeacherViewed);
      }
    } catch {
      if (!isRefresh) setData(null);
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // 화면 복귀 시 재로드 — 선생님 답변 자동 반영
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  async function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || !data?.teacher || sending) return;
    if (data.messages.length === 0) {
      trackEvent(ANALYTICS_EVENTS.qnaFirstQuestionClicked);
    }
    setSending(true);
    setText("");
    try {
      const res = await apiFetch<{ message: QnaMessage; aiMessage: QnaMessage | null; wallet: Wallet }>(
        `/api/mobile/qna/${data.teacher.id}`,
        { method: "POST", body: JSON.stringify({ content: trimmed }) },
      );
      setData((prev) =>
        prev
          ? {
              ...prev,
              messages: [
                ...prev.messages,
                res.message,
                ...(res.aiMessage ? [res.aiMessage] : []),
              ],
              wallet: res.wallet ?? prev.wallet,
            }
          : prev,
      );
    } catch {
      // 전송 실패 시 입력 복원
      setText(trimmed);
    } finally {
      setSending(false);
    }
  }

  // ── 로딩 ──
  if (loading && !data && !error) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
        <View style={styles.center}>
          <ActivityIndicator color={t.acc} />
        </View>
      </SafeAreaView>
    );
  }

  // ── 오류 ──
  if (error) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
        <View style={[chatS.head]}>
          <View style={{ flex: 1 }}>
            <Text style={[chatS.headNm, { color: t.fg }]}>질문</Text>
          </View>
        </View>
        <ErrorState
          title="질문 목록을 불러오지 못했어요"
          onRetry={() => void load()}
        />
      </SafeAreaView>
    );
  }

  // ── 빈 상태: 배정 선생님 없음 ──
  if (!data?.teacher) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
        <View style={[chatS.head]}>
          <View style={{ flex: 1 }}>
            <Text style={[chatS.headNm, { color: t.fg }]}>질문</Text>
          </View>
        </View>
        <EmptyState
          icon="💬"
          title={EMPTY_STATE_COPY.noTeacher.title}
          description={EMPTY_STATE_COPY.noTeacher.description}
          ctaLabel={EMPTY_STATE_COPY.noTeacher.cta}
          onCta={() => router.push("/consult/status")}
        />
      </SafeAreaView>
    );
  }

  const { teacher, messages, wallet } = data;
  const tokenEmpty = wallet.remaining <= 0;
  const subjectLabel = teacher.subjects?.split(/[,\s]+/).filter(Boolean)[0] ?? "";

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[styles.scrollContent, { paddingTop: 4 }]}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={t.mut2} colors={[t.acc]} />
          }
        >
          {/* 헤더 */}
          <View style={[chatS.head]}>
            <View style={[chatS.headAv, { backgroundColor: accTint(t, 0.12) }]}>
              <Text style={[styles.headAvText, { color: t.accText }]}>{teacher.name[0]}</Text>
            </View>
            <View>
              <Text style={[chatS.headNm, { color: t.fg }]}>
                {subjectLabel ? `${subjectLabel} · ` : ""}{teacher.name}
              </Text>
              <Text style={[chatS.headSub, { color: t.mut }]}>
                {tokenEmpty ? "● 선생님이 직접 답변해요" : `● 질문하면 AI가 먼저 답해요 · 토큰 ${wallet.remaining}`}
              </Text>
            </View>
          </View>

          {messages.length === 0 ? (
            <EmptyState
              title={EMPTY_STATE_COPY.noQuestions.title}
              description={EMPTY_STATE_COPY.noQuestions.description}
            />
          ) : (
            messages.map((m) => (
              <MsgBubble
                key={m.id}
                type={bubbleType(m.sender)}
                text={m.body}
                time={m.createdAt ? formatMsgTime(m.createdAt) : undefined}
                aiTag={m.sender === "ai" ? `AI 즉답${m.tokenCost ? ` · 토큰 ${m.tokenCost} 사용` : ""}` : undefined}
              />
            ))
          )}

          <View style={{ height: 6 }} />
        </ScrollView>

        {/* 토큰 소진 안내 (Composer 위) */}
        {tokenEmpty && (
          <View style={[styles.tokenNote, { backgroundColor: t.bg }]}>
            <Text style={[chatS.depNote, { color: t.mut2 }]}>
              {EMPTY_STATE_COPY.tokensExhausted.title} · {EMPTY_STATE_COPY.tokensExhausted.description}
            </Text>
          </View>
        )}

        {/* Composer */}
        <View style={[chatS.composer, { borderTopColor: t.line, backgroundColor: t.bg }]}>
          <TextInput
            style={[chatS.composerIn, { backgroundColor: t.panel, borderColor: t.line2, color: t.fg, flex: 1 }]}
            placeholder="메시지 입력…"
            placeholderTextColor={t.mut2}
            value={text}
            onChangeText={setText}
            multiline
            editable={!sending}
          />
          <Pressable
            style={[chatS.composerSnd, { backgroundColor: text.trim() ? t.acc : t.line2 }]}
            onPress={handleSend}
            disabled={sending || !text.trim()}
            accessibilityRole="button"
            accessibilityLabel="메시지 전송"
          >
            <Text style={{ color: t.onAcc, fontSize: 16 }}>{sending ? "…" : "↑"}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  scrollContent: { paddingHorizontal: 18, paddingBottom: 8 },

  headAvText: { fontFamily: font.bold, fontSize: 15 },
  aiTagText: { fontSize: 10, fontFamily: font.extrabold, letterSpacing: 0.6, textTransform: "uppercase" },
  msgText: { fontSize: 13.5, lineHeight: 20 },
  bubbleWrapMe: { alignItems: "flex-end" },
  bubbleWrapThem: { alignItems: "flex-start" },
  msgTime: { fontSize: 11, marginTop: -4, marginBottom: 9, paddingHorizontal: 2 },
  tokenNote: { paddingHorizontal: 16, paddingTop: 8 },
});
