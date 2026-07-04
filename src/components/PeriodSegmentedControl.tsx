import { Pressable, StyleSheet, Text, View } from "react-native";

import { Period } from "@/models/finance";
import { colors, radius, spacing, typography } from "@/theme";

type PeriodSegmentedControlProps = {
  value: Period;
  onChange: (period: Period) => void;
};

const periods: Array<{ label: string; value: Period }> = [
  { label: "Gunluk", value: "daily" },
  { label: "Haftalik", value: "weekly" },
  { label: "Aylik", value: "monthly" }
];

export function PeriodSegmentedControl({ value, onChange }: PeriodSegmentedControlProps) {
  return (
    <View style={styles.wrap}>
      {periods.map((period) => {
        const selected = period.value === value;

        return (
          <Pressable
            key={period.value}
            onPress={() => onChange(period.value)}
            style={[styles.item, selected && styles.selected]}
          >
            <Text style={[styles.label, selected && styles.selectedLabel]}>{period.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    padding: spacing.xs,
    gap: spacing.xs
  },
  item: {
    flex: 1,
    minHeight: 42,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center"
  },
  selected: {
    backgroundColor: colors.surface
  },
  label: {
    ...typography.caption,
    color: colors.textMuted
  },
  selectedLabel: {
    color: colors.primary
  }
});
