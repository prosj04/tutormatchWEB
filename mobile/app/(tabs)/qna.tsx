import { SafeAreaView } from "react-native-safe-area-context";
import React, { useRef, useState } from "react";
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
  chat as chatS,
  font,
} from "../../styles/app-styles";
import { useTheme } from "../../theme/ThemeProvider";
import { accTint } from "../../theme/tokens";

// ─── 메시지 말풍선 ─────────────────────────────────────────────────────────────
// .msg { max-width:80%; padding:11 14; border-radius:16; font-size:13.5; line-height:20; margin-bottom:9; }
// .msg.them { border:1px; border-bottom-left-radius:5; }
// .msg.me { border-bottom-right-radius:5; align-self:flex-end; bg:acc; color:on-acc; }
// .msg.ai { border:1px; border-bottom-left-radius:5; bg:acc/10 tint; }
// .msg.ai .tag { font-size:10; font-weight:800; letter-spacing:.06em; uppercase; }
// .msg.ai .empty → 토큰 소진 안내
function MsgBubble({ type, text, aiTag, tokenEmpty }: {
  type: "me" | "them" | "ai";
  text: string;
  aiTag?: string;
  tokenEmpty?: boolean;
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
      {tokenEmpty && (
        <Text style={[styles.tokenEmptySub, { color: t.mut }]}>
          충전하면 AI 즉답을 다시 사용할 수 있어요.
        </Text>
      )}
    </View>
  );
}

// ─── .resolve 해결 선택 박스 ──────────────────────────────────────────────────
// .resolve { border:1px; border-radius:16; padding:14; margin-bottom:9; shadow-sm; }
// .resolve p { font-size:12.5; font-weight:600; text-align:center; margin-bottom:11; }
// .resolve button { flex:1; padding:11; border-radius:11; font-weight:700; font-size:13; }
function ResolvePrompt({ onResolve, onAsk }: { onResolve: () => void; onAsk: () => void }) {
  const { t } = useTheme();
  return (
    <View style={[chatS.resolve, { backgroundColor: t.panel, borderColor: t.line }]}>
      <Text style={[chatS.resolveP, { color: t.fg }]}>이 답변으로 해결되었나요?</Text>
      <View style={{ flexDirection: "row", gap: 9 }}>
        <Pressable
          style={[chatS.resolveBtn, { backgroundColor: accTint(t, 0.10), borderWidth: 0 }]}
          onPress={onResolve}
        >
          <Text style={{ color: t.accText, fontFamily: font.bold, fontSize: 13 }}>✓ 해결됐어요</Text>
        </Pressable>
        <Pressable
          style={[chatS.resolveBtn, { backgroundColor: t.panel2, borderWidth: 0 }]}
          onPress={onAsk}
        >
          <Text style={{ color: t.fg, fontFamily: font.bold, fontSize: 13 }}>💬 선생님께 질문</Text>
        </Pressable>
      </View>
    </View>
  );
}

type ChatState = "ai" | "teacher" | "token_empty";

export default function QnAScreen() {
  const { t } = useTheme();
  const [text, setText] = useState("");
  const [chatState, setChatState] = useState<ChatState>("ai");
  const scrollRef = useRef<ScrollView>(null);

  const tokenEmpty = chatState === "token_empty";

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[styles.scrollContent, { paddingTop: 4 }]}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          {/* .chat-head flex-row align:center gap:11 padding:6 2 14 */}
          <View style={[chatS.head]}>
            <Pressable style={[styles.backBtn, { backgroundColor: t.panel, borderColor: t.line }]}>
              <Text style={{ color: t.fg, fontSize: 18 }}>‹</Text>
            </Pressable>
            {/* .av width:40 height:40 border-radius:12 */}
            <View style={[chatS.headAv, { backgroundColor: accTint(t, 0.12) }]}>
              <Text style={[styles.headAvText, { color: t.accText }]}>N</Text>
            </View>
            <View>
              <Text style={[chatS.headNm, { color: t.fg }]}>수학 · Teacher Noah</Text>
              <Text style={[chatS.headSub, { color: t.mut }]}>
                {tokenEmpty ? "● 보통 1시간 내 답변" : "● 질문하면 AI가 먼저 답해요"}
              </Text>
            </View>
          </View>

          {/* .daysep text-align:center font-size:11 margin:4 0 12 */}
          <Text style={[chatS.daysep, { color: t.mut2 }]}>오늘</Text>

          {/* messages */}
          <MsgBubble type="me" text="선생님, 미적분 활용 문제에서 속도-시간 그래프 넓이가 왜 이동거리가 되나요?" />

          {chatState === "ai" && (
            <>
              <MsgBubble
                type="ai"
                aiTag="AI 즉답 · 토큰 1 사용"
                text="속도 v(t)를 t로 적분한 ∫v dt가 위치 변화량입니다. 그래프에서 곡선 아래 면적이 곧 그 적분값이라, 면적이 이동거리와 같아져요."
              />
              <ResolvePrompt onResolve={() => setChatState("teacher")} onAsk={() => setChatState("teacher")} />
            </>
          )}

          {tokenEmpty && (
            <>
              <MsgBubble
                type="ai"
                aiTag="AI 즉답"
                text="이번 달 AI 즉답 토큰을 모두 사용했어요. 지금부터는 선생님이 직접 답변해 드려요."
                tokenEmpty
              />
              <MsgBubble type="them" text="그럼요. 방금 보니 적분 구간 설정에서 헷갈린 것 같아요. 풀이 사진 보낼 테니 같이 보고, 내일 수업에서 한 번 더 정리해요." />
              <MsgBubble type="me" text="감사합니다 선생님 🙏" />
            </>
          )}

          <View style={{ height: 6 }} />
        </ScrollView>

        {/* Composer */}
        {tokenEmpty ? (
          // .composer.ask-only — 토큰 소진 상태
          <View style={[chatS.composer, chatS.composerAskOnly, { borderTopColor: t.line, backgroundColor: t.bg }]}>
            <Text style={[chatS.depNote, { color: t.mut2 }]}>AI 토큰을 모두 사용했어요 · 답변은 선생님이 직접 드려요</Text>
            <Pressable style={[chatS.askBtn, { backgroundColor: accTint(t, 0.10) }]}>
              <Text style={{ color: t.accText, fontFamily: font.bold, fontSize: 14 }}>💬 선생님께 질문하기</Text>
            </Pressable>
          </View>
        ) : (
          // .composer — 일반 입력
          <View style={[chatS.composer, { borderTopColor: t.line, backgroundColor: t.bg }]}>
            {/* .composer .in flex:1 padding:11 15 border-radius:999 border:1px font-size:13.5 */}
            <TextInput
              style={[chatS.composerIn, { backgroundColor: t.panel, borderColor: t.line2, color: t.fg, flex: 1 }]}
              placeholder="메시지 입력…"
              placeholderTextColor={t.mut2}
              value={text}
              onChangeText={setText}
              multiline
            />
            {/* .composer .snd width:42 height:42 border-radius:21 bg:acc */}
            <Pressable style={[chatS.composerSnd, { backgroundColor: t.acc }]}>
              <Text style={{ color: t.onAcc, fontSize: 16 }}>↑</Text>
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { paddingHorizontal: 18, paddingBottom: 8 },

  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headAvText: { fontFamily: font.bold, fontSize: 15 },

  aiTagText: { fontSize: 10, fontFamily: font.extrabold, letterSpacing: 0.6, textTransform: "uppercase" },

  // .msg text
  msgText: { fontSize: 13.5, lineHeight: 20 },
  tokenEmptySub: { fontSize: 11, marginTop: 6 },
});
