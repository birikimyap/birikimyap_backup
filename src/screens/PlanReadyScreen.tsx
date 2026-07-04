import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useFinanceStore } from "@/store/financeStore";
import { colors, radius } from "@/theme";
import { formatCurrency } from "@/utils/currency";

const mascot = require("../../pgn/mascot-transparent.png");

const waveBars = Array.from({ length: 12 }, (_, index) => ({
  id: `voice-wave-${index}`,
  height: 8 + ((index * 7) % 20)
}));

export default function PlanReadyScreen() {
  const plan = useFinanceStore((state) => state.plan);
  const savingsGoal = useFinanceStore((state) => state.savingsGoal);

  const selectedSavings = plan.monthlySavings;
  const spendableMonthlyBudget = plan.spendableMonthlyBudget;
  const dailyLimit = plan.limits.daily;
  const weeklyLimit = plan.limits.weekly;
  const monthlyLimit = plan.limits.monthly;
  const goalType = savingsGoal.selectedGoal || savingsGoal.title || "Birikim hedefi";

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <Feather name="chevron-left" size={28} color={colors.primary} />
        </Pressable>

        <View style={styles.hero}>
          <View style={styles.confettiLayer} pointerEvents="none">
            {confettiPieces.map((piece) => (
              <View key={piece.id} style={[styles.confetti, piece.style]} />
            ))}
          </View>
          <Image source={mascot} style={styles.mascot} resizeMode="contain" />
          <Text style={styles.title}>Planın hazır! 🎉</Text>
          <Text style={styles.subtitle}>Gelir, gider ve birikim hedefine göre sana özel harcama limitlerini oluşturduk.</Text>
        </View>

        <View style={styles.mainCard}>
          <Text style={styles.mainCardLabel}>Bu ay harcayabileceğin toplam tutar</Text>
          <Text style={styles.mainAmount}>{formatCurrency(spendableMonthlyBudget)}</Text>
          <View style={styles.landscape}>
            <View style={styles.treeLeft} />
            <View style={styles.hillBack} />
            <View style={styles.sun} />
            <View style={styles.hillFront} />
            <View style={styles.treeRight} />
          </View>
        </View>

        <View style={styles.limitGrid}>
          <LimitCard title="Günlük limit" value={dailyLimit} caption="Her gün harcama limitin" icon="calendar" tone="green" />
          <LimitCard title="Haftalık limit" value={weeklyLimit} caption="Her hafta harcama limitin" icon="calendar" tone="orange" />
          <LimitCard title="Aylık limit" value={monthlyLimit} caption="Bu ayki toplam limitin" icon="calendar" tone="purple" />
        </View>

        <View style={styles.savingsCard}>
          <View style={styles.targetIcon}>
            <Feather name="target" size={34} color="#E87516" />
          </View>
          <View style={styles.savingsCopy}>
            <Text style={styles.savingsTitle}>Birikim hedefin</Text>
            <Text style={styles.savingsAmount}>{formatCurrency(selectedSavings)}</Text>
            <Text style={styles.savingsCaption}>{goalType} için ay sonuna kadar seni takip edeceğiz.</Text>
          </View>
          <View style={styles.plantBadge}>
            <Feather name="trending-up" size={36} color={colors.primary} />
          </View>
        </View>

        <View style={styles.voiceCard}>
          <View style={styles.voiceIcon}>
            <Feather name="mic" size={34} color="#2E6FBD" />
          </View>
          <View style={styles.voiceCopy}>
            <Text style={styles.voiceTitle}>Sesli harcama ekleyerek</Text>
            <Text style={styles.voiceSubtitle}>limitlerini anlık takip edebilirsin.</Text>
          </View>
          <View style={styles.wave}>
            {waveBars.map((bar) => (
              <View key={bar.id} style={[styles.waveBar, { height: bar.height }]} />
            ))}
          </View>
        </View>

        <Pressable onPress={() => router.replace("/home")} style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}>
          <Feather name="star" size={25} color="#F2D38A" />
          <Text style={styles.ctaText}>Finans panelime git</Text>
          <Feather name="arrow-right" size={29} color={colors.white} />
        </Pressable>

        <View style={styles.securityRow}>
          <Feather name="lock" size={15} color="#9AA19D" />
          <Text style={styles.securityText}>Verilerin 256-bit SSL ile korunur ve güvenle saklanır.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function LimitCard({
  title,
  value,
  caption,
  icon,
  tone
}: {
  title: string;
  value: number;
  caption: string;
  icon: keyof typeof Feather.glyphMap;
  tone: "green" | "orange" | "purple";
}) {
  return (
    <View style={styles.limitCard}>
      <View style={[styles.limitIcon, styles[`${tone}Icon`]]}>
        <Feather name={icon} size={22} color={toneColors[tone]} />
      </View>
      <Text style={styles.limitTitle}>{title}</Text>
      <Text style={[styles.limitAmount, { color: toneColors[tone] }]}>{formatCurrency(value)}</Text>
      <Text style={styles.limitCaption}>{caption}</Text>
    </View>
  );
}

const toneColors = {
  green: colors.primary,
  orange: "#D06D1E",
  purple: "#7B5B83"
};

const confettiPieces = [
  { id: "c1", style: { left: 36, top: 58, backgroundColor: "#E87516", transform: [{ rotate: "24deg" }] } },
  { id: "c2", style: { left: 82, top: 126, backgroundColor: "#69A071", transform: [{ rotate: "-28deg" }] } },
  { id: "c4", style: { right: 62, top: 88, backgroundColor: "#B4688A", transform: [{ rotate: "-18deg" }] } },
  { id: "c7", style: { right: 110, top: 34, backgroundColor: "#F0B35B", transform: [{ rotate: "-34deg" }] } },
  { id: "c8", style: { left: 190, top: 166, backgroundColor: "#F0B35B", transform: [{ rotate: "15deg" }] } }
];

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 14
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "rgba(255,252,246,0.84)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2
  },
  pressed: {
    opacity: 0.84,
    transform: [{ scale: 0.99 }]
  },
  hero: {
    marginTop: -12,
    alignItems: "center"
  },
  confettiLayer: {
    ...StyleSheet.absoluteFillObject
  },
  confetti: {
    position: "absolute",
    width: 8,
    height: 14,
    borderRadius: 4
  },
  mascot: {
    width: 112,
    height: 116
  },
  title: {
    marginTop: 0,
    fontSize: 33,
    lineHeight: 38,
    fontWeight: "900",
    color: colors.primary,
    textAlign: "center"
  },
  subtitle: {
    marginTop: 6,
    maxWidth: 330,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "800",
    color: "#7A817D",
    textAlign: "center"
  },
  mainCard: {
    marginTop: 16,
    minHeight: 142,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#DDE6D7",
    backgroundColor: "#F5F8EF",
    alignItems: "center",
    paddingTop: 16,
    overflow: "hidden",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 22,
    elevation: 3
  },
  mainCardLabel: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "900",
    color: colors.primary,
    textAlign: "center"
  },
  mainAmount: {
    marginTop: 6,
    fontSize: 44,
    lineHeight: 52,
    fontWeight: "900",
    color: colors.primary,
    textAlign: "center"
  },
  landscape: {
    position: "absolute",
    left: 24,
    right: 24,
    bottom: 0,
    height: 54
  },
  hillBack: {
    position: "absolute",
    left: 30,
    right: 48,
    bottom: 12,
    height: 26,
    borderTopLeftRadius: 80,
    borderTopRightRadius: 80,
    backgroundColor: "#DDEBD2",
    opacity: 0.72
  },
  hillFront: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 34,
    borderTopLeftRadius: 90,
    borderTopRightRadius: 90,
    backgroundColor: "#CEE1C4",
    opacity: 0.85
  },
  sun: {
    position: "absolute",
    left: "48%",
    bottom: 20,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#F7C879"
  },
  treeLeft: {
    position: "absolute",
    left: 36,
    bottom: 16,
    width: 13,
    height: 36,
    borderRadius: 9,
    backgroundColor: "#5A956D",
    zIndex: 2
  },
  treeRight: {
    position: "absolute",
    right: 42,
    bottom: 12,
    width: 16,
    height: 42,
    borderRadius: 10,
    backgroundColor: "#4D9366",
    zIndex: 2
  },
  limitGrid: {
    marginTop: 12,
    flexDirection: "row",
    gap: 7
  },
  limitCard: {
    flex: 1,
    minHeight: 108,
    borderRadius: 18,
    backgroundColor: colors.white,
    alignItems: "center",
    paddingHorizontal: 7,
    paddingVertical: 10,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.07,
    shadowRadius: 18,
    elevation: 3
  },
  limitIcon: {
    width: 36,
    height: 36,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center"
  },
  greenIcon: {
    backgroundColor: "#E9F3E6"
  },
  orangeIcon: {
    backgroundColor: "#FAE9D8"
  },
  purpleIcon: {
    backgroundColor: "#EFE5F2"
  },
  limitTitle: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "900",
    color: "#111614",
    textAlign: "center"
  },
  limitAmount: {
    marginTop: 5,
    fontSize: 20,
    lineHeight: 25,
    fontWeight: "900",
    textAlign: "center"
  },
  limitCaption: {
    marginTop: 4,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "700",
    color: "#737B77",
    textAlign: "center"
  },
  savingsCard: {
    marginTop: 13,
    minHeight: 96,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "#F1DFC8",
    backgroundColor: "#FCF2E7",
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    overflow: "hidden"
  },
  targetIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.7)",
    alignItems: "center",
    justifyContent: "center"
  },
  savingsCopy: {
    flex: 1,
    marginLeft: 14
  },
  savingsTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "900",
    color: "#111614"
  },
  savingsAmount: {
    marginTop: 4,
    fontSize: 27,
    lineHeight: 32,
    fontWeight: "900",
    color: "#D06D1E"
  },
  savingsCaption: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    color: "#737B77"
  },
  plantBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F7E7D0",
    alignItems: "center",
    justifyContent: "center"
  },
  voiceCard: {
    marginTop: 12,
    minHeight: 76,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "#D9E6F8",
    backgroundColor: "#F2F8FF",
    flexDirection: "row",
    alignItems: "center",
    padding: 11
  },
  voiceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E0EEFF",
    alignItems: "center",
    justifyContent: "center"
  },
  voiceCopy: {
    flex: 1,
    marginLeft: 14
  },
  voiceTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "900",
    color: "#132A4A"
  },
  voiceSubtitle: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
    color: "#737B77"
  },
  wave: {
    width: 78,
    height: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 3
  },
  waveBar: {
    width: 3,
    borderRadius: 3,
    backgroundColor: "#9FC7F5"
  },
  cta: {
    minHeight: 58,
    borderRadius: 29,
    backgroundColor: colors.primary,
    marginTop: 14,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.24,
    shadowRadius: 24,
    elevation: 7
  },
  ctaPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }]
  },
  ctaText: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "900",
    color: colors.white,
    textAlign: "center"
  },
  securityRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8
  },
  securityText: {
    flexShrink: 1,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "700",
    color: "#9AA19D",
    textAlign: "center"
  }
});
