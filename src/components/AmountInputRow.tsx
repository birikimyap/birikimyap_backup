import { StyleSheet, Text, TextInput, View } from "react-native";

import { colors, radius, spacing, typography } from "@/theme";

type AmountInputRowProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
};

export function AmountInputRow({ label, value, onChangeText, placeholder = "0" }: AmountInputRowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        <Text style={styles.currency}>₺</Text>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          keyboardType="decimal-pad"
          style={styles.input}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.sm
  },
  label: {
    ...typography.caption,
    color: colors.textMuted
  },
  inputWrap: {
    minHeight: 56,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg
  },
  currency: {
    ...typography.subtitle,
    color: colors.primary,
    marginRight: spacing.sm
  },
  input: {
    flex: 1,
    ...typography.subtitle,
    color: colors.text,
    paddingVertical: spacing.md
  }
});
