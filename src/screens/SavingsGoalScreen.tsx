import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Image, PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useFinanceStore } from "@/store/financeStore";
import { colors, radius } from "@/theme";
import { formatCurrency } from "@/utils/currency";
import { getMonthlyRemaining, getTotalFixedExpenses, getTotalIncome } from "@/utils/finance";

const mascot = require("../../pgn/mascot-transparent.png");

const goalCards = [
  { id: "emergency", title: "Acil durum", subtitle: "Güvende hisset", icon: "shield" },
  { id: "vacation", title: "Tatil", subtitle: "Mola zamanı", icon: "sun" },
  { id: "phone", title: "Yeni telefon", subtitle: "Kendine ödül", icon: "smartphone" },
  { id: "car", title: "Araba", subtitle: "Özgürlüğe doğru", icon: "truck" },
  { id: "home", title: "Ev", subtitle: "Hayalindeki ev", icon: "home" }
] as const;

type GoalCard = (typeof goalCards)[number];

const sliderStep = 500;

export default function SavingsGoalScreen() {
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
  const [selectedGoal, setSelectedGoal] = useState(savingsGoal.selectedGoal || savingsGoal.title || "Acil durum");

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
            <Text style={styles.title}>Bu ay ne kadar biriktirmek istiyorsun?</Text>
            <Text style={styles.subtitle}>Gelir ve giderlerine göre planını birlikte oluşturalım.</Text>
          </View>

          <View style={styles.budgetCard}>
            <View style={styles.walletBadge}>
              <Feather name="briefcase" size={28} color={colors.primary} />
            </View>
            <View style={styles.budgetCopy}>
              <View style={styles.cardTitleRow}>
                <Text style={styles.cardLabel}>Sana kalan aylık bütçe</Text>
                <Feather name="info" size={16} color="#9CAA96" />
              </View>
              <Text style={styles.budgetAmount}>{formatCurrency(monthlyRemaining)}</Text>
              <Text style={styles.cardBody}>Gelir ve giderlerine göre bu ay kullanabileceğin toplam tutar.</Text>
            </View>
            <View style={styles.landscape}>
              <Feather name="sun" size={23} color="#F3B64B" />
              <View style={styles.hillBack} />
              <View style={styles.hillFront} />
            </View>
          </View>

          <View style={styles.sliderIntro}>
            <Text style={styles.sectionTitle}>Bu paranın ne kadarını biriktirmek istiyorsun?</Text>
            <Text style={styles.helperText}>Slider’ı hareket ettirerek birikim hedefini belirle.</Text>
          </View>

          <View style={styles.sliderCard}>
            <View style={styles.savingsHeader}>
              <Text style={styles.selectedAmount}>{formatCurrency(selectedSavings)}</Text>
              <View style={styles.percentBadge}>
                <Feather name="shield" size={15} color={colors.primary} />
                <Text style={styles.percentText}>%{percentage}’si</Text>
              </View>
            </View>
            <Slider max={monthlyRemaining} step={sliderStep} value={selectedSavings} onChange={updateSelectedSavings} />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabel}>{formatCurrency(0)}</Text>
              <Text style={styles.sliderLabel}>{formatCurrency(monthlyRemaining)}</Text>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoIcon}>
                <Feather name="trending-up" size={22} color="#E87516" />
              </View>
              <Text style={styles.infoText}>
                Bu hedefle ay sonunda yaklaşık <Text style={styles.infoHighlight}>{formatCurrency(selectedSavings)}</Text> biriktirebilirsin.
              </Text>
            </View>
          </View>

          <Text style={styles.goalTitle}>Birikim hedefini seç (opsiyonel)</Text>
          <FlatList
            data={goalCards}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.goalList}
            renderItem={({ item }) => (
              <GoalCardItem goal={item} selectedGoal={selectedGoal} onSelect={setSelectedGoal} />
            )}
          />

          <View style={styles.bottomInfo}>
            <View style={styles.bulb}>
              <Feather name="zap" size={20} color="#E2A23A" />
            </View>
            <Text style={styles.bottomInfoText}>Hedefini şimdi belirle, düzenli birikimle hayallerine daha hızlı ulaş!</Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable onPress={saveAndContinue} style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}>
            <View style={styles.ctaSpacer} />
            <Text style={styles.ctaText}>Planımı oluştur</Text>
            <Feather name="arrow-right" size={28} color={colors.white} style={styles.ctaIcon} />
          </Pressable>

          <View style={styles.securityRow}>
            <Feather name="lock" size={15} color="#9AA19D" />
            <Text style={styles.securityText}>Verilerin 256-bit SSL ile korunur ve güvenle saklanır.</Text>
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
    minHeight: 112,
    marginTop: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#DDE6D7",
    backgroundColor: "#F5F8EF",
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    overflow: "hidden",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 22,
    elevation: 3
  },
  walletBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#E4F0DE",
    borderWidth: 1,
    borderColor: "#CFDFC8",
    alignItems: "center",
    justifyContent: "center"
  },
  budgetCopy: {
    flex: 1,
    marginLeft: 12,
    zIndex: 2
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
    maxWidth: 210,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    color: "#747C78"
  },
  landscape: {
    position: "absolute",
    right: 14,
    bottom: 14,
    width: 92,
    height: 64,
    alignItems: "flex-end"
  },
  hillBack: {
    position: "absolute",
    right: 22,
    bottom: 20,
    width: 78,
    height: 34,
    borderTopLeftRadius: 80,
    borderTopRightRadius: 80,
    backgroundColor: "#DDEBD2",
    opacity: 0.7
  },
  hillFront: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 96,
    height: 40,
    borderTopLeftRadius: 90,
    borderTopRightRadius: 90,
    backgroundColor: "#CEE1C4"
  },
  sliderIntro: {
    marginTop: 14,
    gap: 2
  },
  sectionTitle: {
    fontSize: 17,
    lineHeight: 23,
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
    marginTop: 8,
    borderRadius: 20,
    backgroundColor: colors.white,
    padding: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 22,
    elevation: 4
  },
  savingsHeader: {
    alignItems: "center",
    justifyContent: "center"
  },
  selectedAmount: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "900",
    color: colors.primary
  },
  percentBadge: {
    position: "absolute",
    right: 0,
    top: 5,
    borderRadius: 22,
    backgroundColor: "#E7F0DD",
    paddingHorizontal: 9,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  percentText: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "900",
    color: colors.primary
  },
  slider: {
    width: "100%",
    height: 34,
    marginTop: 8,
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
    width: 40,
    height: 40,
    marginLeft: -20,
    borderRadius: 20,
    backgroundColor: colors.primary,
    borderWidth: 8,
    borderColor: "#F5EFE7",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4
  },
  sliderThumbText: {
    marginTop: -1,
    fontSize: 16,
    lineHeight: 18,
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
  infoCard: {
    marginTop: 8,
    borderRadius: 15,
    backgroundColor: "#FBF0E2",
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  infoIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center"
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "800",
    color: "#747C78"
  },
  infoHighlight: {
    color: "#E87516",
    fontWeight: "900"
  },
  goalTitle: {
    marginTop: 14,
    fontSize: 17,
    lineHeight: 23,
    fontWeight: "900",
    color: colors.primary
  },
  goalList: {
    gap: 9,
    paddingTop: 7,
    paddingBottom: 4
  },
  goalCard: {
    width: 92,
    minHeight: 116,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#EFE5D9",
    alignItems: "center",
    padding: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 3
  },
  goalCardSelected: {
    borderColor: colors.primary,
    backgroundColor: "#FCFFF8"
  },
  goalIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
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
    width: 19,
    height: 19,
    borderRadius: 10,
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
  bottomInfo: {
    marginTop: 12,
    borderRadius: 16,
    backgroundColor: "#FBF0DE",
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 14
  },
  bulb: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F7DC9C",
    alignItems: "center",
    justifyContent: "center"
  },
  bottomInfoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "800",
    color: "#5F6863"
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
