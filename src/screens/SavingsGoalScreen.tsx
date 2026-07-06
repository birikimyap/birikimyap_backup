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

const mascot = require("../../pgn/mascot-cutout.png");

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

          <Text style={styles.goalTitle}>
            {language === "tr" ? "Birikim hedefi (opsiyonel)" : "Savings goal (optional)"}
          </Text>
          <FlatList
            data={[
              { id: "emergency", title: language === "tr" ? "Acil durum" : "Emergency", subtitle: language === "tr" ? "Güvende hisset" : "Feel secure", icon: "shield" },
              { id: "vacation", title: language === "tr" ? "Tatil" : "Vacation", subtitle: language === "tr" ? "Mola zamanı" : "Break time", icon: "sun" },
              { id: "phone", title: language === "tr" ? "Yeni telefon" : "New phone", subtitle: language === "tr" ? "Kendine ödül" : "Reward yourself", icon: "smartphone" },
              { id: "car", title: language === "tr" ? "Araba" : "Car", subtitle: language === "tr" ? "Özgürlüğe doğru" : "Towards freedom", icon: "truck" },
              { id: "home", title: language === "tr" ? "Ev" : "Home", subtitle: language === "tr" ? "Hayalindeki ev" : "Your dream home", icon: "home" }
            ]}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.goalList}
            renderItem={({ item }) => (
              <GoalCardItem goal={item} selectedGoal={selectedGoal} onSelect={setSelectedGoal} />
            )}
          />
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

function GoalCardItem({
  goal,
  selectedGoal,
  onSelect
}: {
  goal: GoalCard;
  selectedGoal: string;
  onSelect: (goalTitle: string) => void;
}) {
  const isSelected = selectedGoal === goal.title;

  return (
    <Pressable
      onPress={() => onSelect(goal.title)}
      style={({ pressed }) => [styles.goalCard, isSelected && styles.goalCardSelected, pressed && styles.pressed]}
    >
      <View style={[styles.goalIconWrap, isSelected && styles.goalIconSelected]}>
        <Feather name={goal.icon} size={30} color={isSelected ? colors.white : colors.primary} />
      </View>
      <Text style={styles.goalCardTitle}>{goal.title}</Text>
      <Text style={styles.goalCardSubtitle}>{goal.subtitle}</Text>
      <View style={[styles.radio, isSelected && styles.radioSelected]}>
        {isSelected && <View style={styles.radioDot} />}
      </View>
    </Pressable>
  );
}

function Slider({ value, max, step, onChange }: { value: number; max: number; step: number; onChange: (value: number) => void }) {
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
        onPanResponderGrant: (event) => updateValue(event.nativeEvent.locationX),
        onPanResponderMove: (event) => updateValue(event.nativeEvent.locationX)
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
        <Text style={styles.sliderThumbText}>₺</Text>
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
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 112
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "rgba(255,252,246,0.82)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }]
  },
  hero: {
    alignItems: "center",
    marginTop: -8
  },
  mascotStage: {
    width: 164,
    height: 118,
    alignItems: "center",
    justifyContent: "center"
  },
  mascot: {
    width: 112,
    height: 116
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
    fontSize: 27,
    lineHeight: 32,
    fontWeight: "900",
    color: colors.primary,
    textAlign: "center"
  },
  subtitle: {
    marginTop: 5,
    maxWidth: 305,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    color: "#747C78",
    textAlign: "center"
  },
  budgetCard: {
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2ECD9",
    backgroundColor: "#F5F9F1",
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2
  },
  walletBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E4F0DE",
    borderWidth: 1,
    borderColor: "#CFDFC8",
    alignItems: "center",
    justifyContent: "center"
  },
  budgetCopy: {
    flex: 1,
    marginLeft: 12
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  cardLabel: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "900",
    color: colors.primary
  },
  budgetAmount: {
    marginTop: 2,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "900",
    color: colors.primary
  },
  cardBody: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    color: "#747C78",
    marginTop: 2
  },
  sliderIntro: {
    marginTop: 18,
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
    fontWeight: "700",
    color: "#747C78"
  },
  sliderCard: {
    marginTop: 10,
    borderRadius: 16,
    backgroundColor: colors.white,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F0EAE1",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
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
    width: 96,
    minHeight: 110,
    borderRadius: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#EDE7DE",
    alignItems: "center",
    padding: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1
  },
  goalCardSelected: {
    borderColor: colors.primary,
    backgroundColor: "#FCFFF8"
  },
  goalIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#EEF4E8",
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
    fontWeight: "900",
    color: "#101514",
    textAlign: "center"
  },
  goalCardSubtitle: {
    marginTop: 2,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "700",
    color: "#747C78",
    textAlign: "center"
  },
  radio: {
    marginTop: "auto",
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#E7D8C4",
    alignItems: "center",
    justifyContent: "center"
  },
  radioSelected: {
    borderColor: colors.primary
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 7,
    backgroundColor: colors.background
  },
  cta: {
    minHeight: 58,
    borderRadius: 29,
    backgroundColor: colors.primary,
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
  ctaSpacer: {
    width: 28
  },
  ctaText: {
    fontSize: 19,
    lineHeight: 25,
    fontWeight: "900",
    color: colors.white,
    textAlign: "center"
  },
  ctaIcon: {
    width: 28
  },
  securityRow: {
    marginTop: 6,
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
