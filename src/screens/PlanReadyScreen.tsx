import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
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
      <View style={styles.screen}>
        <View style={styles.content}>
          <View style={{ flex: 1, justifyContent: "space-evenly" }}>
            <View style={{ position: "relative" }}>
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
          </View>

          <View style={styles.footer}>
            <Pressable 
              onPress={() => router.replace("/")} 
              style={({ pressed }) => [styles.ctaWrapper, pressed && styles.ctaPressed]}
            >
              <LinearGradient
                colors={["#00E58F", "#00BF76", "#048052"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.ctaGradient}
              >
                <Feather name="star" size={24} color="#031D14" />
                <Text style={styles.ctaText}>{language === "tr" ? "Finans panelime git" : "Go to my dashboard"}</Text>
                <Feather name="arrow-right" size={24} color="#031D14" />
              </LinearGradient>
            </Pressable>

            <View style={styles.securityRow}>
              <Feather name="lock" size={15} color="#9AA19D" />
              <Text style={styles.securityText}>
                {language === "tr" ? "Verilerin güvenle saklanır." : "Your data is stored securely."}
              </Text>
            </View>
          </View>
        </View>
      </View>
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
  { id: "c1", style: { left: 36, top: 22, backgroundColor: "#E87516", transform: [{ rotate: "12deg" }] } },
  { id: "c2", style: { left: 48, top: 84, backgroundColor: "#69A071", transform: [{ rotate: "-38deg" }] } },
  { id: "c3", style: { left: 42, top: 130, backgroundColor: "#B4688A", transform: [{ rotate: "68deg" }] } },
  { id: "c4", style: { left: 125, top: 15, backgroundColor: "#F0B35B", transform: [{ rotate: "-72deg" }] } },
  { id: "c5", style: { left: 180, top: 40, backgroundColor: "#E87516", transform: [{ rotate: "48deg" }] } },
  { id: "c6", style: { left: 162, top: 96, backgroundColor: "#69A071", transform: [{ rotate: "-18deg" }] } },
  { id: "c7", style: { left: 178, top: 138, backgroundColor: "#B4688A", transform: [{ rotate: "105deg" }] } }
];

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: Platform.OS === "ios" ? 10 : 20
  },
  screen: {
    flex: 1
  },
  backButton: {
    position: "absolute",
    top: -6,
    left: -6,
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
    height: 180,
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
  ctaWrapper: {
    minHeight: 56,
    borderRadius: 28,
    overflow: "hidden",
    shadowColor: "#00E58F",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.38,
    shadowRadius: 14,
    elevation: 7
  },
  ctaGradient: {
    width: "100%",
    minHeight: 56,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  ctaPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }]
  },
  footer: {
    width: "100%",
    paddingTop: 12,
    backgroundColor: colors.background
  },
  ctaText: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "900",
    color: "#031D14",
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
