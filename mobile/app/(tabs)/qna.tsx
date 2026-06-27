import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { SendIcon, SparkIcon } from "../../components/ui/Icons";
import { apiFetch } from "../../lib/api";
import { useTheme } from "../../theme/ThemeProvider";
import { accTint, type ThemeTokens } from "../../theme/tokens";

interface Message {
  id: string;
  sender: "me" | "them" | "ai";
  body: string;
  imageUrl: string | null;
  tokenCost: number | null;
  createdAt: string;
}

interface QnaData {
  messages: Message[];
  wallet: { tokens: number };
}

interface HomeData {
  todayLesson: { teacher: { id: string; name: string } } | null;
  upcoming: Array<{ teacher: { id: string; name: string } }>;
}

function Bubble({ msg, t }: { msg: Message; t: ThemeTokens }) {
  const isMe = msg.sender === "me";
  const isAi = msg.sender === "ai";

  const bg = isMe ? t.acc : isAi ? accTint(t, 0.1) : t.panel;
  const color = isMe ? t.onAcc : t.fg;

  return (
    <View style={[styles.bubbleWrap, isMe && styles.bubbleWrapMe]}>
      {isAi && (
        <View style={[styles.aiLabel, { backgroundColor: accTint(t, 0.1) }]}>
          <SparkIcon color={t.accText} size={12} />
          <Text style={[styles.aiLabelText, { color: t.accText }]}>AI 답변</Text>
        </View>
      )}
      <View
        style={[
          styles.bubble,
          { backgroundColor: bg, borderColor: isAi ? accTint(t, 0.2) : t.line },
          isMe ? styles.bubbleMe : isAi ? styles.bubbleAi : styles.bubbleThem,
        ]}
      >
        <Text style={[styles.bubbleText, { color }]}>{msg.body}</Text>
      </View>
    </View>
  );
}

export default function QnaScreen() {
  const { t } = useTheme();
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [teacherName, setTeacherName] = useState("선생님");
  const [messages, setMessages] = useState<Message[]>([]);
  const [tokens, setTokens] = useState(0);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatRef = useRef<FlatList>(null);

  useEffect(() => {
    apiFetch<HomeData>("/api/mobile/home")
      .then((home) => {
        const teacher =
          home.todayLesson?.teacher ?? home.upcoming[0]?.teacher ?? null;
        if (teacher) {
          setTeacherId(teacher.id);
          setTeacherName(teacher.name);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!teacherId) return;
    apiFetch<QnaData>(`/api/mobile/qna/${teacherId}`).then((data) => {
      setMessages(data.messages);
      setTokens(data.wallet.tokens);
    });
  }, [teacherId]);

  async function handleSend() {
    if (!input.trim() || !teacherId || sending || tokens <= 0) return;
    const text = input.trim();
    setInput("");
    setSending(true);
    try {
      const res = await apiFetch<{
        message: Message;
        aiMessage: Message | null;
        wallet: { tokens: number };
      }>(`/api/mobile/qna/${teacherId}`, {
        method: "POST",
        body: JSON.stringify({ content: text }),
      });
      setMessages((prev) => [
        ...prev,
        res.message,
        ...(res.aiMessage ? [res.aiMessage] : []),
      ]);
      setTokens(res.wallet.tokens);
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 80);
    } catch {
      setInput(text);
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
        <View style={styles.center}>
          <ActivityIndicator color={t.acc} />
        </View>
      </SafeAreaView>
    );
  }

  if (!teacherId) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
        <View style={[styles.noTeacherHeader, { borderBottomColor: t.line }]}>
          <Text style={[styles.headerTitle, { color: t.fg }]}>질문</Text>
        </View>
        <View style={styles.center}>
          <Text style={[styles.emptyText, { color: t.mut }]}>
            배정된 선생님이 없습니다.{"\n"}무료 상담 신청 후 이용해주세요.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const canSend = input.trim().length > 0 && tokens > 0 && !sending;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      <View style={[styles.chatHeader, { borderBottomColor: t.line }]}>
        <Text style={[styles.headerTitle, { color: t.fg }]}>
          {teacherName} 선생님
        </Text>
        <View
          style={[
            styles.tokenBadge,
            { backgroundColor: accTint(t, 0.12), borderColor: accTint(t, 0.2) },
          ]}
        >
          <SparkIcon color={t.accText} size={14} />
          <Text style={[styles.tokenText, { color: t.accText }]}>{tokens}</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => <Bubble msg={item} t={t} />}
          contentContainerStyle={styles.list}
          onLayout={() => flatRef.current?.scrollToEnd({ animated: false })}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={[styles.emptyChat, { color: t.mut }]}>
              질문을 입력해보세요
            </Text>
          }
        />

        <View style={[styles.composer, { borderTopColor: t.line, backgroundColor: t.bg }]}>
          {tokens <= 0 && (
            <Text style={[styles.noToken, { color: t.mut }]}>AI 토큰이 부족합니다</Text>
          )}
          <View style={[styles.inputRow, { backgroundColor: t.panel, borderColor: t.line2 }]}>
            <TextInput
              style={[styles.inputField, { color: t.fg }]}
              placeholder="질문을 입력하세요..."
              placeholderTextColor={t.mut2}
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={500}
              editable={tokens > 0}
            />
            <Pressable
              style={[
                styles.sendBtn,
                { backgroundColor: canSend ? t.acc : t.panel2 },
              ]}
              onPress={handleSend}
              disabled={!canSend}
            >
              {sending ? (
                <ActivityIndicator color={t.onAcc} size="small" />
              ) : (
                <SendIcon color={canSend ? t.onAcc : t.mut2} size={18} />
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  noTeacherHeader: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 17, fontWeight: "800", letterSpacing: -0.5 },
  tokenBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tokenText: { fontSize: 13, fontWeight: "700" },
  emptyText: { fontSize: 14, lineHeight: 22, textAlign: "center" },
  list: { padding: 16, gap: 6, paddingBottom: 24 },
  emptyChat: { textAlign: "center", marginTop: 60, fontSize: 14 },
  bubbleWrap: { alignItems: "flex-start", marginVertical: 2 },
  bubbleWrapMe: { alignItems: "flex-end" },
  aiLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 4,
    alignSelf: "flex-start",
  },
  aiLabelText: { fontSize: 11, fontWeight: "700" },
  bubble: { maxWidth: "80%", padding: 12, borderWidth: 1 },
  bubbleThem: { borderRadius: 18, borderTopLeftRadius: 5 },
  bubbleMe: { borderRadius: 18, borderTopRightRadius: 5 },
  bubbleAi: { borderRadius: 18, borderTopLeftRadius: 5 },
  bubbleText: { fontSize: 14.5, lineHeight: 21 },
  composer: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 24,
  },
  noToken: { fontSize: 12, textAlign: "center", marginBottom: 8 },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderRadius: 18,
    borderWidth: 1,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 6,
    gap: 8,
  },
  inputField: { flex: 1, fontSize: 14.5, maxHeight: 100, paddingVertical: 4 },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
