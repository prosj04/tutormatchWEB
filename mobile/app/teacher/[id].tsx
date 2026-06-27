import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Avatar } from "../../components/ui/Avatar";
import { CheckIcon } from "../../components/ui/Icons";
import { SubHead } from "../../components/ui/SubHead";
import { apiFetch } from "../../lib/api";
import { useTheme } from "../../theme/ThemeProvider";
import { accTint } from "../../theme/tokens";

interface Tutor {
  id: string;
  name: string;
  subjects: string;
  education: string;
  experience: number;
  oneLiner: string | null;
  intro: string | null;
  photoUrl: string | null;
  gender: string;
  verified: boolean;
  avgRating: number | null;
  reviewCount: number;
  matchCount: number;
  reviews: Array<{
    rating: number;
    comment: string | null;
    author: string;
    createdAt: string;
  }>;
}

function StarRating({ rating }: { rating: number }) {
  const { t } = useTheme();
  return (
    <View style={styles.stars}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Text key={i} style={{ color: i <= Math.round(rating) ? "#F59E0B" : t.panel2, fontSize: 14 }}>
          ★
        </Text>
      ))}
    </View>
  );
}

export default function TeacherScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTheme();
  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    apiFetch<{ tutor: Tutor }>(`/api/mobile/tutors/${id}`)
      .then((d) => setTutor(d.tutor))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      <View style={styles.headWrap}>
        <SubHead title="내 선생님" />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={t.acc} />
        </View>
      ) : error || !tutor ? (
        <View style={styles.center}>
          <Text style={[styles.errText, { color: t.mut }]}>선생님 정보를 불러올 수 없습니다.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={[styles.profileCard, { backgroundColor: t.panel, borderColor: t.line }]}>
            <Avatar label={tutor.name.charAt(0)} size={64} radius={18} accent />
            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text style={[styles.name, { color: t.fg }]}>{tutor.name}</Text>
                {tutor.verified && (
                  <View style={[styles.verifiedBadge, { backgroundColor: accTint(t, 0.12) }]}>
                    <CheckIcon color={t.accText} size={11} />
                    <Text style={[styles.verifiedText, { color: t.accText }]}>인증</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.subjects, { color: t.accText }]}>{tutor.subjects}</Text>
              <Text style={[styles.edu, { color: t.mut }]}>{tutor.education}</Text>
            </View>
          </View>

          <View style={[styles.statsRow, { backgroundColor: t.panel, borderColor: t.line }]}>
            {[
              { label: "경력", value: `${tutor.experience}년` },
              {
                label: "평점",
                value: tutor.avgRating ? `${tutor.avgRating}` : "-",
              },
              { label: "매칭", value: `${tutor.matchCount}명` },
            ].map(({ label, value }) => (
              <View key={label} style={styles.statItem}>
                <Text style={[styles.statValue, { color: t.fg }]}>{value}</Text>
                <Text style={[styles.statLabel, { color: t.mut }]}>{label}</Text>
              </View>
            ))}
          </View>

          {(tutor.intro ?? tutor.oneLiner) && (
            <View style={[styles.introCard, { backgroundColor: t.panel, borderColor: t.line }]}>
              <Text style={[styles.introLabel, { color: t.mut }]}>소개</Text>
              <Text style={[styles.introText, { color: t.fg }]}>
                {tutor.intro ?? tutor.oneLiner}
              </Text>
            </View>
          )}

          {tutor.reviews.length > 0 && (
            <View style={styles.reviewsSection}>
              <Text style={[styles.reviewsTitle, { color: t.fg }]}>
                후기 ({tutor.reviewCount})
              </Text>
              {tutor.reviews.slice(0, 5).map((r, i) => (
                <View
                  key={i}
                  style={[styles.reviewCard, { backgroundColor: t.panel, borderColor: t.line }]}
                >
                  <View style={styles.reviewTop}>
                    <Text style={[styles.reviewAuthor, { color: t.fg }]}>{r.author}</Text>
                    <StarRating rating={r.rating} />
                  </View>
                  {r.comment && (
                    <Text style={[styles.reviewComment, { color: t.mut }]}>{r.comment}</Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  headWrap: { paddingHorizontal: 20, paddingTop: 8 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  errText: { fontSize: 14 },
  scroll: { paddingHorizontal: 20, paddingBottom: 40, gap: 12 },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  profileInfo: { flex: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  name: { fontSize: 20, fontWeight: "800", letterSpacing: -0.5 },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  verifiedText: { fontSize: 11, fontWeight: "700" },
  subjects: { fontSize: 14, fontWeight: "600", marginTop: 4 },
  edu: { fontSize: 13, marginTop: 2 },
  statsRow: {
    flexDirection: "row",
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 16,
    justifyContent: "space-around",
  },
  statItem: { alignItems: "center" },
  statValue: { fontSize: 18, fontWeight: "800", letterSpacing: -0.5 },
  statLabel: { fontSize: 12, marginTop: 3 },
  introCard: { borderRadius: 16, borderWidth: 1, padding: 16 },
  introLabel: { fontSize: 12, fontWeight: "600", marginBottom: 6 },
  introText: { fontSize: 14.5, lineHeight: 22 },
  reviewsSection: { gap: 8 },
  reviewsTitle: { fontSize: 15, fontWeight: "700", marginBottom: 4 },
  reviewCard: { borderRadius: 14, borderWidth: 1, padding: 14 },
  reviewTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  reviewAuthor: { fontSize: 14, fontWeight: "700" },
  stars: { flexDirection: "row" },
  reviewComment: { fontSize: 13.5, lineHeight: 19 },
});
