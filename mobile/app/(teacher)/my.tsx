import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";

import {
  card as cardS,
  field as fieldS,
  font,
  my as myS,
  scroll as scrollS,
  sectT as sectTS,
  switchStyle,
} from "../../styles/app-styles";
import { ErrorState } from "../../components/ui/ErrorState";
import { BellIcon, ChevronRightIcon, LockIcon } from "../../components/ui/Icons";
import {
  FileTextIcon,
  ImageIcon,
  InfoCircleIcon,
} from "../../components/teacher/TeacherIcons";
import { useAuth } from "../../hooks/useAuth";
import { apiFetch, apiUpload } from "../../lib/api";
import { filePart } from "../../lib/upload";
import { useTheme } from "../../theme/ThemeProvider";
import { accTint } from "../../theme/tokens";

interface ProfileData {
  teacher: { id: string; name: string; subjects: string; bio: string | null };
  profile: {
    photoUrl: string | null;
    intro: string;
    education: unknown[];
    career: unknown[];
    certificates: unknown[];
    resumeUrls: string[];
    documentUrls: string[];
    updatedAt: string;
  } | null;
}

type DocType = "resume" | "document";
const DOC_LABEL: Record<DocType, string> = { resume: "이력서", document: "인증서류" };

function MRow({
  icon,
  label,
  sub,
  trailing,
  onPress,
  divider,
}: {
  icon: React.ReactNode;
  label: string;
  sub?: string;
  trailing?: React.ReactNode;
  onPress?: () => void;
  divider?: boolean;
}) {
  const { t } = useTheme();
  const inner = (
    <View style={[myS.mrow, divider && { borderTopWidth: 1, borderTopColor: t.line }]}>
      <View style={[myS.mrowIc, { backgroundColor: t.panel2 }]}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={[myS.mrowGb, { color: t.fg }]}>{label}</Text>
        {sub ? <Text style={[myS.mrowGp, { color: t.mut }]}>{sub}</Text> : null}
      </View>
      {trailing ?? <Text style={[styles.chev, { color: t.mut2 }]}>›</Text>}
    </View>
  );
  return onPress ? <Pressable onPress={onPress}>{inner}</Pressable> : inner;
}

function Switch({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  const { t } = useTheme();
  return (
    <Pressable onPress={onToggle} hitSlop={8}>
      <View style={[switchStyle.track, { backgroundColor: on ? t.acc : t.line2 }]}>
        <View style={[switchStyle.thumb, { left: on ? 19.5 : 2.5 }]} />
      </View>
    </Pressable>
  );
}

export default function TeacherMyScreen() {
  const { t } = useTheme();
  const router = useRouter();
  const { logout } = useAuth();

  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [notifyOn, setNotifyOn] = useState(true);
  const [pwOpen, setPwOpen] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [docUploading, setDocUploading] = useState<DocType | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const d = await apiFetch<ProfileData>("/api/mobile/teacher/profile");
      setData(d);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const name = data?.teacher.name ?? "";
  const initial = name[0] ?? "?";
  const subjects = data?.teacher.subjects ?? "";
  const docCount =
    (data?.profile?.documentUrls.length ?? 0) + (data?.profile?.resumeUrls.length ?? 0);

  const pickPhoto = useCallback(async () => {
    if (photoUploading) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("사진 접근 권한 필요", "설정에서 사진 보관함 접근을 허용해 주세요.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset) return;

    setPhotoUploading(true);
    try {
      const form = new FormData();
      form.append("file", filePart(asset.uri, asset.fileName, asset.mimeType));
      await apiUpload<{ photoUrl: string }>("/api/mobile/teacher/profile/photo", form);
      await load();
    } catch {
      Alert.alert("업로드 실패", "프로필 사진 업로드에 실패했어요. 다시 시도해 주세요.");
    } finally {
      setPhotoUploading(false);
    }
  }, [photoUploading, load]);

  const uploadDoc = useCallback(
    async (type: DocType) => {
      if (docUploading) return;
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (!asset) return;

      setDocUploading(type);
      try {
        const form = new FormData();
        form.append("file", filePart(asset.uri, asset.name, asset.mimeType));
        form.append("type", type);
        await apiUpload("/api/mobile/teacher/profile/documents", form);
        await load();
      } catch {
        Alert.alert("업로드 실패", "서류 업로드에 실패했어요. 다시 시도해 주세요.");
      } finally {
        setDocUploading(null);
      }
    },
    [docUploading, load],
  );

  const pickDoc = useCallback(() => {
    if (docUploading) return;
    Alert.alert("서류 업로드", "업로드할 서류 종류를 선택해 주세요.", [
      { text: DOC_LABEL.resume, onPress: () => void uploadDoc("resume") },
      { text: DOC_LABEL.document, onPress: () => void uploadDoc("document") },
      { text: "취소", style: "cancel" },
    ]);
  }, [docUploading, uploadDoc]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={[scrollS, styles.content]} showsVerticalScrollIndicator={false}>
        {loading && !data && !error ? (
          <View style={styles.center}>
            <ActivityIndicator color={t.acc} />
          </View>
        ) : error ? (
          <ErrorState title="프로필을 불러오지 못했어요" onRetry={() => void load()} />
        ) : (
          <>
            {/* 프로필 헤더 */}
            <View style={myS.top}>
              <View style={[myS.av, { backgroundColor: accTint(t, 0.12) }]}>
                <Text style={[styles.avText, { color: t.accText }]}>{initial}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[myS.nm, { color: t.fg }]}>{name || "선생님"}</Text>
                {subjects ? <Text style={[myS.sub, { color: t.mut }]}>{subjects}</Text> : null}
              </View>
              <View style={[styles.statusBadge, { backgroundColor: accTint(t, 0.12) }]}>
                <Text style={[styles.statusText, { color: t.accText }]}>선생님</Text>
              </View>
            </View>

            <Text style={[sectTS, styles.sectT, { color: t.fg }]}>프로필</Text>
            <View style={[cardS, styles.menuCard, { backgroundColor: t.panel, borderColor: t.line, shadowColor: t.fg }]}>
              <MRow
                icon={<ImageIcon color={t.accText} size={18} />}
                label="프로필 사진"
                sub={data?.profile?.photoUrl ? "등록됨 · 눌러서 변경" : "갤러리에서 사진 업로드"}
                onPress={photoUploading ? undefined : () => void pickPhoto()}
                trailing={
                  photoUploading ? <ActivityIndicator color={t.acc} size="small" /> : undefined
                }
              />
              <MRow
                icon={<FileTextIcon color={t.accText} size={18} />}
                label="서류 관리"
                sub={
                  docUploading
                    ? `${DOC_LABEL[docUploading]} 업로드 중…`
                    : docCount > 0
                      ? `${docCount}건 등록됨 · 눌러서 추가`
                      : "이력서·인증서류 (PDF·이미지)"
                }
                onPress={docUploading ? undefined : pickDoc}
                trailing={
                  docUploading ? <ActivityIndicator color={t.acc} size="small" /> : undefined
                }
                divider
              />
            </View>

            <Text style={[sectTS, styles.sectT, { color: t.fg }]}>수업 도구</Text>
            <View style={[cardS, styles.menuCard, { backgroundColor: t.panel, borderColor: t.line, shadowColor: t.fg }]}>
              <MRow
                icon={<FileTextIcon color={t.accText} size={18} />}
                label="숙제 템플릿"
                sub="자주 쓰는 주간 루틴 저장·관리"
                onPress={() => router.push("/(teacher)/templates" as never)}
              />
              <MRow
                icon={<FileTextIcon color={t.accText} size={18} />}
                label="정산"
                sub="월별 완료 수업·정산 합계 조회"
                onPress={() => router.push("/(teacher)/settlements" as never)}
                divider
              />
            </View>

            <Text style={[sectTS, styles.sectT, { color: t.fg }]}>설정</Text>
            <View style={[cardS, styles.menuCard, { backgroundColor: t.panel, borderColor: t.line, shadowColor: t.fg }]}>
              <MRow
                icon={<BellIcon color={t.accText} size={18} />}
                label="알림"
                sub="수업·질문·배정 알림"
                trailing={<Switch on={notifyOn} onToggle={() => setNotifyOn((v) => !v)} />}
              />
              <MRow
                icon={<LockIcon color={t.accText} size={18} />}
                label="비밀번호 변경"
                sub="현재 비밀번호 확인 후 변경"
                onPress={() => setPwOpen((v) => !v)}
                trailing={
                  <View style={pwOpen ? styles.chevOpen : undefined}>
                    <ChevronRightIcon color={t.mut2} size={18} />
                  </View>
                }
                divider
              />
              {pwOpen ? <PasswordForm onDone={() => setPwOpen(false)} /> : null}
            </View>

            <View style={[styles.banner, { backgroundColor: "rgba(0,0,0,0)", borderColor: t.line2 }]}>
              <InfoCircleIcon color={t.accText} size={17} />
              <Text style={[styles.bannerText, { color: t.mut }]}>
                프로필·서류는 웹 포털과 공유돼요. 여러 파일을 한 번에 정리하려면 웹 포털에서도 관리할 수 있어요.
              </Text>
            </View>

            <Pressable style={styles.logoutWrap} onPress={logout}>
              <Text style={[styles.logoutText, { color: t.mut2 }]}>로그아웃</Text>
            </Pressable>
          </>
        )}
        <View style={{ height: 6 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// 비밀번호 변경 인라인 폼 — POST /api/mobile/me/password
function PasswordForm({ onDone }: { onDone: () => void }) {
  const { t } = useTheme();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const save = async () => {
    setErr("");
    if (next.length < 8) {
      setErr("새 비밀번호는 8자 이상이어야 해요.");
      return;
    }
    setSaving(true);
    try {
      await apiFetch<{ ok: boolean }>("/api/mobile/me/password", {
        method: "POST",
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      Alert.alert("완료", "비밀번호가 변경됐어요.");
      setCurrent("");
      setNext("");
      onDone();
    } catch {
      setErr("현재 비밀번호가 올바르지 않거나 변경에 실패했어요.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.pwForm, { borderTopColor: t.line, backgroundColor: t.panel2 }]}>
      <View style={fieldS.wrap}>
        <Text style={[fieldS.label, { color: t.fg }]}>현재 비밀번호</Text>
        <TextInput
          style={[fieldS.inp, { backgroundColor: t.panel, borderColor: t.line2, color: t.fg }]}
          placeholderTextColor={t.mut2}
          placeholder="현재 비밀번호"
          value={current}
          onChangeText={setCurrent}
          secureTextEntry
        />
      </View>
      <View style={fieldS.wrap}>
        <Text style={[fieldS.label, { color: t.fg }]}>
          새 비밀번호 <Text style={{ color: t.mut2, fontFamily: font.medium }}>· 8자 이상</Text>
        </Text>
        <TextInput
          style={[fieldS.inp, { backgroundColor: t.panel, borderColor: t.line2, color: t.fg }]}
          placeholderTextColor={t.mut2}
          placeholder="새 비밀번호"
          value={next}
          onChangeText={setNext}
          secureTextEntry
        />
      </View>
      {err !== "" ? <Text style={[styles.error, { color: t.danger }]}>{err}</Text> : null}
      <Pressable
        style={[styles.pwSave, { backgroundColor: t.acc }, (saving || !current || !next) && styles.disabled]}
        onPress={() => void save()}
        disabled={saving || !current || !next}
      >
        {saving ? (
          <ActivityIndicator color={t.onAcc} size="small" />
        ) : (
          <Text style={[styles.pwSaveText, { color: t.onAcc }]}>비밀번호 변경</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingBottom: 8 },
  center: { paddingVertical: 60, alignItems: "center" },
  avText: { fontSize: 22, fontFamily: font.extrabold },
  statusBadge: { paddingVertical: 5, paddingHorizontal: 11, borderRadius: 999 },
  statusText: { fontSize: 11, fontFamily: font.bold },
  sectT: { fontSize: 14 },
  menuCard: { overflow: "hidden" },
  chev: { fontSize: 20, fontFamily: font.bold },
  chevOpen: { transform: [{ rotate: "90deg" }] },
  pwForm: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 16, borderTopWidth: 1 },
  error: { fontSize: 12.5, marginBottom: 8, fontFamily: font.medium },
  pwSave: { width: "100%", paddingVertical: 13, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  pwSaveText: { fontFamily: font.extrabold, fontSize: 14.5 },
  disabled: { opacity: 0.5 },
  banner: {
    flexDirection: "row",
    gap: 11,
    paddingVertical: 14,
    paddingHorizontal: 15,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 16,
  },
  bannerText: { flex: 1, fontSize: 12.5, lineHeight: 19 },
  logoutWrap: { paddingVertical: 18, paddingBottom: 4, alignItems: "center" },
  logoutText: { fontSize: 13, fontFamily: font.semibold },
});
