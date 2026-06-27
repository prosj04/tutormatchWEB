import { Tabs } from "expo-router";
import React from "react";

import { ChatIcon, HomeIcon, LearningIcon, MyIcon } from "../../components/ui/Icons";
import { useTheme } from "../../theme/ThemeProvider";

export default function TabsLayout() {
  const { t } = useTheme();

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
        name="learning"
        options={{
          title: "학습",
          tabBarIcon: ({ color, size }) => <LearningIcon color={color as string} size={size - 2} />,
        }}
      />
      <Tabs.Screen
        name="qna"
        options={{
          title: "질문",
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
    </Tabs>
  );
}
