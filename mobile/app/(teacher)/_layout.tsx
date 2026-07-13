import { Tabs } from "expo-router";
import React, { useEffect } from "react";

import { HomeIcon } from "../../components/ui/Icons";
import { MessageIcon, UserIcon } from "../../components/teacher/TeacherIcons";
import { registerPushToken } from "../../lib/push";
import { useTheme } from "../../theme/ThemeProvider";

export default function TeacherTabsLayout() {
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
        name="students"
        options={{
          title: "학생",
          tabBarIcon: ({ color, size }) => <UserIcon color={color as string} size={size - 2} />,
        }}
      />
      <Tabs.Screen
        name="questions"
        options={{
          title: "질문",
          tabBarIcon: ({ color, size }) => <MessageIcon color={color as string} size={size - 2} />,
        }}
      />
      <Tabs.Screen
        name="my"
        options={{
          title: "MY",
          tabBarIcon: ({ color, size }) => <UserIcon color={color as string} size={size - 2} />,
        }}
      />
      {/* 스택 화면들 — 탭바에 노출하지 않는다 */}
      <Tabs.Screen name="student/[id]" options={{ href: null }} />
      <Tabs.Screen name="student/plan" options={{ href: null }} />
      <Tabs.Screen name="templates" options={{ href: null }} />
      <Tabs.Screen name="settlements" options={{ href: null }} />
    </Tabs>
  );
}
