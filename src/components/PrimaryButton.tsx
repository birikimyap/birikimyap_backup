import { Pressable, StyleSheet, Text, ViewStyle } from "react-native";

import { colors, radius, shadows, spacing, typography } from "@/theme";

type PrimaryButtonProps = {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
  style?: ViewStyle;
};

export function PrimaryButton({ title, onPress, variant = "primary", style }: PrimaryButtonProps) {
  const isPrimary = variant === "primary";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        isPrimary ? styles.primary : styles.secondary,
        pressed && styles.pressed,
        style
      ]}
    >
      <Text style={[styles.text, isPrimary ? styles.primaryText : styles.secondaryText]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 58,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl
  },
  primary: {
    backgroundColor: colors.primary,
    ...shadows.button
  },
  secondary: {
    backgroundColor: colors.primarySoft
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }]
  },
  text: {
    ...typography.body,
    fontWeight: "800"
  },
  primaryText: {
    color: colors.white
  },
  secondaryText: {
    color: colors.primary
  }
});
