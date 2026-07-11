import { Tabs } from "expo-router";
import React, { useEffect } from "react";

import {
  ConsultTabIcon,
  MatchTabIcon,
  MonitorTabIcon,
  ToolTabIcon,
} from "../../components/manager/ManagerIcons";
import { registerPushToken } from "../../lib/push";
import { useTheme } from "../../theme/ThemeProvider";

export default function ManagerTabsLayout() {
  const { t } = useTheme();

  useEffect(() => {
    void registerPushToken().catch(() => {});
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: t.panel,
          borderTopColor: t.line,
          height: 84,
          paddingBottom: 24,
          paddingTop: 10,
        },
        tabBarActiveTintColor: t.accText,
        tabBarInactiveTintColor: t.mut2,
        tabBarLabelStyle: {
          fontSize: 10.5,
          fontWeight: "600",
          marginTop: -2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "상담",
          tabBarIcon: ({ color, size }) => <ConsultTabIcon color={color as string} size={size - 2} />,
        }}
      />
      <Tabs.Screen
        name="matching"
        options={{
          title: "매칭",
          tabBarIcon: ({ color, size }) => <MatchTabIcon color={color as string} size={size - 2} />,
        }}
      />
      <Tabs.Screen
        name="monitoring"
        options={{
          title: "모니터링",
          tabBarIcon: ({ color, size }) => <MonitorTabIcon color={color as string} size={size - 2} />,
        }}
      />
      <Tabs.Screen
        name="tools"
        options={{
          title: "도구",
          tabBarIcon: ({ color, size }) => <ToolTabIcon color={color as string} size={size - 2} />,
        }}
      />
      {/* 탭 밖 스택 화면 — 탭바에 노출하지 않음 */}
      <Tabs.Screen name="match/[studentId]" options={{ href: null }} />
      <Tabs.Screen name="report/[bookingId]" options={{ href: null }} />
      <Tabs.Screen name="approval" options={{ href: null }} />
    </Tabs>
  );
}
