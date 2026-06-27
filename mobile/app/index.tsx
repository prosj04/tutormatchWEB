import { Redirect, SplashScreen } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";

import { getAccessToken } from "../lib/auth";

export default function Index() {
  const [target, setTarget] = useState<string | null>(null);

  useEffect(() => {
    getAccessToken().then((token) => {
      setTarget(token ? "/(tabs)/" : "/(auth)/onboarding");
      SplashScreen.hideAsync();
    });
  }, []);

  if (!target) return <View style={{ flex: 1 }} />;
  return <Redirect href={target as Parameters<typeof Redirect>[0]["href"]} />;
}
