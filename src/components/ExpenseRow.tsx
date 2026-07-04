import { StyleSheet, Text, View } from "react-native";

import { Expense } from "@/models/finance";
import { colors, radius, spacing, typography } from "@/theme";
import { formatCurrency } from "@/utils/currency";

type ExpenseRowProps = {
  expense: Expense;
};

export function ExpenseRow({ expense }: ExpenseRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.icon}>
        <Text style={styles.iconText}>{expense.label.slice(0, 1).toUpperCase()}</Text>
      </View>
      <View style={styles.copy}>
        <Text style={styles.label}>{expense.label}</Text>
        <Text style={styles.meta}>Aylik sabit gider</Text>
      </View>
      <Text style={styles.amount}>{formatCurrency(expense.amount)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center"
  },
  iconText: {
    ...typography.caption,
    color: colors.primary
  },
  copy: {
    flex: 1
  },
  label: {
    ...typography.body,
    color: colors.text,
    fontWeight: "800"
  },
  meta: {
    ...typography.caption,
    color: colors.textMuted
  },
  amount: {
    ...typography.caption,
    color: colors.primary
  }
});
