import { ReactNode } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";

import { colors, radius, shadows, spacing } from "@/theme";

type FinanceCardProps = {
  children: ReactNode;
  style?: ViewStyle;
};

export function FinanceCard({ children, style }: FinanceCardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    ...shadows.card
  }
});
