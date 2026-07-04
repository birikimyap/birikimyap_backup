import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useVoiceExpenseInput } from "@/hooks/useVoiceExpenseInput";
import { Expense, Period } from "@/models/finance";
import { useFinanceStore } from "@/store/financeStore";
import { colors, radius } from "@/theme";
import { formatCurrency, parseAmount } from "@/utils/currency";
import { getExpensesForPeriod } from "@/utils/finance";

const mascot = require("../../pgn/mascot-piggy-soft-cutout.png");

const voiceWaveBars = [
  { id: "voice-sheet-wave-1", value: 0 },
  { id: "voice-sheet-wave-2", value: 1 },
  { id: "voice-sheet-wave-3", value: 2 },
  { id: "voice-sheet-wave-4", value: 3 },
  { id: "voice-sheet-wave-5", value: 4 }
];

const periods: Array<{ value: Period; label: string; icon: keyof typeof Feather.glyphMap }> = [
  { value: "daily", label: "Bugün", icon: "calendar" },
  { value: "weekly", label: "Bu hafta", icon: "calendar" },
  { value: "monthly", label: "Bu ay", icon: "calendar" }
];

const periodCopy = {
  daily: {
    main: "Bugün harcayabileceğin",
    limit: "Günlük limitin",
    spent: "Bugünkü harcama toplamın",
    remaining: "Kalan limitin",
    limitCaption: "Günlük belirlenen limit",
    spentCaption: "Harcamaların toplamı",
    remainingCaption: "Limitinden kalan tutar"
  },
  weekly: {
    main: "Bu hafta harcayabileceğin",
    limit: "Haftalık limitin",
    spent: "Haftalık harcama toplamın",
    remaining: "Kalan limitin",
    limitCaption: "Haftalık belirlenen limit",
    spentCaption: "Harcamaların toplamı",
    remainingCaption: "Limitinden kalan tutar"
  },
  monthly: {
    main: "Bu ay harcayabileceğin",
    limit: "Aylık limitin",
    spent: "Aylık harcama toplamın",
    remaining: "Kalan limitin",
    limitCaption: "Aylık belirlenen limit",
    spentCaption: "Harcamaların toplamı",
    remainingCaption: "Limitinden kalan tutar"
  }
} satisfies Record<Period, Record<string, string>>;


export default function HomeDashboardScreen() {
  const selectedPeriod = useFinanceStore((state) => state.selectedPeriod);
  const expenses = useFinanceStore((state) => state.expenses);
  const savingsGoal = useFinanceStore((state) => state.savingsGoal);
  const plan = useFinanceStore((state) => state.plan);
  const setSelectedPeriod = useFinanceStore((state) => state.setSelectedPeriod);
  const addExpense = useFinanceStore((state) => state.addExpense);
  const [isSheetVisible, setIsSheetVisible] = useState(false);
  const [recentListHeight, setRecentListHeight] = useState(0);
  const [recentContentHeight, setRecentContentHeight] = useState(0);
  const recentScrollY = useRef(new Animated.Value(0)).current;
  const copy = periodCopy[selectedPeriod];
  const selectedPeriodLimit = plan.limits[selectedPeriod];
  const periodExpenses = useMemo(() => getExpensesForPeriod(expenses, selectedPeriod), [expenses, selectedPeriod]);
  const periodExpenseRows = useMemo(() => buildExpenseRows(periodExpenses), [periodExpenses]);
  const recentTotal = plan.selectedPeriodSpent;
  const selectedPeriodRemaining = plan.selectedPeriodRemaining;
  const goalTargetAmount = Math.max(savingsGoal.targetAmount || savingsGoal.monthlyContribution || 0, 0);
  const goalSavedAmount = Math.max(savingsGoal.currentAmount || 0, 0);
  const goalProgress = getProgress(goalSavedAmount, goalTargetAmount);
  const goalProgressPercent = goalTargetAmount > 0 ? Math.round(goalProgress * 100) : 0;
  const spentProgress = getProgress(recentTotal, selectedPeriodLimit);
  const remainingProgress = getProgress(selectedPeriodRemaining, selectedPeriodLimit);
  const isRecentListScrollable = recentContentHeight > recentListHeight + 1;
  const scrollableDistance = Math.max(recentContentHeight - recentListHeight, 1);
  const customScrollTrackTravel = Math.max(recentListHeight * 0.7 - 40, 0);
  const customScrollThumbTranslateY = recentScrollY.interpolate({
    inputRange: [0, scrollableDistance],
    outputRange: [0, customScrollTrackTravel],
    extrapolate: "clamp"
  });

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.screen}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.greetingWrap}>
              <Text style={styles.greeting}>Hoş geldin, Gürkan 👋</Text>
              <Text style={styles.subtitle}>Bugün finansal hedeflerine bir adım daha yaklaştın.</Text>
            </View>
            <Pressable style={({ pressed }) => [styles.notificationButton, pressed && styles.pressed]}>
              <Feather name="bell" size={25} color={colors.text} />
              <View style={styles.notificationDot} />
            </Pressable>
          </View>

          <View style={styles.heroCard}>
            <View style={styles.heroCopy}>
              <View style={styles.goalBadge}>
                <Text style={styles.goalBadgeIcon}>🎯</Text>
                <Text style={styles.goalBadgeText}>BİRİKİM HEDEFİN</Text>
              </View>
              <Text style={styles.heroSubtitle}>Hedefin</Text>
              <Text style={styles.heroAmount}>{formatCurrency(goalTargetAmount)}</Text>
              <View style={styles.savedAmountBlock}>
                <Text style={styles.savedAmountTitle}>Bugüne kadar biriktirdiğin</Text>
                <Text style={styles.savedAmountValue}>{formatCurrency(goalSavedAmount)}</Text>
              </View>
              <View style={styles.heroProgressTrack}>
                <View style={[styles.heroProgressFill, { width: `${goalProgress * 100}%` }]} />
              </View>
              <Text style={styles.heroPercentText}>Hedefin %{goalProgressPercent}’i tamamlandı</Text>
            </View>
            <View style={styles.heroMascot}>
              <Image source={mascot} style={styles.heroMascotImage} resizeMode="contain" />
            </View>
          </View>

          <View style={styles.summaryCard}>
            <SummaryMetric
              icon="credit-card"
              title={copy.limit}
              amount={selectedPeriodLimit}
              caption={copy.limitCaption}
              progress={1}
              tone="green"
            />
            <View style={styles.divider} />
            <SummaryMetric
              icon="pie-chart"
              title={copy.spent}
              amount={recentTotal}
              caption={copy.spentCaption}
              progress={spentProgress}
              tone="orange"
            />
            <View style={styles.divider} />
            <SummaryMetric
              icon="credit-card"
              title={copy.remaining}
              amount={selectedPeriodRemaining}
              caption={copy.remainingCaption}
              progress={remainingProgress}
              tone="green"
            />
          </View>

          <Pressable style={({ pressed }) => [styles.addExpenseButton, pressed && styles.pressed]} onPress={() => setIsSheetVisible(true)}>
            <LinearGradient colors={["#074A31", colors.primary, "#063B28"]} start={{ x: 0, y: 0.1 }} end={{ x: 1, y: 1 }} style={styles.addExpenseGradient}>
              <View style={styles.addExpenseIconWrap}>
                <Feather name="plus" size={22} color={colors.primary} />
              </View>
              <Text style={styles.addExpenseText}>Harcama Ekle</Text>
              <View style={styles.addExpenseDivider} />
              <Feather name="mic" size={28} color={colors.white} />
            </LinearGradient>
          </Pressable>

          <View style={styles.periodWrap}>
            {periods.map((period) => {
              const isSelected = selectedPeriod === period.value;
              return (
                <Pressable
                  key={period.value}
                  onPress={() => setSelectedPeriod(period.value)}
                  style={({ pressed }) => [styles.periodItem, isSelected && styles.periodItemSelected, pressed && styles.pressed]}
                >
                  <Feather name={period.icon} size={20} color={isSelected ? colors.white : "#111614"} />
                  <Text style={[styles.periodText, isSelected && styles.periodTextSelected]}>{period.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.recentSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Son harcamalar</Text>
              <Text style={styles.sectionTotal}>Toplam miktar: {formatCurrency(recentTotal)}</Text>
            </View>

            <View style={styles.expenseCard}>
              <FlatList
                data={periodExpenseRows}
                keyExtractor={(item) => item.renderId}
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={false}
                onLayout={(event) => setRecentListHeight(event.nativeEvent.layout.height)}
                onContentSizeChange={(_, height) => setRecentContentHeight(height)}
                onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: recentScrollY } } }], { useNativeDriver: false })}
                scrollEventThrottle={16}
                contentContainerStyle={periodExpenseRows.length === 0 ? styles.emptyExpenseListContent : styles.expenseListContent}
                ListEmptyComponent={
                <View style={styles.emptyExpenses}>
                  <Feather name="inbox" size={28} color="#8C9490" />
                  <Text style={styles.emptyExpensesText}>Henüz harcama eklemedin.</Text>
                  <Text style={styles.emptyExpensesSubtext}>Harcamalarını ekleyerek takibini kolayca yapabilirsin.</Text>
                </View>
              }
              renderItem={({ item, index }) => (
                <View>
                  <View style={styles.expenseRow}>
                    <View style={styles.expenseIcon}>
                      <Text style={styles.expenseBadge}>{getExpenseBadge(item.expense)}</Text>
                    </View>
                    <View style={styles.expenseCopy}>
                      <Text style={styles.expenseTitle}>{item.expense.label}</Text>
                      <Text style={styles.expenseCategory}>{item.expense.category || item.expense.subtitle || "Harcama"}</Text>
                    </View>
                    <View style={styles.expenseMeta}>
                      <Text style={styles.expenseAmount}>{formatCurrency(item.expense.amount)}</Text>
                      <Text style={styles.expenseDate}>{formatExpenseDate(item.expense.occurredAt)}</Text>
                    </View>
                    <Feather name="chevron-right" size={24} color="#9AA19D" />
                  </View>
                  {index < periodExpenseRows.length - 1 && <View style={styles.expenseDivider} />}
                </View>
                )}
              />
              {isRecentListScrollable ? (
                <View pointerEvents="none" style={styles.customScrollTrack}>
                  <Animated.View style={[styles.customScrollThumb, { transform: [{ translateY: customScrollThumbTranslateY }] }]} />
                </View>
              ) : null}
            </View>
          </View>

        </View>

        <View style={styles.tabBar}>
          <TabItem icon="home" label="Ana sayfa" active />
          <TabItem icon="pie-chart" label="Analiz" />
          <TabItem icon="user" label="Profil" />
        </View>
        <VoiceExpenseSheet
          visible={isSheetVisible}
          onClose={() => setIsSheetVisible(false)}
          onSave={(expense) => {
            addExpense(expense);
            setIsSheetVisible(false);
          }}
        />
      </View>
    </SafeAreaView>
  );
}

function VoiceExpenseSheet({
  visible,
  onClose,
  onSave
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (expense: Expense) => void;
}) {
  const [spokenText, setSpokenText] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const wave = useRef(new Animated.Value(0)).current;
  const {
    isListening,
    transcript,
    error,
    permissionStatus,
    startListening,
    stopListening,
    setTranscript,
    parsedExpense
  } = useVoiceExpenseInput();

  useEffect(() => {
    setSpokenText(transcript);
  }, [transcript]);

  useEffect(() => {
    if (!transcript.trim()) {
      return;
    }

    setAmount(parsedExpense.amount ? String(parsedExpense.amount) : "");
    setCategory(parsedExpense.category);
    setNote(parsedExpense.note);
  }, [parsedExpense.amount, parsedExpense.category, parsedExpense.note, transcript]);

  useEffect(() => {
    if (!visible || !isListening) {
      wave.stopAnimation();
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(wave, { toValue: 1, duration: 720, useNativeDriver: true }),
        Animated.timing(wave, { toValue: 0, duration: 720, useNativeDriver: true })
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [isListening, visible, wave]);

  useEffect(() => {
    if (!visible && isListening) {
      stopListening();
    }
  }, [isListening, stopListening, visible]);

  function handleMicPress() {
    if (isListening) {
      stopListening();
      return;
    }

    startListening();
  }

  function fillTestText() {
    const transcript = "120 lira kahve harcadım";
    console.log("[voice-expense] transcript result", { transcript, source: "test-button" });
    setTranscript(transcript);
  }

  function saveExpense() {
    const numericAmount = parseAmount(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return;
    }

    const expense = {
      id: `voice-expense-${Date.now()}-${Math.random()}`,
      label: note.trim() || `${category.trim() || "Harcama"} harcaması`,
      subtitle: category.trim() || "Harcama",
      amount: numericAmount,
      period: "daily" as const,
      isFixed: false,
      category: category.trim() || "Harcama",
      note: note.trim(),
      occurredAt: new Date().toISOString()
    };

    console.log("[voice-expense] save result", expense);
    onSave(expense);
    setSpokenText("");
    setAmount("");
    setCategory("");
    setNote("");
    setTranscript("");
  }

  function closeSheet() {
    if (isListening) {
      stopListening();
    }

    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={closeSheet}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.sheetKeyboardView}>
        <Pressable style={styles.sheetBackdrop} onPress={closeSheet} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Sesli harcama ekle</Text>
          <Text style={styles.sheetSubtitle}>Harcamanı söyle, biz otomatik anlayalım.</Text>

          <View style={styles.liveTextBox}>
            <Text style={styles.liveTextLabel}>Canlı metin</Text>
            <Text style={styles.liveText}>{spokenText || (isListening ? "Dinleniyorum..." : error || "Mikrofona dokun ve harcamanı söyle.")}</Text>
          </View>

          <TextInput
            value={transcript}
            onChangeText={setTranscript}
            placeholder="Transcript yaz veya mikrofona konuş"
            placeholderTextColor="#929997"
            style={styles.transcriptInput}
            multiline
          />

          <View style={styles.waveWrap}>
            {voiceWaveBars.map((item) => (
              <Animated.View
                key={item.id}
                style={[
                  styles.waveBar,
                  {
                    transform: [
                      {
                        scaleY: wave.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.45 + item.value * 0.08, 1.15 - item.value * 0.06]
                        })
                      }
                    ]
                  }
                ]}
              />
            ))}
          </View>

          <Pressable style={({ pressed }) => [styles.sheetMicButton, isListening && styles.sheetMicButtonListening, pressed && styles.pressed]} onPress={handleMicPress}>
            <Feather name="mic" size={38} color={colors.white} />
          </Pressable>

          {permissionStatus === "unsupported" ? (
            <Text style={styles.speechWarning}>Expo Go’da gerçek ses tanıma desteklenmiyor. Development build gerekir.</Text>
          ) : null}

          <Pressable style={({ pressed }) => [styles.testSpeechButton, pressed && styles.pressed]} onPress={fillTestText}>
            <Text style={styles.testSpeechButtonText}>Test metni doldur</Text>
          </Pressable>

          <View style={styles.parsedGrid}>
            <ParsedField label="Tutar" value={amount ? formatCurrency(parseAmount(amount)) : formatCurrency(0)} />
            <ParsedField label="Kategori" value={category || "-"} />
            <ParsedField label="Not" value={note || "-"} />
          </View>

          <View style={styles.debugBox}>
            <Text style={styles.debugText}>permission: {permissionStatus}</Text>
            <Text style={styles.debugText}>listening: {isListening ? "true" : "false"}</Text>
            <Text style={styles.debugText}>transcript: {transcript || "-"}</Text>
            <Text style={styles.debugText}>
              parser: {parsedExpense.amount} / {parsedExpense.category || "-"} / {parsedExpense.note || "-"}
            </Text>
            <Text style={styles.debugText}>error: {error || "-"}</Text>
          </View>

          <TextInput
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="Tutar"
            placeholderTextColor="#929997"
            style={styles.sheetInput}
          />
          <TextInput
            value={category}
            onChangeText={setCategory}
            placeholder="Kategori"
            placeholderTextColor="#929997"
            style={styles.sheetInput}
          />
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Not"
            placeholderTextColor="#929997"
            style={styles.sheetInput}
          />

          <View style={styles.sheetActions}>
            <Pressable style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]} onPress={closeSheet}>
              <Text style={styles.cancelButtonText}>İptal</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]} onPress={saveExpense}>
              <Text style={styles.saveButtonText}>Kaydet</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function ParsedField({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.parsedField}>
      <Text style={styles.parsedLabel}>{label}</Text>
      <Text style={styles.parsedValue}>{value}</Text>
    </View>
  );
}

function SummaryMetric({
  icon,
  title,
  amount,
  caption,
  progress,
  tone
}: {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  amount: number;
  caption: string;
  progress: number;
  tone: "green" | "orange";
}) {
  const tint = tone === "green" ? colors.primary : "#DF7A12";
  return (
    <View style={styles.metric}>
      <View style={[styles.metricIcon, tone === "orange" && styles.metricIconOrange]}>
      <Feather name={icon} size={24} color={tint} />
      </View>
      <Text style={styles.metricTitle}>{title}</Text>
      <Text style={[styles.metricAmount, { color: tint }]}>{formatCurrency(amount)}</Text>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: tint }]} />
      </View>
    </View>
  );
}

function TabItem({ icon, label, active = false }: { icon: keyof typeof Feather.glyphMap; label: string; active?: boolean }) {
  return (
    <Pressable style={styles.tabItem}>
      <Feather name={icon} size={24} color={active ? colors.primary : "#929997"} />
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
    </Pressable>
  );
}

function getProgress(value: number, limit: number) {
  if (limit <= 0) {
    return 0;
  }

  return Math.min(Math.max(value / limit, 0), 1);
}

function buildExpenseRows(expenses: Expense[]) {
  const seenIds = new Map<string, number>();

  return expenses.map((expense) => {
    const baseId = expense.id || `expense-${expense.occurredAt || expense.amount}`;
    const seenCount = seenIds.get(baseId) || 0;
    seenIds.set(baseId, seenCount + 1);

    return {
      expense,
      renderId: seenCount === 0 ? baseId : `${baseId}-${seenCount}`
    };
  });
}

function isExpenseInPeriod(expense: Expense, period: Period) {
  if (!expense.occurredAt) {
    return false;
  }

  const occurredAt = new Date(expense.occurredAt);
  const now = new Date();

  if (Number.isNaN(occurredAt.getTime())) {
    return false;
  }

  if (period === "daily") {
    return occurredAt.toDateString() === now.toDateString();
  }

  if (period === "weekly") {
    return getWeekStart(occurredAt).getTime() === getWeekStart(now).getTime();
  }

  return occurredAt.getFullYear() === now.getFullYear() && occurredAt.getMonth() === now.getMonth();
}

function getWeekStart(date: Date) {
  const weekStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = (weekStart.getDay() + 6) % 7;
  weekStart.setDate(weekStart.getDate() - day);
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
}

function getExpenseBadge(expense: Expense) {
  return (expense.category || expense.label || "H").slice(0, 1).toUpperCase();
}

function formatExpenseDate(value?: string) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("tr-TR", { day: "2-digit", month: "short" });
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
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 92
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14
  },
  greetingWrap: {
    flex: 1
  },
  greeting: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "900",
    color: colors.primary
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "700",
    color: "#747C78"
  },
  notificationButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#F0ECE4",
    alignItems: "center",
    justifyContent: "center"
  },
  notificationDot: {
    position: "absolute",
    right: 11,
    top: 8,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#F04B24"
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }]
  },
  heroCard: {
    marginTop: 14,
    height: 170,
    borderRadius: 24,
    backgroundColor: colors.primary,
    overflow: "hidden",
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 7
  },
  heroCopy: {
    width: "54%",
    zIndex: 2
  },
  goalBadge: {
    alignSelf: "flex-start",
    minHeight: 24,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.14)",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 11
  },
  goalBadgeIcon: {
    fontSize: 13,
    lineHeight: 17
  },
  goalBadgeText: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "900",
    color: "rgba(255,255,255,0.88)"
  },
  heroTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  heroLabel: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "900",
    color: colors.white
  },
  heroAmount: {
    marginTop: 2,
    fontSize: 32,
    lineHeight: 36,
    fontWeight: "900",
    color: colors.white
  },
  heroSubtitle: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "800",
    color: "rgba(255,255,255,0.72)"
  },
  savedAmountBlock: {
    marginTop: 3
  },
  savedAmountTitle: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "800",
    color: "rgba(255,255,255,0.68)"
  },
  savedAmountValue: {
    marginTop: 1,
    fontSize: 17,
    lineHeight: 20,
    fontWeight: "900",
    color: colors.white
  },
  heroProgressTrack: {
    marginTop: 5,
    width: "100%",
    height: 7,
    borderRadius: 9,
    backgroundColor: "rgba(255,255,255,0.2)",
    overflow: "hidden"
  },
  heroProgressFill: {
    height: "100%",
    borderRadius: 9,
    backgroundColor: "#DDEBDE"
  },
  heroPercentText: {
    marginTop: 5,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "900",
    color: "rgba(255,255,255,0.78)",
    textAlign: "left"
  },
  statusPill: {
    alignSelf: "flex-start",
    marginTop: 8,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.13)",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 11,
    paddingVertical: 7
  },
  statusText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "900",
    color: colors.white
  },
  heroMascot: {
    position: "absolute",
    right: 4,
    bottom: 18,
    width: 120,
    height: 120,
    shadowColor: "#0A2015",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 4
  },
  heroMascotImage: {
    width: "100%",
    height: "100%"
  },
  periodWrap: {
    marginTop: 14,
    minHeight: 42,
    borderRadius: 21,
    backgroundColor: "#F1ECE4",
    flexDirection: "row",
    padding: 3,
    gap: 3
  },
  periodItem: {
    flex: 1,
    minHeight: 36,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8
  },
  periodItemSelected: {
    backgroundColor: colors.primary
  },
  periodText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "900",
    color: "#111614"
  },
  periodTextSelected: {
    color: colors.white
  },
  summaryCard: {
    marginTop: 12,
    minHeight: 100,
    borderRadius: 22,
    backgroundColor: colors.white,
    paddingHorizontal: 9,
    paddingVertical: 14,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 22,
    elevation: 4,
    flexDirection: "row",
    alignItems: "stretch",
    flexWrap: "wrap"
  },
  metric: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 5
  },
  divider: {
    width: 1,
    backgroundColor: "#EEE7DD",
    marginVertical: 4
  },
  metricIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center"
  },
  metricIconOrange: {
    backgroundColor: "transparent"
  },
  metricTitle: {
    marginTop: 5,
    minHeight: 30,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "900",
    color: "#111614",
    textAlign: "center"
  },
  metricAmount: {
    marginTop: 3,
    fontSize: 20,
    lineHeight: 25,
    fontWeight: "900"
  },
  progressTrack: {
    marginTop: 6,
    width: "100%",
    height: 5,
    borderRadius: 8,
    backgroundColor: "#DDE2DE",
    overflow: "hidden"
  },
  progressFill: {
    height: "100%",
    borderRadius: 8
  },
  metricCaption: {
    marginTop: 4,
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "700",
    color: "#747C78",
    textAlign: "center"
  },
  tipRow: {
    width: "100%",
    marginTop: 7,
    borderRadius: 12,
    backgroundColor: "#F6F8F2",
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  tipText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "800",
    color: "#111614"
  },
  addExpenseButton: {
    marginTop: 12,
    height: 48,
    borderRadius: 22,
    overflow: "hidden",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 4
  },
  addExpenseGradient: {
    height: 48,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  addExpenseIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center"
  },
  addExpenseText: {
    flex: 1,
    marginLeft: 18,
    fontSize: 19,
    lineHeight: 24,
    fontWeight: "900",
    color: colors.white,
    textAlign: "center"
  },
  addExpenseDivider: {
    width: 1,
    height: 26,
    marginLeft: 18,
    marginRight: 16,
    backgroundColor: "rgba(255,255,255,0.5)"
  },
  recentSection: {
    flex: 1,
    minHeight: 0
  },
  sectionHeader: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8
  },
  sectionTitle: {
    flex: 1,
    fontSize: 20,
    lineHeight: 27,
    fontWeight: "900",
    color: colors.primary
  },
  sectionTotal: {
    flexShrink: 0,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "900",
    color: "#747C78",
    textAlign: "right"
  },
  expenseCard: {
    flex: 1,
    minHeight: 0,
    marginTop: 10,
    borderRadius: 22,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    paddingVertical: 5,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.07,
    shadowRadius: 22,
    elevation: 4,
    overflow: "hidden"
  },
  expenseListContent: {
    paddingBottom: 2,
    paddingRight: 12
  },
  emptyExpenseListContent: {
    flexGrow: 1
  },
  customScrollTrack: {
    position: "absolute",
    right: 8,
    top: "15%",
    width: 3,
    height: "70%",
    borderRadius: 999,
    backgroundColor: "#E1E5DF"
  },
  customScrollThumb: {
    width: 3,
    height: 40,
    borderRadius: 999,
    backgroundColor: "#064D35"
  },
  expenseRow: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center"
  },
  expenseIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center"
  },
  marketIcon: {
    backgroundColor: "#F5EFE8"
  },
  rideIcon: {
    backgroundColor: "#111111"
  },
  expenseBadge: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: "900",
    color: colors.white
  },
  expenseCopy: {
    flex: 1,
    marginLeft: 11
  },
  expenseTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "900",
    color: "#111614"
  },
  expenseCategory: {
    marginTop: 2,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "700",
    color: "#747C78"
  },
  expenseMeta: {
    alignItems: "flex-end",
    marginRight: 5
  },
  expenseAmount: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "900",
    color: "#111614"
  },
  expenseDate: {
    marginTop: 2,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "700",
    color: "#747C78"
  },
  expenseDivider: {
    height: 1,
    backgroundColor: "#EEE7DD",
    marginLeft: 54
  },
  emptyExpenses: {
    flex: 1,
    minHeight: 210,
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    paddingHorizontal: 24
  },
  emptyExpensesText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "900",
    color: "#747C78",
    textAlign: "center"
  },
  emptyExpensesSubtext: {
    maxWidth: 260,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "700",
    color: "#747C78",
    textAlign: "center"
  },
  voiceCard: {
    marginTop: 14,
    minHeight: 88,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#DCE4D8",
    backgroundColor: "#F7F9F2",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14
  },
  voiceExample: {
    flex: 1
  },
  voiceMuted: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "800",
    color: "#747C78"
  },
  voiceExampleText: {
    marginTop: 3,
    maxWidth: 104,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "900",
    color: "#111614"
  },
  micButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.primary,
    borderWidth: 12,
    borderColor: "#DDEBDE",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 8
  },
  voiceText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "900",
    color: "#111614"
  },
  sheetKeyboardView: {
    flex: 1,
    justifyContent: "flex-end"
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(17, 22, 20, 0.38)"
  },
  sheet: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: "#FBF7EF",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 22,
    shadowColor: "#111614",
    shadowOffset: { width: 0, height: -14 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 12
  },
  sheetHandle: {
    alignSelf: "center",
    width: 46,
    height: 5,
    borderRadius: 5,
    backgroundColor: "#D8D0C3",
    marginBottom: 14
  },
  sheetTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "900",
    color: colors.primary
  },
  sheetSubtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "800",
    color: "#747C78"
  },
  liveTextBox: {
    marginTop: 16,
    borderRadius: 18,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#EEE7DD"
  },
  liveTextLabel: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "900",
    color: "#747C78"
  },
  liveText: {
    marginTop: 4,
    fontSize: 17,
    lineHeight: 23,
    fontWeight: "900",
    color: "#111614"
  },
  transcriptInput: {
    marginTop: 10,
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#E5DED3",
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "800",
    color: "#111614"
  },
  waveWrap: {
    height: 38,
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7
  },
  waveBar: {
    width: 8,
    height: 30,
    borderRadius: 8,
    backgroundColor: colors.primary
  },
  sheetMicButton: {
    alignSelf: "center",
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: colors.primary,
    borderWidth: 12,
    borderColor: "#DDEBDE",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8
  },
  sheetMicButtonListening: {
    backgroundColor: "#DF7A12"
  },
  speechWarning: {
    marginTop: 10,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "800",
    color: "#B24A2F",
    textAlign: "center"
  },
  testSpeechButton: {
    alignSelf: "center",
    marginTop: 10,
    minHeight: 38,
    borderRadius: 16,
    backgroundColor: "#EFE8DD",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16
  },
  testSpeechButtonText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "900",
    color: "#111614"
  },
  parsedGrid: {
    marginTop: 16,
    flexDirection: "row",
    gap: 8
  },
  parsedField: {
    flex: 1,
    minHeight: 64,
    borderRadius: 16,
    backgroundColor: "#F1ECE4",
    paddingHorizontal: 10,
    paddingVertical: 9
  },
  parsedLabel: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "900",
    color: "#747C78"
  },
  parsedValue: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "900",
    color: "#111614"
  },
  debugBox: {
    marginTop: 10,
    borderRadius: 14,
    backgroundColor: "#F6F1E8",
    borderWidth: 1,
    borderColor: "#E5DED3",
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  debugText: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "800",
    color: "#747C78"
  },
  sheetInput: {
    marginTop: 10,
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#E5DED3",
    paddingHorizontal: 14,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "800",
    color: "#111614"
  },
  sheetActions: {
    marginTop: 14,
    flexDirection: "row",
    gap: 10
  },
  cancelButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 18,
    backgroundColor: "#EFE8DD",
    alignItems: "center",
    justifyContent: "center"
  },
  cancelButtonText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "900",
    color: "#111614"
  },
  saveButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center"
  },
  saveButtonText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "900",
    color: colors.white
  },
  tabBar: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 10,
    minHeight: 66,
    borderRadius: 28,
    backgroundColor: colors.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 22,
    elevation: 6
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4
  },
  tabLabel: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "800",
    color: "#8C9490"
  },
  tabLabelActive: {
    color: colors.primary
  }
});

