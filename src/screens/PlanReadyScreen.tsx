import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useFinanceStore } from "@/store/financeStore";
import { colors, radius } from "@/theme";
import { formatCurrency } from "@/utils/currency";
import { translations } from "@/utils/translations";

const mascotTR = require("../../pgn/mascot-cutout.png");
const mascotEN = require("../../pgn/mascot-cutout-dollar.png");

const waveBars = Array.from({ length: 12 }, (_, index) => ({
  id: `voice-wave-${index}`,
  height: 8 + ((index * 7) % 20)
}));

export default function PlanReadyScreen() {
  const language = useFinanceStore((state) => state.language);
  const mascot = language === "tr" ? mascotTR : mascotEN;
  const t = (key: keyof typeof translations["tr"]) => translations[language][key] || key;

  const plan = useFinanceStore((state) => state.plan);
  const savingsGoal = useFinanceStore((state) => state.savingsGoal);

  const selectedSavings = plan.monthlySavings;
  const spendableMonthlyBudget = plan.spendableMonthlyBudget;
  const dailyLimit = plan.limits.daily;
  const weeklyLimit = plan.limits.weekly;
  const monthlyLimit = plan.limits.monthly;
  const goalType = savingsGoal.selectedGoal || savingsGoal.title || (language === "tr" ? "Birikim hedefi" : "Savings goal");

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
          <Feather name="chevron-left" size={28} color={colors.primary} />
        </Pressable>

        <View style={styles.hero}>
          <View style={styles.mascotContainer}>
            <View style={styles.confettiLayer} pointerEvents="none">
              {confettiPieces.map((piece) => (
                <View key={piece.id} style={[styles.confetti, piece.style]} />
              ))}
            </View>
            <Image source={mascot} style={styles.mascot} resizeMode="contain" />
          </View>
          <Text style={styles.title}>{language === "tr" ? "Planın hazır! 🎉" : "Your plan is ready! 🎉"}</Text>
          <Text style={styles.subtitle}>
            {language === "tr"
              ? "Gelir, gider ve birikim hedefine göre sana özel harcama limitlerini oluşturduk."
              : "We've created custom spending limits for you based on your income, expenses, and savings goals."}
          </Text>
        </View>

        <View style={styles.mainCard}>
          <Text style={styles.mainCardLabel}>
            {language === "tr" ? "Bu ay harcayabileceğin toplam tutar" : "Total amount you can spend this month"}
          </Text>
          <Text style={styles.mainAmount}>{formatCurrency(spendableMonthlyBudget)}</Text>
        </View>

        <View style={styles.limitGrid}>
          <LimitCard 
            title={language === "tr" ? "Günlük limit" : "Daily limit"} 
            value={dailyLimit} 
            caption={language === "tr" ? "Her gün harcama limitin" : "Your spending limit every day"} 
            icon="calendar" 
            tone="green" 
          />
          <LimitCard 
            title={language === "tr" ? "Haftalık limit" : "Weekly limit"} 
            value={weeklyLimit} 
            caption={language === "tr" ? "Her hafta harcama limitin" : "Your spending limit every week"} 
            icon="calendar" 
            tone="orange" 
          />
          <LimitCard 
            title={language === "tr" ? "Aylık limit" : "Monthly limit"} 
            value={monthlyLimit} 
            caption={language === "tr" ? "Bu ayki toplam limitin" : "Your total limit this month"} 
            icon="calendar" 
            tone="purple" 
          />
        </View>

        <View style={styles.savingsCard}>
          <View style={styles.targetIcon}>
            <Feather name="target" size={28} color="#D06D1E" />
          </View>
          <View style={styles.savingsCopy}>
            <Text style={styles.savingsTitle}>{t("savingsGoalTitle")}</Text>
            <Text style={styles.savingsAmount}>{formatCurrency(selectedSavings)}</Text>
            <Text style={styles.savingsCaption}>
              {language === "tr"
                ? `${goalType} için ay sonuna kadar seni takip edeceğiz.`
                : `We will track your progress for ${goalType} until the end of the month.`}
            </Text>
          </View>
        </View>

        <Pressable onPress={() => router.replace("/home")} style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}>
          <Feather name="star" size={25} color="#F2D38A" />
          <Text style={styles.ctaText}>{language === "tr" ? "Finans panelime git" : "Go to my dashboard"}</Text>
          <Feather name="arrow-right" size={29} color={colors.white} />
        </Pressable>

        <View style={styles.securityRow}>
          <Feather name="lock" size={15} color="#9AA19D" />
          <Text style={styles.securityText}>
            {language === "tr" ? "Verilerin güvenle saklanır." : "Your data is stored securely."}
          </Text>
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
  { id: "c1", style: { left: 200, top: 110, backgroundColor: "#E87516", transform: [{ rotate: "90deg" }] } },
  { id: "c2", style: { left: 174, top: 174, backgroundColor: "#69A071", transform: [{ rotate: "45deg" }] } },
  { id: "c3", style: { left: 110, top: 200, backgroundColor: "#B4688A", transform: [{ rotate: "0deg" }] } },
  { id: "c4", style: { left: 46, top: 174, backgroundColor: "#F0B35B", transform: [{ rotate: "-45deg" }] } },
  { id: "c5", style: { left: 20, top: 110, backgroundColor: "#69A071", transform: [{ rotate: "-90deg" }] } },
  { id: "c6", style: { left: 46, top: 46, backgroundColor: "#F0B35B", transform: [{ rotate: "-135deg" }] } },
  { id: "c7", style: { left: 110, top: 20, backgroundColor: "#E87516", transform: [{ rotate: "180deg" }] } },
  { id: "c8", style: { left: 174, top: 46, backgroundColor: "#B4688A", transform: [{ rotate: "135deg" }] } }
];

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 24
  },
  backButton: {
    position: "absolute",
    top: 12,
    left: 16,
    zIndex: 15,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  pressed: {
    opacity: 0.84,
    transform: [{ scale: 0.99 }]
  },
  hero: {
    marginTop: 10,
    alignItems: "center",
    marginBottom: 16
  },
  mascotContainer: {
    width: 220,
    height: 220,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginBottom: 8
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
    width: 140,
    height: 140
  },
  title: {
    marginTop: 8,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "900",
    color: colors.primary,
    textAlign: "center"
  },
  subtitle: {
    marginTop: 6,
    maxWidth: 330,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    color: colors.textMuted,
    textAlign: "center",
    paddingHorizontal: 10
  },
  mainCard: {
    marginTop: 20,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: "center",
    padding: 22,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 5
  },
  mainCardLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: "rgba(255, 255, 255, 0.72)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    textAlign: "center"
  },
  mainAmount: {
    marginTop: 8,
    fontSize: 38,
    lineHeight: 46,
    fontWeight: "900",
    color: colors.white,
    textAlign: "center"
  },
  limitGrid: {
    marginTop: 14,
    flexDirection: "row",
    gap: 10
  },
  limitCard: {
    flex: 1,
    minHeight: 112,
    borderRadius: 18,
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 14,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 1
  },
  limitIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  greenIcon: {
    backgroundColor: "rgba(13, 50, 40, 0.08)"
  },
  orangeIcon: {
    backgroundColor: "rgba(232, 117, 22, 0.08)"
  },
  purpleIcon: {
    backgroundColor: "rgba(123, 91, 131, 0.08)"
  },
  limitTitle: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "800",
    color: colors.primary,
    textAlign: "center"
  },
  limitAmount: {
    marginTop: 5,
    fontSize: 19,
    lineHeight: 24,
    fontWeight: "900",
    textAlign: "center"
  },
  limitCaption: {
    marginTop: 4,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "600",
    color: colors.textMuted,
    textAlign: "center"
  },
  savingsCard: {
    marginTop: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(232, 117, 22, 0.06)",
    backgroundColor: "#FDF7EF",
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    shadowColor: "#E87516",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 1
  },
  targetIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center"
  },
  savingsCopy: {
    flex: 1,
    marginLeft: 12
  },
  savingsTitle: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "800",
    color: colors.primary
  },
  savingsAmount: {
    marginTop: 4,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "900",
    color: "#D06D1E"
  },
  savingsCaption: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
    color: colors.textMuted
  },
  cta: {
    minHeight: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    marginTop: 16,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 5
  },
  ctaPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }]
  },
  ctaText: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "800",
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
    fontWeight: "600",
    color: colors.textMuted,
    textAlign: "center"
  }
});
