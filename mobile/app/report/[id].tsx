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
import Svg, { Circle } from "react-native-svg";

import { SubHead } from "../../components/ui/SubHead";
import { apiFetch } from "../../lib/api";
import { useTheme } from "../../theme/ThemeProvider";
import { accTint } from "../../theme/tokens";

interface Report {
  month: string;
  summary: string;
  weakTypes: string[];
  detail: string | null;
}

function ProgressRing({ percent, size = 80 }: { percent: number; size?: number }) {
  const { t } = useTheme();
  const sw = 8;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <Svg width={size} height={size}>
      <Circle cx={size / 2} cy={size / 2} r={r} stroke={t.panel2} strokeWidth={sw} fill="none" />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={t.acc}
        strokeWidth={sw}
        fill="none"
        strokeDasharray={`${circ} ${circ}`}
        strokeDashoffset={circ * (1 - Math.min(percent, 100) / 100)}
        strokeLinecap="round"
        rotation="-90"
        originX={size / 2}
        originY={size / 2}
      />
    </Svg>
  );
}

export default function ReportScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTheme();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    const month = id;
    apiFetch<{ report: Report | null }>(`/api/mobile/reports?month=${month}`)
      .then((d) => {
        if (d.report) setReport(d.report);
        else setError(true);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.bg }]}>
      <View style={styles.headWrap}>
        <SubHead title="월간 리포트" />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={t.acc} />
        </View>
      ) : error || !report ? (
        <View style={styles.center}>
          <Text style={[styles.errText, { color: t.mut }]}>리포트를 불러올 수 없습니다.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={[styles.monthCard, { backgroundColor: t.panel, borderColor: t.line }]}>
            <Text style={[styles.monthLabel, { color: t.mut }]}>기간</Text>
            <Text style={[styles.monthValue, { color: t.fg }]}>{report.month}</Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: t.panel, borderColor: t.line }]}>
            <Text style={[styles.sectionTitle, { color: t.mut }]}>총평</Text>
            <Text style={[styles.summaryText, { color: t.fg }]}>{report.summary}</Text>
          </View>

          {report.weakTypes.length > 0 && (
            <View style={[styles.weakCard, { backgroundColor: t.panel, borderColor: t.line }]}>
              <Text style={[styles.sectionTitle, { color: t.mut }]}>취약 유형</Text>
              <View style={styles.chips}>
                {report.weakTypes.map((w) => (
                  <View
                    key={w}
                    style={[
                      styles.chip,
                      { backgroundColor: accTint(t, 0.1), borderColor: accTint(t, 0.2) },
                    ]}
                  >
                    <Text style={[styles.chipText, { color: t.accText }]}>{w}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {report.detail && (
            <View style={[styles.detailCard, { backgroundColor: t.panel, borderColor: t.line }]}>
              <Text style={[styles.sectionTitle, { color: t.mut }]}>상세 피드백</Text>
              <Text style={[styles.detailText, { color: t.fg }]}>{report.detail}</Text>
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
  scroll: { paddingHorizontal: 20, paddingBottom: 40, gap: 12, paddingTop: 4 },
  monthCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  monthLabel: { fontSize: 12, fontWeight: "600", marginBottom: 4 },
  monthValue: { fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  summaryCard: { borderRadius: 16, borderWidth: 1, padding: 16 },
  sectionTitle: { fontSize: 12, fontWeight: "700", marginBottom: 10 },
  summaryText: { fontSize: 14.5, lineHeight: 23 },
  weakCard: { borderRadius: 16, borderWidth: 1, padding: 16 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipText: { fontSize: 13, fontWeight: "600" },
  detailCard: { borderRadius: 16, borderWidth: 1, padding: 16 },
  detailText: { fontSize: 14.5, lineHeight: 23 },
});
