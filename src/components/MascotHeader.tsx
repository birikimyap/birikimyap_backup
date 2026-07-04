import { StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, typography } from "@/theme";

type MascotHeaderProps = {
  title: string;
  caption: string;
};

export function MascotHeader({ title, caption }: MascotHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.mark}>
        <View style={styles.coin} />
        <Text style={styles.markText}>BY</Text>
      </View>
      <View style={styles.copy}>
        <Text style={styles.caption}>{caption}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md
  },
  mark: {
    width: 58,
    height: 58,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden"
  },
  coin: {
    position: "absolute",
    right: -10,
    top: -8,
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.accent
  },
  markText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: "900"
  },
  copy: {
    flex: 1
  },
  caption: {
    ...typography.caption,
    color: colors.textMuted
  },
  title: {
    ...typography.subtitle,
    color: colors.primary
  }
});
