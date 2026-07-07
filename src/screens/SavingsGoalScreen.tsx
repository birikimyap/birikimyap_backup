import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Image, PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useFinanceStore } from "@/store/financeStore";
import { colors, radius } from "@/theme";
import { formatCurrency } from "@/utils/currency";
import { getMonthlyRemaining, getTotalFixedExpenses, getTotalIncome } from "@/utils/finance";
import { translations } from "@/utils/translations";

const mascotTR = require("../../pgn/mascot-cutout.png");
const mascotEN = require("../../pgn/mascot-cutout-dollar.png");

const goalCards = [
  { id: "emergency", title: "Acil durum", subtitle: "Güvende hisset", icon: "shield" },
  { id: "vacation", title: "Tatil", subtitle: "Mola zamanı", icon: "sun" },
  { id: "phone", title: "Yeni telefon", subtitle: "Kendine ödül", icon: "smartphone" },
  { id: "car", title: "Araba", subtitle: "Özgürlüğe doğru", icon: "truck" },
  { id: "home", title: "Ev", subtitle: "Hayalindeki ev", icon: "home" }
] as const;

type GoalCard = {
  id: string;
  title: string;
  subtitle: string;
  icon: any;
};

const sliderStep = 500;

export default function SavingsGoalScreen() {
  const language = useFinanceStore((state) => state.language);
  const mascot = language === "tr" ? mascotTR : mascotEN;
  const t = (key: keyof typeof translations["tr"]) => translations[language][key] || key;

  const incomes = useFinanceStore((state) => state.incomes);
  const expenses = useFinanceStore((state) => state.expenses);
  const planMonthlyRemaining = useFinanceStore((state) => state.plan.monthlyRemaining);
  const savingsGoal = useFinanceStore((state) => state.savingsGoal);
  const setSavingsGoal = useFinanceStore((state) => state.setSavingsGoal);
  const fixedExpenses = expenses.filter((expense) => expense.isFixed);
  const totalIncome = getTotalIncome(incomes);
  const totalFixedExpenses = getTotalFixedExpenses(expenses);
  const calculatedMonthlyRemaining = getMonthlyRemaining(incomes, expenses);
  const monthlyRemaining = calculatedMonthlyRemaining;
  const initialSavings = Math.min(savingsGoal.monthlyContribution || Math.min(monthlyRemaining, 5000), monthlyRemaining);
  const [selectedSavings, setSelectedSavings] = useState(initialSavings);
  const [selectedGoal, setSelectedGoal] = useState(savingsGoal.selectedGoal || savingsGoal.title || (language === "tr" ? "Acil durum" : "Emergency"));

  console.log({
    incomes,
    totalIncome,
    fixedExpenses,
    totalFixedExpenses,
    monthlyRemaining,
    planMonthlyRemaining
  });

  const percentage = monthlyRemaining > 0 ? Math.round((selectedSavings / monthlyRemaining) * 100) : 0;

  useEffect(() => {
    setSelectedSavings((current) => Math.min(current, monthlyRemaining));
  }, [monthlyRemaining]);

  const updateSelectedSavings = (amount: number) => {
    setSelectedSavings(Math.min(amount, monthlyRemaining));
  };

  const saveAndContinue = () => {
    setSavingsGoal({
      ...savingsGoal,
      title: selectedGoal,
      selectedGoal,
      targetAmount: selectedSavings,
      currentAmount: 0,
      monthlyContribution: selectedSavings,
      dailyTarget: selectedSavings / 30,
      planStartDate: new Date().toISOString()
    });
    router.push("/plan-ready");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.screen}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <Feather name="chevron-left" size={28} color={colors.primary} />
          </Pressable>

          <View style={styles.hero}>
            <View style={styles.mascotStage}>
              <View style={styles.softOval} />
              <Text style={[styles.sparkle, styles.sparkleLeft]}>✦</Text>
              <Text style={[styles.sparkle, styles.sparkleRight]}>✦</Text>
              <Image source={mascot} style={styles.mascot} resizeMode="contain" />
            </View>
            <Text style={styles.title}>
              {language === "tr" ? "Bu ay ne kadar biriktirmek istiyorsun?" : "How much do you want to save this month?"}
            </Text>
            <Text style={styles.subtitle}>
              {language === "tr" ? "Gelir ve giderlerine göre planını birlikte oluşturalım." : "Let's create your plan based on your income and expenses."}
            </Text>
          </View>

          <View style={styles.budgetCard}>
            <View style={styles.walletBadge}>
              <Feather name="briefcase" size={26} color={colors.primary} />
            </View>
            <View style={styles.budgetCopy}>
              <View style={styles.cardTitleRow}>
                <Text style={styles.cardLabel}>
                  {language === "tr" ? "Sana kalan aylık bütçe" : "Your remaining monthly budget"}
                </Text>
              </View>
              <Text style={styles.budgetAmount}>{formatCurrency(monthlyRemaining)}</Text>
              <Text style={styles.cardBody}>
                {language === "tr" ? "Bu ay kullanabileceğin net harcama limiti." : "Net spending limit available for this month."}
              </Text>
            </View>
          </View>

          <View style={styles.sliderIntro}>
            <Text style={styles.sectionTitle}>
              {language === "tr" ? "Birikim Oranı" : "Savings Rate"}
            </Text>
            <Text style={styles.helperText}>
              {language === "tr" ? "Slider’ı hareket ettirerek birikim hedefini belirle." : "Determine your savings goal by moving the slider."}
            </Text>
          </View>

          <View style={styles.sliderCard}>
            <View style={styles.savingsHeader}>
              <Text style={styles.selectedAmount}>{formatCurrency(selectedSavings)}</Text>
              <View style={styles.percentBadge}>
                <Feather name="shield" size={14} color={colors.primary} />
                <Text style={styles.percentText}>
                  {language === "tr" ? `Kalanın %${percentage}’si` : `${percentage}% of remaining`}
                </Text>
              </View>
            </View>
            <Slider max={monthlyRemaining} step={sliderStep} value={selectedSavings} onChange={updateSelectedSavings} />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabel}>{formatCurrency(0)}</Text>
              <Text style={styles.sliderLabel}>{formatCurrency(monthlyRemaining)}</Text>
            </View>

            <View style={styles.sliderInfoRow}>
              <Feather name="trending-up" size={16} color="#E87516" />
              {language === "tr" ? (
                <Text style={styles.sliderInfoText}>
                  Bu hedefle ay sonunda <Text style={styles.sliderInfoHighlight}>{formatCurrency(selectedSavings)}</Text> biriktirebilirsin.
                </Text>
              ) : (
                <Text style={styles.sliderInfoText}>
                  With this goal, you can save <Text style={styles.sliderInfoHighlight}>{formatCurrency(selectedSavings)}</Text> by the end of the month.
                </Text>
              )}
            </View>
          </View>


        </ScrollView>

        <View style={styles.footer}>
          <Pressable onPress={saveAndContinue} style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}>
            <View style={styles.ctaSpacer} />
            <Text style={styles.ctaText}>
              {language === "tr" ? "Planımı oluştur" : "Create my plan"}
            </Text>
            <Feather name="arrow-right" size={28} color={colors.white} style={styles.ctaIcon} />
          </Pressable>

          <View style={styles.securityRow}>
            <Feather name="lock" size={15} color="#9AA19D" />
            <Text style={styles.securityText}>
              {language === "tr" ? "Verilerin güvenle saklanır." : "Your data is stored securely."}
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}



function Slider({ value, max, step, onChange }: { value: number; max: number; step: number; onChange: (value: number) => void }) {
  const language = useFinanceStore((state) => state.language);
  const [trackWidth, setTrackWidth] = useState(1);
  const progress = max > 0 ? Math.min(value / max, 1) : 0;

  const updateValue = (x: number) => {
    const ratio = Math.max(0, Math.min(x / trackWidth, 1));
    const steppedValue = Math.round((ratio * max) / step) * step;
    onChange(Math.min(steppedValue, max));
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          updateValue(evt.nativeEvent.locationX);
        },
        onPanResponderMove: (evt, gestureState) => {
          updateValue(gestureState.x0 - (evt.currentTarget as any)._layout.x + gestureState.dx);
        }
      }),
    [max, step, trackWidth]
  );

  return (
    <View
      style={styles.slider}
      onLayout={(event) => setTrackWidth(Math.max(event.nativeEvent.layout.width, 1))}
      {...panResponder.panHandlers}
    >
      <View style={styles.sliderTrack} />
      <View style={[styles.sliderFill, { width: `${progress * 100}%` }]} />
      <View style={[styles.sliderThumb, { left: `${progress * 100}%` }]}>
        <Text style={styles.sliderThumbText}>
          {useFinanceStore.getState().currency === "USD" ? "$" : useFinanceStore.getState().currency === "EUR" ? "€" : "₺"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background
  },
  screen: {
    flex: 1
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 124
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
    opacity: 0.82,
    transform: [{ scale: 0.99 }]
  },
  hero: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 16
  },
  mascotStage: {
    width: 220,
    height: 160,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8
  },
  mascot: {
    width: 140,
    height: 140
  },
  softOval: {
    position: "absolute",
    bottom: 12,
    width: 130,
    height: 36,
    borderRadius: 65,
    backgroundColor: "rgba(13, 50, 40, 0.06)"
  },
  sparkle: {
    position: "absolute",
    fontSize: 20,
    fontWeight: "900"
  },
  sparkleLeft: {
    left: 18,
    bottom: 30,
    color: "#E8BB73"
  },
  sparkleRight: {
    right: 14,
    top: 42,
    color: "#5A956D"
  },
  title: {
    maxWidth: 320,
    fontSize: 25,
    lineHeight: 31,
    fontWeight: "900",
    color: colors.primary,
    textAlign: "center"
  },
  subtitle: {
    marginTop: 6,
    maxWidth: 305,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    color: colors.textMuted,
    textAlign: "center"
  },
  budgetCard: {
    marginTop: 20,
    borderRadius: 24,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 5
  },
  walletBadge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center"
  },
  budgetCopy: {
    flex: 1,
    marginLeft: 14
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: "rgba(255, 255, 255, 0.72)",
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  budgetAmount: {
    marginTop: 4,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "900",
    color: colors.white
  },
  cardBody: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.6)",
    marginTop: 4
  },
  sliderIntro: {
    marginTop: 20,
    gap: 2
  },
  sectionTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "900",
    color: colors.primary
  },
  helperText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
    color: colors.textMuted
  },
  sliderCard: {
    marginTop: 10,
    borderRadius: 20,
    backgroundColor: colors.white,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(13, 50, 40, 0.05)",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.03,
    shadowRadius: 14,
    elevation: 2
  },
  savingsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8
  },
  selectedAmount: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "900",
    color: colors.primary
  },
  percentBadge: {
    borderRadius: 12,
    backgroundColor: "#E8F2E1",
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  percentText: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.primary
  },
  slider: {
    width: "100%",
    height: 34,
    marginTop: 4,
    justifyContent: "center"
  },
  sliderTrack: {
    height: 7,
    borderRadius: 8,
    backgroundColor: "#E8DED1"
  },
  sliderFill: {
    position: "absolute",
    left: 0,
    height: 7,
    borderRadius: 8,
    backgroundColor: colors.primary
  },
  sliderThumb: {
    position: "absolute",
    width: 36,
    height: 36,
    marginLeft: -18,
    borderRadius: 18,
    backgroundColor: colors.primary,
    borderWidth: 8,
    borderColor: "#F5EFE7",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3
  },
  sliderThumbText: {
    marginTop: -1,
    fontSize: 14,
    lineHeight: 16,
    fontWeight: "900",
    color: colors.white
  },
  sliderLabels: {
    marginTop: -4,
    flexDirection: "row",
    justifyContent: "space-between"
  },
  sliderLabel: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "900",
    color: "#747C78"
  },
  sliderInfoRow: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F4EDE4"
  },
  sliderInfoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    color: "#747C78"
  },
  sliderInfoHighlight: {
    color: "#E87516",
    fontWeight: "900"
  },
  goalTitle: {
    marginTop: 18,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "900",
    color: colors.primary
  },
  goalList: {
    gap: 9,
    paddingTop: 7,
    paddingBottom: 4
  },
  goalCard: {
    width: 104,
    height: 122,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "rgba(13, 50, 40, 0.05)",
    alignItems: "center",
    padding: 10,
    justifyContent: "center",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 1,
    marginRight: 10,
    position: "relative"
  },
  goalCardSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: colors.primarySoft,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3
  },
  goalIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center"
  },
  goalIconSelected: {
    backgroundColor: colors.primary
  },
  goalCardTitle: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "800",
    color: colors.primary,
    textAlign: "center"
  },
  goalCardTitleSelected: {
    color: colors.primary
  },
  goalCardSubtitle: {
    marginTop: 2,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "600",
    color: colors.textMuted,
    textAlign: "center"
  },
  goalCardSubtitleSelected: {
    color: colors.primaryMuted
  },
  selectionDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center"
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 24,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderColor: "rgba(0,0,0,0.03)"
  },
  cta: {
    minHeight: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
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
  ctaSpacer: {
    width: 24
  },
  ctaText: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "800",
    color: colors.white,
    textAlign: "center"
  },
  ctaIcon: {
    width: 24
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
