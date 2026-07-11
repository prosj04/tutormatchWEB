import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import React, { useCallback, useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { font, shadowMd } from "../../styles/app-styles";
import { registerPushToken } from "../../lib/push";
import { useTheme } from "../../theme/ThemeProvider";
import { accTint } from "../../theme/tokens";
import { BellIcon } from "./Icons";

const SEEN_KEY = "concord-push-primer-seen";

/**
 * 푸시 권한 프리프롬프트(가치 설명 다이얼로그).
 * OS 권한 팝업 전에 1회 노출 → "알림 허용" 시 registerPushToken() 호출.
 * 로직 변경 최소: registerPushToken 자체는 그대로 사용한다.
 */
export function PushPrimer() {
  const { t } = useTheme();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [seen, perm] = await Promise.all([
        AsyncStorage.getItem(SEEN_KEY),
        Notifications.getPermissionsAsync(),
      ]);
      // 아직 프리프롬프트를 본 적 없고, OS 권한이 미결정 상태일 때만 노출
      if (mounted && !seen && perm.status === "undetermined") {
        setVisible(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const dismiss = useCallback(async () => {
    await AsyncStorage.setItem(SEEN_KEY, "1");
    setVisible(false);
  }, []);

  const allow = useCallback(async () => {
    await dismiss();
    await registerPushToken();
  }, [dismiss]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => void dismiss()}>
      <View style={styles.scrim}>
        <View style={[styles.dlg, { backgroundColor: t.panel, shadowColor: t.fg }]}>
          <View style={[styles.ic, { backgroundColor: accTint(t, 0.12) }]}>
            <BellIcon color={t.accText} size={24} />
          </View>
          <Text style={[styles.title, { color: t.fg }]}>수업 소식을 놓치지 마세요</Text>
          <Text style={[styles.body, { color: t.mut }]}>
            수업 리마인드, 선생님 답변, 리포트 도착을 알림으로 알려드려요. 마케팅 알림은 별도로 선택합니다.
          </Text>
          <View style={styles.acts}>
            <Pressable style={[styles.ok, { backgroundColor: t.acc }]} onPress={() => void allow()}>
              <Text style={[styles.okText, { color: t.onAcc }]}>알림 허용</Text>
            </Pressable>
            <Pressable style={styles.later} onPress={() => void dismiss()}>
              <Text style={[styles.laterText, { color: t.mut }]}>나중에 하기</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // .dlg-scrim { inset:0; background:rgba(10,12,10,.45); padding:26; }
  scrim: {
    flex: 1,
    backgroundColor: "rgba(10,12,10,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 26,
  },
  // .dlg { width:100%; border-radius:20; padding:24 22 16; box-shadow:shadow-md; text-align:center; }
  dlg: {
    width: "100%",
    borderRadius: 20,
    paddingTop: 24,
    paddingHorizontal: 22,
    paddingBottom: 16,
    alignItems: "center",
    ...shadowMd,
  },
  // .dlg .ic { width:52; height:52; border-radius:16; margin:0 auto 12; }
  ic: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  // .dlg h4 { font-size:16.5; font-weight:800; letter-spacing:-.02em; }
  title: {
    fontSize: 16.5,
    fontFamily: font.extrabold,
    letterSpacing: -0.33, // -0.02 * 16.5
    textAlign: "center",
  },
  // .dlg p { font-size:12.5; margin-top:7; line-height:1.6; }
  body: {
    fontSize: 12.5,
    marginTop: 7,
    lineHeight: 20, // 1.6 * 12.5
    textAlign: "center",
  },
  // .dlg .acts { gap:7; margin-top:16; }
  acts: { width: "100%", gap: 7, marginTop: 16 },
  // .ok { width:100%; padding:13; border-radius:12; font-weight:800; font-size:14; }
  ok: { width: "100%", paddingVertical: 13, borderRadius: 12, alignItems: "center" },
  okText: { fontSize: 14, fontFamily: font.extrabold },
  // .later { width:100%; padding:11; border-radius:12; font-weight:700; font-size:13; }
  later: { width: "100%", paddingVertical: 11, borderRadius: 12, alignItems: "center" },
  laterText: { fontSize: 13, fontFamily: font.bold },
});
