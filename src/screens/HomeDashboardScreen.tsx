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

const mascot = require("../../pgn/mascot-cutout.png");

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
    limit: "Limit",
    spent: "Harcanan",
    remaining: "Kalan",
    limitCaption: "Günlük limit",
    spentCaption: "Toplam harcanan",
    remainingCaption: "Kalan limit"
  },
  weekly: {
    main: "Bu hafta harcayabileceğin",
    limit: "Limit",
    spent: "Harcanan",
    remaining: "Kalan",
    limitCaption: "Haftalık limit",
    spentCaption: "Toplam harcanan",
    remainingCaption: "Kalan limit"
  },
  monthly: {
    main: "Bu ay harcayabileceğin",
    limit: "Limit",
    spent: "Harcanan",
    remaining: "Kalan",
    limitCaption: "Aylık limit",
    spentCaption: "Toplam harcanan",
    remainingCaption: "Kalan limit"
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

  // Custom states for Siri Voice Overlay and Toast
  const [isDirectVoiceActive, setIsDirectVoiceActive] = useState(false);
  const [draftTranscript, setDraftTranscript] = useState("");
  const [toastConfig, setToastConfig] = useState<{ visible: boolean; message: string; subtext?: string } | null>(null);

  const {
    isListening: isVoiceListening,
    transcript: voiceTranscript,
    error: voiceError,
    permissionStatus: voicePermissionStatus,
    startListening: startVoiceListening,
    stopListening: stopVoiceListening,
    setTranscript: setVoiceTranscript,
    parsedExpense: voiceParsedExpense
  } = useVoiceExpenseInput();

  const directVoiceWave = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const previousIsVoiceListening = useRef(false);

  useEffect(() => {
    if (isDirectVoiceActive) {
      startVoiceListening();
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true
      }).start();
    } else {
      stopVoiceListening();
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
      }).start();
    }
  }, [isDirectVoiceActive]);

  useEffect(() => {
    if (!isDirectVoiceActive || !isVoiceListening) {
      directVoiceWave.stopAnimation();
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(directVoiceWave, { toValue: 1, duration: 720, useNativeDriver: true }),
        Animated.timing(directVoiceWave, { toValue: 0, duration: 720, useNativeDriver: true })
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [isVoiceListening, isDirectVoiceActive, directVoiceWave]);

  useEffect(() => {
    if (isDirectVoiceActive && previousIsVoiceListening.current && !isVoiceListening) {
      // Dinleme bitti
      const numericAmount = voiceParsedExpense.amount;
      if (numericAmount && numericAmount > 0) {
        // Başarıyla çözümlendi
        const expense = {
          id: `voice-expense-${Date.now()}-${Math.random()}`,
          label: voiceParsedExpense.note.trim() || `${voiceParsedExpense.category.trim() || "Harcama"} harcaması`,
          subtitle: voiceParsedExpense.category.trim() || "Harcama",
          amount: numericAmount,
          period: "daily" as const,
          isFixed: false,
          category: voiceParsedExpense.category.trim() || "Harcama",
          note: voiceParsedExpense.note.trim(),
          occurredAt: new Date().toISOString()
        };
        addExpense(expense);

        setToastConfig({
          visible: true,
          message: `${formatCurrency(numericAmount)} Harcama Eklendi`,
          subtext: `${expense.label} başarıyla kaydedildi! 🎯`
        });
        setIsDirectVoiceActive(false);
      } else {
        // Çözümlenemedi, manuel ekranı aç ve yazıyı aktar
        if (voiceTranscript.trim()) {
          setDraftTranscript(voiceTranscript);
          setIsSheetVisible(true);
        }
        setIsDirectVoiceActive(false);
      }
    }
    previousIsVoiceListening.current = isVoiceListening;
  }, [isVoiceListening, isDirectVoiceActive, voiceParsedExpense, voiceTranscript]);

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
              tone="green"
            />
            <View style={styles.divider} />
            <SummaryMetric
              icon="pie-chart"
              title={copy.spent}
              amount={recentTotal}
              tone="orange"
            />
            <View style={styles.divider} />
            <SummaryMetric
              icon="shield"
              title={copy.remaining}
              amount={selectedPeriodRemaining}
              tone="green"
            />
          </View>

          <View style={styles.addExpenseButtonRow}>
            <Pressable style={({ pressed }) => [styles.mainAddButton, pressed && styles.pressed]} onPress={() => setIsSheetVisible(true)}>
              <LinearGradient colors={["#074A31", colors.primary, "#063B28"]} start={{ x: 0, y: 0.1 }} end={{ x: 1, y: 1 }} style={styles.addGradient}>
                <View style={styles.addIconWrap}>
                  <Feather name="plus" size={18} color={colors.primary} />
                </View>
                <Text style={styles.addText}>Harcama Ekle</Text>
              </LinearGradient>
            </Pressable>

            <Pressable style={({ pressed }) => [styles.mainVoiceButton, pressed && styles.pressed]} onPress={() => setIsDirectVoiceActive(true)}>
              <LinearGradient colors={["#DF7A12", "#C8640E"]} start={{ x: 0, y: 0.1 }} end={{ x: 1, y: 1 }} style={styles.voiceGradient}>
                <View style={styles.voiceIconWrap}>
                  <Feather name="mic" size={18} color="#DF7A12" />
                </View>
                <Text style={styles.voiceText}>Sesli Ekle</Text>
              </LinearGradient>
            </Pressable>
          </View>

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
          draftTranscript={draftTranscript}
          setDraftTranscript={setDraftTranscript}
        />

        {/* Siri Direct Voice Overlay */}
        {isDirectVoiceActive && (
          <Animated.View style={[styles.directVoiceOverlay, { opacity: overlayOpacity }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setIsDirectVoiceActive(false)} />
            <View style={styles.directVoiceContent}>
              <Text style={styles.directVoiceTitle}>Dinliyorum...</Text>
              <Text style={styles.directVoiceSubtitle}>"120 lira market" gibi konuşabilirsin.</Text>
              
              <View style={styles.directVoiceTranscriptBox}>
                <Text style={styles.directVoiceTranscriptText}>
                  {voiceTranscript || "Sizi dinliyorum..."}
                </Text>
              </View>

              <View style={styles.directVoiceWaveWrap}>
                {voiceWaveBars.map((item) => (
                  <Animated.View
                    key={item.id}
                    style={[
                      styles.directVoiceWaveBar,
                      {
                        transform: [
                          {
                            scaleY: directVoiceWave.interpolate({
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

              {voiceError ? <Text style={styles.directVoiceErrorText}>{voiceError}</Text> : null}

              <Pressable 
                style={({ pressed }) => [styles.directVoiceStopButton, pressed && styles.pressed]}
                onPress={() => stopVoiceListening()}
              >
                <Feather name="square" size={20} color={colors.white} />
              </Pressable>
            </View>
          </Animated.View>
        )}

        {/* Toast Capsule Banner */}
        {toastConfig?.visible && (
          <ToastBanner 
            message={toastConfig.message} 
            subtext={toastConfig.subtext} 
            onHide={() => setToastConfig(null)} 
          />
        )}
      </View>
    </SafeAreaView>
  );
}

function VoiceExpenseSheet({
  visible,
  onClose,
  onSave,
  draftTranscript,
  setDraftTranscript
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (expense: Expense) => void;
  draftTranscript: string;
  setDraftTranscript: (text: string) => void;
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
    if (visible && draftTranscript) {
      setTranscript(draftTranscript);
      setDraftTranscript("");
    }
  }, [visible, draftTranscript]);

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
          <Text style={styles.sheetTitle}>Harcama Ekle</Text>
          <Text style={styles.sheetSubtitle}>Harcamanı konuşarak veya yazarak hızlıca ekleyebilirsin.</Text>

          <View style={styles.speechBubbleContainer}>
            <TextInput
              value={transcript}
              onChangeText={setTranscript}
              placeholder={isListening ? "Dinleniyor..." : "Konuş veya yaz... (Örn: 150 lira market)"}
              placeholderTextColor="#9CA19E"
              style={styles.speechBubbleInput}
              multiline
            />
          </View>

          <View style={styles.micControlRow}>
            <Pressable style={({ pressed }) => [styles.sheetMicButton, isListening && styles.sheetMicButtonListening, pressed && styles.pressed]} onPress={handleMicPress}>
              <Feather name={isListening ? "square" : "mic"} size={22} color={colors.white} />
            </Pressable>
            <View style={styles.waveContainer}>
              {isListening ? (
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
              ) : (
                <Text style={styles.micHelperText}>
                  {error || (permissionStatus === "unsupported" ? "Expo Go'da konuşma yazarak eklenir." : "Mikrofona basarak konuşun.")}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.formGroup}>
            <View style={styles.formRow}>
              <Text style={styles.formLabel}>Tutar (₺)</Text>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholder="0,00"
                placeholderTextColor="#9CA19E"
                style={styles.formInputAmount}
              />
            </View>
            <View style={styles.formDivider} />
            <View style={styles.formRow}>
              <Text style={styles.formLabel}>Kategori</Text>
              <TextInput
                value={category}
                onChangeText={setCategory}
                placeholder="Belirtilmedi"
                placeholderTextColor="#9CA19E"
                style={styles.formInput}
              />
            </View>
            <View style={styles.formDivider} />
            <View style={styles.formRow}>
              <Text style={styles.formLabel}>Açıklama</Text>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="Harcama notu"
                placeholderTextColor="#9CA19E"
                style={styles.formInput}
              />
            </View>
          </View>

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

function ToastBanner({
  message,
  subtext,
  onHide
}: {
  message: string;
  subtext?: string;
  onHide: () => void;
}) {
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(slideAnim, { toValue: 50, duration: 400, useNativeDriver: true }),
      Animated.delay(2200),
      Animated.timing(slideAnim, { toValue: -100, duration: 300, useNativeDriver: true })
    ]).start(() => onHide());
  }, [slideAnim]);

  return (
    <Animated.View style={[styles.toastCapsule, { transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.toastCheckmark}>
        <Feather name="check" size={16} color={colors.white} />
      </View>
      <View style={styles.toastCopy}>
        <Text style={styles.toastMessage}>{message}</Text>
        {subtext && <Text style={styles.toastSubtext}>{subtext}</Text>}
      </View>
    </Animated.View>
  );
}

function SummaryMetric({
  icon,
  title,
  amount,
  tone
}: {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  amount: number;
  tone: "green" | "orange";
}) {
  const tint = tone === "green" ? colors.primary : "#DF7A12";
  return (
    <View style={styles.metric}>
      <View style={[styles.metricIcon, tone === "orange" && styles.metricIconOrange]}>
        <Feather name={icon} size={20} color={tint} />
      </View>
      <Text style={styles.metricTitle}>{title}</Text>
      <Text style={[styles.metricAmount, { color: tint }]} numberOfLines={1} adjustsFontSizeToFit>
        {formatCurrency(amount)}
      </Text>
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 94
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
    fontSize: 26,
    lineHeight: 32,
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
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "rgba(13,50,40,0.08)",
    backgroundColor: "rgba(255,254,250,0.86)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3
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
    marginTop: 16,
    height: 178,
    borderRadius: 28,
    backgroundColor: colors.primary,
    overflow: "hidden",
    paddingHorizontal: 18,
    paddingVertical: 14,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.22,
    shadowRadius: 30,
    elevation: 8
  },
  heroCopy: {
    width: "54%",
    zIndex: 2
  },
  goalBadge: {
    alignSelf: "flex-start",
    minHeight: 24,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.13)",
    backgroundColor: "rgba(255,255,255,0.10)",
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
  heroAmount: {
    marginTop: 2,
    fontSize: 34,
    lineHeight: 38,
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
    backgroundColor: "#E6D4A9"
  },
  heroPercentText: {
    marginTop: 5,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "900",
    color: "rgba(255,255,255,0.78)",
    textAlign: "left"
  },
  heroMascot: {
    position: "absolute",
    right: 14,
    top: 29,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 3
  },
  heroMascotImage: {
    width: "92%",
    height: "92%",
    borderRadius: 55
  },
  periodWrap: {
    marginTop: 14,
    minHeight: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(13,50,40,0.06)",
    backgroundColor: "#ECE7DD",
    flexDirection: "row",
    padding: 4,
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
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 3
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
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#EFE5D9",
    paddingHorizontal: 12,
    paddingVertical: 14,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
    flexDirection: "row",
    alignItems: "center"
  },
  metric: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: "#ECE5DA",
    marginHorizontal: 4
  },
  metricIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center"
  },
  metricIconOrange: {
    backgroundColor: "transparent"
  },
  metricTitle: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "800",
    color: "#747C78",
    textAlign: "center"
  },
  metricAmount: {
    marginTop: 2,
    fontSize: 16,
    fontWeight: "900",
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
  addExpenseButtonRow: {
    marginTop: 12,
    flexDirection: "row",
    gap: 12,
    height: 52
  },
  mainAddButton: {
    flex: 1,
    height: "100%",
    borderRadius: 26,
    overflow: "hidden",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 4
  },
  addGradient: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    height: "100%"
  },
  addIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center"
  },
  addText: {
    flex: 1,
    marginLeft: 14,
    fontSize: 16,
    fontWeight: "800",
    color: colors.white
  },
  mainVoiceButton: {
    flex: 1,
    height: "100%",
    borderRadius: 26,
    overflow: "hidden",
    shadowColor: "#DF7A12",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 4
  },
  voiceGradient: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    height: "100%"
  },
  voiceIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center"
  },
  voiceText: {
    flex: 1,
    marginLeft: 14,
    fontSize: 16,
    fontWeight: "800",
    color: colors.white
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
    borderRadius: 24,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "rgba(13,50,40,0.06)",
    paddingHorizontal: 14,
    paddingVertical: 5,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.06,
    shadowRadius: 26,
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
    backgroundColor: "#123A30",
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
  obsoleteVoiceText: {
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
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 22,
    shadowColor: "#111614",
    shadowOffset: { width: 0, height: -14 },
    shadowOpacity: 0.14,
    shadowRadius: 30,
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
  speechBubbleContainer: {
    marginTop: 16,
    borderRadius: 16,
    backgroundColor: "rgba(13,50,40,0.03)",
    borderWidth: 1,
    borderColor: "rgba(13,50,40,0.05)",
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 76
  },
  speechBubbleInput: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "500",
    color: "#111614",
    padding: 0,
    margin: 0,
    textAlignVertical: "top"
  },
  micControlRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  sheetMicButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3
  },
  sheetMicButtonListening: {
    backgroundColor: "#DF7A12",
    shadowColor: "#DF7A12"
  },
  waveContainer: {
    flex: 1,
    height: 48,
    justifyContent: "center"
  },
  waveWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5
  },
  waveBar: {
    width: 6,
    height: 24,
    borderRadius: 3,
    backgroundColor: colors.primary
  },
  micHelperText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#747C78"
  },
  formGroup: {
    marginTop: 16,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "rgba(13,50,40,0.06)",
    paddingVertical: 4,
    overflow: "hidden"
  },
  formRow: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#747C78"
  },
  formInput: {
    flex: 1,
    textAlign: "right",
    fontSize: 14,
    fontWeight: "600",
    color: "#111614",
    paddingVertical: 8,
    paddingLeft: 20
  },
  formInputAmount: {
    flex: 1,
    textAlign: "right",
    fontSize: 17,
    fontWeight: "700",
    color: colors.primary,
    paddingVertical: 8,
    paddingLeft: 20
  },
  formDivider: {
    height: 1,
    backgroundColor: "rgba(13,50,40,0.05)",
    marginHorizontal: 16
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
    minHeight: 68,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(13,50,40,0.06)",
    backgroundColor: "rgba(255,254,250,0.96)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.08,
    shadowRadius: 28,
    elevation: 7
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
  },
  directVoiceOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(13, 50, 40, 0.96)",
    zIndex: 99999,
    justifyContent: "center",
    alignItems: "center"
  },
  directVoiceContent: {
    width: "85%",
    alignItems: "center"
  },
  directVoiceTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: colors.white,
    textAlign: "center"
  },
  directVoiceSubtitle: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.6)",
    textAlign: "center"
  },
  directVoiceTranscriptBox: {
    marginTop: 32,
    minHeight: 120,
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    padding: 20,
    justifyContent: "center",
    alignItems: "center"
  },
  directVoiceTranscriptText: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.white,
    textAlign: "center",
    lineHeight: 26
  },
  directVoiceWaveWrap: {
    height: 48,
    marginTop: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8
  },
  directVoiceWaveBar: {
    width: 6,
    height: 36,
    borderRadius: 3,
    backgroundColor: "#DF7A12"
  },
  directVoiceErrorText: {
    marginTop: 16,
    fontSize: 14,
    fontWeight: "600",
    color: "#FF8A80",
    textAlign: "center"
  },
  directVoiceStopButton: {
    marginTop: 48,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#D32F2F",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#D32F2F",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5
  },
  toastCapsule: {
    position: "absolute",
    top: 0,
    left: 20,
    right: 20,
    zIndex: 9999,
    minHeight: 58,
    borderRadius: 29,
    backgroundColor: "#172E26",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 10
  },
  toastCheckmark: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#2E7D32",
    alignItems: "center",
    justifyContent: "center"
  },
  toastCopy: {
    flex: 1,
    marginLeft: 12
  },
  toastMessage: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.white
  },
  toastSubtext: {
    fontSize: 11,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.7)"
  }
});
