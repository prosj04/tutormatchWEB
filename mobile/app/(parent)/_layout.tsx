import { Tabs } from "expo-router";
import React, { useEffect } from "react";

import {
  CardIcon,
  ChatIcon,
  DocumentIcon,
  HomeIcon,
  MyIcon,
} from "../../components/ui/Icons";
import { registerPushToken } from "../../lib/push";
import { useTheme } from "../../theme/ThemeProvider";

export default function ParentTabsLayout() {
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
          title: "홈",
          tabBarIcon: ({ color, size }) => <HomeIcon color={color as string} size={size - 2} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: "리포트",
          tabBarIcon: ({ color, size }) => <DocumentIcon color={color as string} size={size - 2} />,
        }}
      />
      <Tabs.Screen
        name="payments"
        options={{
          title: "결제",
          tabBarIcon: ({ color, size }) => <CardIcon color={color as string} size={size - 2} />,
        }}
      />
      <Tabs.Screen
        name="consult"
        options={{
          title: "상담",
          tabBarIcon: ({ color, size }) => <ChatIcon color={color as string} size={size - 2} />,
        }}
      />
      <Tabs.Screen
        name="my"
        options={{
          title: "MY",
          tabBarIcon: ({ color, size }) => <MyIcon color={color as string} size={size - 2} />,
        }}
      />
      {/* 탭 밖 스택 화면 (자녀 연결) — 탭바에 노출하지 않음 */}
      <Tabs.Screen name="link" options={{ href: null }} />
    </Tabs>
  );
}
