import { Stack } from "expo-router";

import { useTheme } from "../../theme/ThemeProvider";

export default function AuthLayout() {
  const { t } = useTheme();
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.bg } }}>
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="parent-signup" />
    </Stack>
  );
}
