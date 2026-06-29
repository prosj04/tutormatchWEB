import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
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
  chat as chatS,
  font,
} from "../../styles/app-styles";
import { EmptyState } from "../../components/ui/EmptyState";
import { apiFetch } from "../../lib/api";
import { useTheme } from "../../theme/ThemeProvider";
import { accTint } from "../../theme/tokens";

// ─── 메시지 말풍선 ─────────────────────────────────────────────────────────────
function MsgBubble({ type, text, aiTag }: {
  type: "me" | "them" | "ai";
  text: string;
  aiTag?: string;
}) {
  const { t } = useTheme();

  const bgColor =
    type === "me" ? t.acc
    : type === "ai" ? accTint(t, 0.10)
    : t.panel;

  return (
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
  const [data, setData] = useState<QnaData | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  async function load() {
    try {
      const res = await apiFetch<QnaData>("/api/mobile/qna");
      setData(res);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || !data?.teacher || sending) return;
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
  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
        <View style={styles.center}>
          <ActivityIndicator color={t.acc} />
        </View>
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
          title="아직 배정된 선생님이 없어요"
          description="상담 후 선생님이 매칭되면 이곳에서 바로 질문하고 AI·선생님 답변을 받을 수 있어요."
          ctaLabel="상담 진행 상태 보기"
          onCta={() => router.push("/consult")}
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
              title="첫 질문을 남겨보세요"
              description="모르는 문제를 보내면 AI가 먼저 즉답하고, 선생님이 이어서 확인해 드려요."
            />
          ) : (
            messages.map((m) => (
              <MsgBubble
                key={m.id}
                type={bubbleType(m.sender)}
                text={m.body}
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
              이번 달 AI 토큰을 모두 사용했어요 · 답변은 선생님이 직접 드려요
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
  tokenNote: { paddingHorizontal: 16, paddingTop: 8 },
});
