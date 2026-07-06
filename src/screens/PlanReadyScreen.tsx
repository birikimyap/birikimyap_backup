import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useFinanceStore } from "@/store/financeStore";
import { colors, radius } from "@/theme";
import { formatCurrency } from "@/utils/currency";
import { translations } from "@/utils/translations";

const mascot = require("../../pgn/mascot-cutout.png");

const waveBars = Array.from({ length: 12 }, (_, index) => ({
  id: `voice-wave-${index}`,
  height: 8 + ((index * 7) % 20)
}));

export default function PlanReadyScreen() {
  const language = useFinanceStore((state) => state.language);
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
          <View style={styles.confettiLayer} pointerEvents="none">
            {confettiPieces.map((piece) => (
              <View key={piece.id} style={[styles.confetti, piece.style]} />
            ))}
          </View>
          <Image source={mascot} style={styles.mascot} resizeMode="contain" />
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
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2ECD9",
    backgroundColor: "#F5F9F1",
    alignItems: "center",
    padding: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2
  },
  mainCardLabel: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "900",
    color: colors.primary,
    textAlign: "center"
  },
  mainAmount: {
    marginTop: 6,
    fontSize: 40,
    lineHeight: 48,
    fontWeight: "900",
    color: colors.primary,
    textAlign: "center"
  },
  limitGrid: {
    marginTop: 12,
    flexDirection: "row",
    gap: 7
  },
  limitCard: {
    flex: 1,
    minHeight: 104,
    borderRadius: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#EDE7DE",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1
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
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F5E9D9",
    backgroundColor: "#FDF7EF",
    flexDirection: "row",
    alignItems: "center",
    padding: 14
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
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "900",
    color: "#111614"
  },
  savingsAmount: {
    marginTop: 4,
    fontSize: 26,
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
