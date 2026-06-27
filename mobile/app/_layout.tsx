import { SplashScreen, Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { ThemeProvider } from "../theme/ThemeProvider";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="notifications" options={{ presentation: "modal" }} />
          <Stack.Screen name="teacher/[id]" />
          <Stack.Screen name="report/[id]" />
          <Stack.Screen name="subscription" />
          <Stack.Screen name="consult" />
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
