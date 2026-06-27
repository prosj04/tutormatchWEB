import React from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";

import { useTheme } from "../../theme/ThemeProvider";

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
}

export function Card({ children, style, padding }: CardProps) {
  const { t } = useTheme();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: t.panel,
          borderColor: t.line,
          shadowColor: t.fg,
        },
        padding !== undefined && { padding },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },
});
