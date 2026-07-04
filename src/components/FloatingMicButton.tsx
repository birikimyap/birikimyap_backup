import { Pressable, StyleSheet, Text } from "react-native";
import { Feather } from "@expo/vector-icons";

import { colors, radius, shadows, typography } from "@/theme";

type FloatingMicButtonProps = {
  onPress?: () => void;
};

export function FloatingMicButton({ onPress }: FloatingMicButtonProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <Feather name="mic" color={colors.white} size={24} />
      <Text style={styles.text}>Yakında</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    right: 24,
    bottom: 30,
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.button
  },
  pressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.9
  },
  text: {
    ...typography.tiny,
    color: colors.white
  }
});
