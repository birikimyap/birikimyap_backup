import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useRef, useState } from "react";
import { router } from "expo-router";
import {
  Animated,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  Vibration,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useVoiceExpenseInput } from "@/hooks/useVoiceExpenseInput";
import { Expense, Period } from "@/models/finance";
import { useFinanceStore } from "@/store/financeStore";
import { parseTurkishExpense } from "@/utils/voiceExpense";
import { colors, radius, lightColors, darkColors } from "@/theme";
import { formatCurrency, parseAmount } from "@/utils/currency";
import { getExpensesForPeriod } from "@/utils/finance";
import { translations } from "@/utils/translations";

const mascotTR = require("../../pgn/mascot-cutout.png");
const mascotEN = require("../../pgn/mascot-cutout-dollar.png");

const voiceWaveBars = [
  { id: "voice-sheet-wave-1", value: 0 },
  { id: "voice-sheet-wave-2", value: 1 },
  { id: "voice-sheet-wave-3", value: 2 },
  { id: "voice-sheet-wave-4", value: 3 },
  { id: "voice-sheet-wave-5", value: 4 }
];

// Static configurations removed to enable dynamic translations


export default function HomeDashboardScreen() {
  const selectedPeriod = useFinanceStore((state) => state.selectedPeriod);
  const expenses = useFinanceStore((state) => state.expenses);
  const savingsGoal = useFinanceStore((state) => state.savingsGoal);
  const plan = useFinanceStore((state) => state.plan);
  const setSelectedPeriod = useFinanceStore((state) => state.setSelectedPeriod);
  const addExpense = useFinanceStore((state) => state.addExpense);
  const categoryLimits = useFinanceStore((state) => state.categoryLimits) || {};
  const setCategoryLimit = useFinanceStore((state) => state.setCategoryLimit);
  const setSavingsGoal = useFinanceStore((state) => state.setSavingsGoal);
  const setIncomes = useFinanceStore((state) => state.setIncomes);
  const setExpenses = useFinanceStore((state) => state.setExpenses);
  const totalIncome = useFinanceStore((state) => state.getTotalIncome());
  const totalFixedExpenses = useFinanceStore((state) => state.getTotalFixedExpenses());
  const setIsDarkMode = useFinanceStore((state) => state.setIsDarkMode);
  const setIsHapticsEnabled = useFinanceStore((state) => state.setIsHapticsEnabled);
  const language = useFinanceStore((state) => state.language);
  const mascot = language === "tr" ? mascotTR : mascotEN;
  const setLanguage = useFinanceStore((state) => state.setLanguage);
  const currency = useFinanceStore((state) => state.currency);
  const setCurrency = useFinanceStore((state) => state.setCurrency);

  const t = (key: keyof typeof translations["tr"], variables?: Record<string, string>): string => {
    let str: string = translations[language][key] || key;
    if (variables) {
      Object.entries(variables).forEach(([k, v]) => {
        str = str.replace(`{{${k}}}`, v);
      });
    }
    return str;
  };

  const periods: Array<{ value: Period; label: string; icon: keyof typeof Feather.glyphMap }> = [
    { value: "daily", label: language === "tr" ? "Bugün" : "Today", icon: "calendar" },
    { value: "weekly", label: language === "tr" ? "Bu hafta" : "This week", icon: "calendar" },
    { value: "monthly", label: language === "tr" ? "Bu ay" : "This month", icon: "calendar" }
  ];

  const periodCopy = {
    daily: {
      main: language === "tr" ? "Bugün harcayabileceğin" : "Spendable today",
      limit: language === "tr" ? "Limit" : "Limit",
      spent: language === "tr" ? "Harcanan" : "Spent",
      remaining: language === "tr" ? "Kalan" : "Remaining",
      limitCaption: language === "tr" ? "Günlük limit" : "Daily limit",
      spentCaption: language === "tr" ? "Toplam harcanan" : "Total spent",
      remainingCaption: language === "tr" ? "Kalan limit" : "Remaining limit"
    },
    weekly: {
      main: language === "tr" ? "Bu hafta harcayabileceğin" : "Spendable this week",
      limit: language === "tr" ? "Limit" : "Limit",
      spent: language === "tr" ? "Harcanan" : "Spent",
      remaining: language === "tr" ? "Kalan" : "Remaining",
      limitCaption: language === "tr" ? "Haftalık limit" : "Weekly limit",
      spentCaption: language === "tr" ? "Toplam harcanan" : "Total spent",
      remainingCaption: language === "tr" ? "Kalan limit" : "Remaining limit"
    },
    monthly: {
      main: language === "tr" ? "Bu ay harcayabileceğin" : "Spendable this month",
      limit: language === "tr" ? "Limit" : "Limit",
      spent: language === "tr" ? "Harcanan" : "Spent",
      remaining: language === "tr" ? "Kalan" : "Remaining",
      limitCaption: language === "tr" ? "Aylık limit" : "Monthly limit",
      spentCaption: language === "tr" ? "Toplam harcanan" : "Total spent",
      remainingCaption: language === "tr" ? "Kalan limit" : "Remaining limit"
    }
  };
  
  const [isSheetVisible, setIsSheetVisible] = useState(false);
  const [recentListHeight, setRecentListHeight] = useState(0);
  const [recentContentHeight, setRecentContentHeight] = useState(0);
  const recentScrollY = useRef(new Animated.Value(0)).current;

  // Analysis period & modal states
  const [analysisPeriod, setAnalysisPeriod] = useState<"weekly" | "monthly">("weekly");
  const [isGoalModalVisible, setIsGoalModalVisible] = useState(false);
  const [isCategoryLimitsModalVisible, setIsCategoryLimitsModalVisible] = useState(false);
  const [isAboutModalVisible, setIsAboutModalVisible] = useState(false);
  const [isFaqModalVisible, setIsFaqModalVisible] = useState(false);
  const [isResetConfirmVisible, setIsResetConfirmVisible] = useState(false);
  const [tempGoalTitle, setTempGoalTitle] = useState("");
  const [tempGoalTarget, setTempGoalTarget] = useState("");
  const [tempGoalSaved, setTempGoalSaved] = useState("");
  const [isNotificationsVisible, setIsNotificationsVisible] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(true);

  // Tab state
  const [currentTab, setCurrentTab] = useState<"home" | "analysis" | "profile">("home");

  // Haptics & Dark Mode
  const isDarkMode = useFinanceStore((state) => state.isDarkMode);
  const isHapticsEnabled = useFinanceStore((state) => state.isHapticsEnabled);
  const themeColors = isDarkMode ? darkColors : lightColors;

  const triggerHaptic = () => {
    if (isHapticsEnabled) {
      Vibration.vibrate(10);
    }
  };

  // Custom states for Siri Voice Overlay and Toast
  const [isDirectVoiceActive, setIsDirectVoiceActive] = useState(false);
  const [draftTranscript, setDraftTranscript] = useState("");
  const [toastConfig, setToastConfig] = useState<{ visible: boolean; message: string; subtext?: string; type?: "success" | "warning" } | null>(null);
  
  // Analysis Chart filter state
  const [selectedChartLabel, setSelectedChartLabel] = useState<string | null>(null);

  // Listen for incoming deep links for Siri / Kestirmeler (Shortcuts) integration
  useEffect(() => {
    // Check if app was opened via deep link initially
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    // Listen to incoming deep links while app is open/backgrounded
    const subscription = Linking.addEventListener("url", (event) => {
      handleDeepLink(event.url);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  function handleDeepLink(url: string) {
    try {
      console.log("[deep-link] incoming url:", url);
      if (!url.startsWith("birikimyap://")) {
        return;
      }
      
      const routePath = url.replace("birikimyap://", "");
      const [path, queryString] = routePath.split("?");
      
      if (path === "voice") {
        let textParam = "";
        if (queryString) {
          const params = queryString.split("&");
          for (const param of params) {
            const [key, value] = param.split("=");
            if (key === "text" && value) {
              textParam = decodeURIComponent(value);
              break;
            }
          }
        }
        
        if (textParam && textParam.trim()) {
          const voiceResult = parseTurkishExpense(textParam);
          if (voiceResult.amount && voiceResult.amount > 0) {
            const finalCategory = voiceResult.category.trim() || "Diğer";
            const finalSubcategory = voiceResult.subcategory.trim() || (language === "tr" ? "Genel" : "General");
            
            const expense = {
              id: `deeplink-expense-${Date.now()}-${Math.random()}`,
              label: voiceResult.label.trim() || finalCategory,
              subtitle: finalSubcategory,
              amount: voiceResult.amount,
              period: "daily" as const,
              isFixed: false,
              category: finalCategory,
              note: voiceResult.label.trim() || finalCategory,
              occurredAt: new Date().toISOString()
            };
            
            addExpense(expense);
            
            const wouldExceed = expense.amount > selectedPeriodRemaining;
            if (wouldExceed) {
              if (isHapticsEnabled) {
                Vibration.vibrate([0, 50, 80, 50]);
              }
            } else {
              triggerHaptic();
            }

            setToastConfig({
              visible: true,
              message: wouldExceed 
                ? (language === "tr" ? "Limit Aşıldı! ⚠️" : "Limit Exceeded! ⚠️")
                : `${formatCurrency(expense.amount)} ${t("toastAdded")}`,
              subtext: wouldExceed
                ? (language === "tr" ? `${expense.label} bütçe sınırınızı aştı.` : `${expense.label} went over your budget limit.`)
                : `${expense.label} ${t("toastAddedSub")}`,
              type: wouldExceed ? "warning" : "success"
            });
          }
        } else {
          // Open direct voice overlay if no text parameter
          setIsDirectVoiceActive(true);
          triggerHaptic();
        }
      }
    } catch (err) {
      console.error("[deep-link] error parsing url:", err);
    }
  }

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
        
        const wouldExceed = numericAmount > selectedPeriodRemaining;
        if (wouldExceed) {
          if (isHapticsEnabled) {
            Vibration.vibrate([0, 50, 80, 50]);
          }
        } else {
          triggerHaptic();
        }

        setToastConfig({
          visible: true,
          message: wouldExceed 
            ? (language === "tr" ? "Limit Aşıldı! ⚠️" : "Limit Exceeded! ⚠️")
            : `${formatCurrency(numericAmount)} ${t("toastAdded")}`,
          subtext: wouldExceed
            ? (language === "tr" ? `${expense.label} bütçe sınırınızı aştı.` : `${expense.label} went over your budget limit.`)
            : `${expense.label} ${t("toastAddedSub")}`,
          type: wouldExceed ? "warning" : "success"
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

  // Dynamic smart notifications list
  const notifications = useMemo(() => {
    const list: Array<{ id: string; title: string; body: string; time: string; type: "warning" | "info" | "success"; icon: keyof typeof Feather.glyphMap }> = [];
    
    // 1. Check if limit exceeded in any period (daily / weekly / monthly)
    const dailyRemaining = plan.limits.daily - getExpensesForPeriod(expenses, "daily").reduce((sum, e) => sum + e.amount, 0);
    const weeklyRemaining = plan.limits.weekly - getExpensesForPeriod(expenses, "weekly").reduce((sum, e) => sum + e.amount, 0);
    
    if (dailyRemaining < 0) {
      list.push({
        id: "daily-exceed",
        title: language === "tr" ? "Günlük Limit Aşıldı!" : "Daily Limit Exceeded!",
        body: language === "tr" 
          ? `Bugün harcama limitinizi ${formatCurrency(Math.abs(dailyRemaining))} aştınız. Lütfen dikkat edin.`
          : `You exceeded your daily budget limit by ${formatCurrency(Math.abs(dailyRemaining))} today.`,
        time: language === "tr" ? "Şimdi" : "Just now",
        type: "warning",
        icon: "alert-triangle"
      });
    } else if (dailyRemaining < plan.limits.daily * 0.2) {
      list.push({
        id: "daily-warning",
        title: language === "tr" ? "Günlük Limit Azalıyor" : "Daily Limit Running Low",
        body: language === "tr"
          ? "Bugün harcama limitinizin %80'ini doldurdunuz. Dikkatli olun!"
          : "You spent over 80% of your daily budget limit today.",
        time: language === "tr" ? "1 sa önce" : "1h ago",
        type: "warning",
        icon: "alert-circle"
      });
    }

    if (weeklyRemaining < 0) {
      list.push({
        id: "weekly-exceed",
        title: language === "tr" ? "Haftalık Bütçe Aşıldı" : "Weekly Budget Exceeded",
        body: language === "tr"
          ? "Bu haftaki toplam harcama limitiniz aşıldı."
          : "You went over your weekly spending limit.",
        time: language === "tr" ? "Bugün" : "Today",
        type: "warning",
        icon: "alert-triangle"
      });
    }

    // 2. Fixed expense warning (upcoming monthly payments)
    const fixedExpenses = expenses.filter(e => e.isFixed);
    if (fixedExpenses.length > 0) {
      const nextExp = fixedExpenses[0];
      list.push({
        id: "fixed-expense-upcoming",
        title: language === "tr" ? "Yaklaşan Sabit Gider" : "Upcoming Fixed Expense",
        body: language === "tr"
          ? `Bu ay planlanan ${nextExp.label} (${formatCurrency(nextExp.amount)}) ödemesini unutmayın.`
          : `Remember your upcoming ${nextExp.label} (${formatCurrency(nextExp.amount)}) payment this month.`,
        time: language === "tr" ? "Dün" : "Yesterday",
        type: "info",
        icon: "calendar"
      });
    }

    // 3. Welcome or generic tip
    list.push({
      id: "ai-tip-general",
      title: language === "tr" ? "Yeni AI Finansal Öneri" : "New AI Financial Tip",
      body: t("analysisAiTipBody"),
      time: language === "tr" ? "2 gün önce" : "2d ago",
      type: "success",
      icon: "zap"
    });

    return list;
  }, [expenses, plan, language]);

  // Gamified Savings Challenges progress generator
  const challenges = useMemo(() => {
    const last7Days = Array(7).fill(0).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    });

    const dailySpendMap = new Map<number, number>();
    last7Days.forEach(t => dailySpendMap.set(t, 0));

    expenses.forEach((e) => {
      if (e.isFixed || !e.occurredAt) return;
      const d = new Date(e.occurredAt);
      d.setHours(0, 0, 0, 0);
      const t = d.getTime();
      if (dailySpendMap.has(t)) {
        dailySpendMap.set(t, dailySpendMap.get(t)! + e.amount);
      }
    });

    let noSpendDaysCount = 0;
    dailySpendMap.forEach(amount => {
      if (amount === 0) noSpendDaysCount++;
    });

    const isNoSpendCompleted = noSpendDaysCount >= 5;

    const weeklyExpenses = getExpensesForPeriod(expenses, "weekly");
    const weeklyMarketSpent = weeklyExpenses
      .filter(e => getCategoryKey(e.category) === "market")
      .reduce((sum, e) => sum + e.amount, 0);
    const marketProgress = Math.min(weeklyMarketSpent / 1500, 1.0);
    const isMarketFailed = weeklyMarketSpent > 1500;
    const isMarketCompleted = !isMarketFailed && weeklyMarketSpent > 0;

    const weeklyDiningSpent = weeklyExpenses
      .filter(e => getCategoryKey(e.category) === "dining")
      .reduce((sum, e) => sum + e.amount, 0);
    const diningProgress = Math.min(weeklyDiningSpent / 300, 1.0);
    const isDiningFailed = weeklyDiningSpent > 300;
    const isDiningCompleted = !isDiningFailed && weeklyDiningSpent > 0;

    const goalTarget = Math.max(savingsGoal.targetAmount || 0, 0);
    const goalSaved = Math.max(savingsGoal.currentAmount || 0, 0);
    const isGoalQuarterCompleted = goalTarget > 0 ? (goalSaved / goalTarget) >= 0.25 : false;

    return [
      {
        id: "no-spend-5d",
        title: language === "tr" ? "5 Gün Sıfır Harcama" : "5-Day No-Spend",
        desc: language === "tr" ? "Son 7 günün en az 5 gününü harcamasız kapatın." : "Have at least 5 days without expenses in the last 7 days.",
        progress: noSpendDaysCount / 5,
        progressText: `${noSpendDaysCount} / 5 ${language === "tr" ? "gün" : "days"}`,
        isCompleted: isNoSpendCompleted,
        isFailed: false,
        icon: "shield"
      },
      {
        id: "market-saver",
        title: language === "tr" ? "Market Tasarrufu" : "Grocery Saver",
        desc: language === "tr" ? "Bu haftalık market harcamanızı ₺1.500 altında tutun." : "Keep weekly grocery spending under ₺1,500.",
        progress: isMarketFailed ? 1.0 : marketProgress,
        progressText: `${formatCurrency(weeklyMarketSpent)} / ${formatCurrency(1500)}`,
        isCompleted: isMarketCompleted,
        isFailed: isMarketFailed,
        icon: "shopping-bag"
      },
      {
        id: "dining-friend",
        title: language === "tr" ? "Kahve Dostu" : "Coffee Friend",
        desc: language === "tr" ? "Bu haftalık kafe/restoran harcamanızı ₺300 altında tutun." : "Keep weekly cafe/dining spending under ₺300.",
        progress: isDiningFailed ? 1.0 : diningProgress,
        progressText: `${formatCurrency(weeklyDiningSpent)} / ${formatCurrency(300)}`,
        isCompleted: isDiningCompleted,
        isFailed: isDiningFailed,
        icon: "coffee"
      },
      {
        id: "savings-quarter",
        title: language === "tr" ? "Yolun Çeyreği" : "First Quarter",
        desc: language === "tr" ? "Birikim hedefinizin %25'ine ulaşın." : "Reach 25% of your savings goal target.",
        progress: goalTarget > 0 ? Math.min((goalSaved / goalTarget) / 0.25, 1.0) : 0,
        progressText: `${goalTarget > 0 ? Math.round((goalSaved / goalTarget) * 100) : 0}% / 25%`,
        isCompleted: isGoalQuarterCompleted,
        isFailed: false,
        icon: "award"
      }
    ];
  }, [expenses, savingsGoal, language, currency]);

  // Filtered expenses based on chart selection
  const filteredAnalysisExpenses = useMemo(() => {
    if (!selectedChartLabel) {
      return periodExpenses;
    }
    
    return periodExpenses.filter((exp) => {
      if (exp.isFixed || !exp.occurredAt) return false;
      const date = new Date(exp.occurredAt);
      
      if (analysisPeriod === "weekly") {
        const days = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
        const dayOfWeekIndex = (date.getDay() + 6) % 7;
        return days[dayOfWeekIndex] === selectedChartLabel;
      } else {
        const day = date.getDate();
        let weekLabel = "4. Hft";
        if (day <= 7) {
          weekLabel = "1. Hft";
        } else if (day <= 14) {
          weekLabel = "2. Hft";
        } else if (day <= 21) {
          weekLabel = "3. Hft";
        }
        return weekLabel === selectedChartLabel;
      }
    });
  }, [periodExpenses, selectedChartLabel, analysisPeriod]);

  const analysisTotal = useMemo(() => {
    return filteredAnalysisExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredAnalysisExpenses]);

  // Category total spend parser for Analysis tab
  const analysisCategoryData = useMemo(() => {
    const totals: Record<string, { total: number; subs: Record<string, number> }> = {};
    let totalAll = 0;
    
    filteredAnalysisExpenses.forEach((exp) => {
      const cat = exp.category || "Diğer";
      const sub = exp.subtitle || (language === "tr" ? "Genel" : "General");
      
      if (!totals[cat]) {
        totals[cat] = { total: 0, subs: {} };
      }
      
      totals[cat].total += exp.amount;
      totals[cat].subs[sub] = (totals[cat].subs[sub] || 0) + exp.amount;
      totalAll += exp.amount;
    });

    return Object.entries(totals)
      .map(([category, data]) => {
        const subcategories = Object.entries(data.subs)
          .map(([subName, subAmount]) => ({
            name: subName,
            amount: subAmount,
            percentage: data.total > 0 ? (subAmount / data.total) * 100 : 0
          }))
          .sort((a, b) => b.amount - a.amount);

        return {
          category,
          amount: data.total,
          percentage: totalAll > 0 ? (data.total / totalAll) * 100 : 0,
          subcategories
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [periodExpenses, language]);

  // Weekly daily spend trend for Analysis tab bar chart
  const analysisWeeklyData = useMemo(() => {
    const days = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
    const dailySpend = Array(7).fill(0);
    const today = new Date();
    
    expenses.forEach((exp) => {
      if (exp.isFixed || !exp.occurredAt) return;
      const date = new Date(exp.occurredAt);
      const diffTime = Math.abs(today.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays <= 7) {
        const dayOfWeekIndex = (date.getDay() + 6) % 7; // Monday is 0, Sunday is 6
        dailySpend[dayOfWeekIndex] += exp.amount;
      }
    });

    const maxSpend = Math.max(...dailySpend, 1);

    return days.map((label, index) => ({
      label,
      amount: dailySpend[index],
      percentage: (dailySpend[index] / maxSpend) * 100
    }));
  }, [expenses]);

  // Monthly spending by weeks for Analysis tab bar chart
  const analysisMonthlyData = useMemo(() => {
    const weeks = ["1. Hft", "2. Hft", "3. Hft", "4. Hft"];
    const weeklySpend = Array(4).fill(0);
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    expenses.forEach((exp) => {
      if (exp.isFixed || !exp.occurredAt) return;
      const date = new Date(exp.occurredAt);
      if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
        const day = date.getDate();
        if (day <= 7) {
          weeklySpend[0] += exp.amount;
        } else if (day <= 14) {
          weeklySpend[1] += exp.amount;
        } else if (day <= 21) {
          weeklySpend[2] += exp.amount;
        } else {
          weeklySpend[3] += exp.amount;
        }
      }
    });

    const maxSpend = Math.max(...weeklySpend, 1);

    return weeks.map((label, index) => ({
      label,
      amount: weeklySpend[index],
      percentage: (weeklySpend[index] / maxSpend) * 100
    }));
  }, [expenses]);

  function renderHomeTab() {
    const absExceededAmount = Math.abs(selectedPeriodRemaining);
    const formattedExceeded = formatCurrency(absExceededAmount);

    return (
      <View style={styles.tabContentContainer}>
        <View style={styles.header}>
          <View style={styles.greetingWrap}>
            <Text style={[styles.greeting, { color: themeColors.text }]}>{t("welcomeUser")}</Text>
            {selectedPeriodRemaining < 0 ? (
              <Text style={[styles.subtitle, { color: "#D32F2F", fontWeight: "900" }]}>
                {language === "tr" 
                  ? `⚠️ Dikkat! Harcama limitini ${formattedExceeded} aştın, hedefin tehlikede!` 
                  : `⚠️ Warning! Exceeded spending limit by ${formattedExceeded}, target in danger!`}
              </Text>
            ) : (
              <Text style={[styles.subtitle, { color: themeColors.textMuted }]}>{t("welcomeSub")}</Text>
            )}
          </View>
          <Pressable 
            style={({ pressed }) => [
              styles.notificationButton, 
              { backgroundColor: themeColors.surface, borderColor: themeColors.border },
              pressed && styles.pressed
            ]}
            onPress={() => {
              triggerHaptic();
              setIsNotificationsVisible(true);
              setHasUnreadNotifications(false);
            }}
          >
            <Feather name="bell" size={25} color={themeColors.text} />
            {hasUnreadNotifications && <View style={styles.notificationDot} />}
          </Pressable>
        </View>

        {/* Savings Goal Management (Mascot Card) */}
        <View style={[styles.heroCard, { 
          backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.02)" : "#FDF6EE", 
          borderColor: isDarkMode ? "rgba(255, 255, 255, 0.06)" : "#F0E4D5", 
          borderWidth: 1.2,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: isDarkMode ? 0.2 : 0.03,
          shadowRadius: 16,
          elevation: 3,
          marginTop: 14
        }]}>
          <View style={styles.heroCopy}>
            <View style={[styles.goalBadge, { backgroundColor: isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(13,50,40,0.05)" }]}>
              <Text style={styles.goalBadgeIcon}>🎯</Text>
              <Text style={[styles.goalBadgeText, { color: themeColors.primary }]}>{t("savingsGoalTitle").toUpperCase()}</Text>
            </View>
            <Text style={[styles.heroSubtitle, { color: themeColors.textMuted }]}>{language === "tr" ? "Hedefin" : "Your Goal"}</Text>
            <Text style={[styles.heroAmount, { color: themeColors.text }]}>{formatCurrency(goalTargetAmount)}</Text>
            <View style={styles.savedAmountBlock}>
              <Text style={[styles.savedAmountTitle, { color: themeColors.textMuted }]}>{language === "tr" ? "Bugüne kadar biriktirdiğin" : "Accumulated so far"}</Text>
              <Text style={[styles.savedAmountValue, { color: themeColors.text }]}>{formatCurrency(goalSavedAmount)}</Text>
            </View>
            <View style={[styles.heroProgressTrack, { backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(13, 50, 40, 0.06)" }]}>
              <View style={[styles.heroProgressFill, { backgroundColor: themeColors.primary, width: `${goalProgress * 100}%` }]} />
            </View>
            <Text style={[styles.heroPercentText, { color: themeColors.textMuted }]}>
              {language === "tr" ? `Hedefin %${goalProgressPercent}’i tamamlandı` : `${goalProgressPercent}% of goal completed`}
            </Text>
          </View>
          <View style={{ position: "absolute", right: 14, top: 29, width: 120, height: 120, zIndex: 5 }}>
            {selectedPeriodRemaining < 0 && (
              <View style={styles.mascotSpeechBubbleWrapper}>
                <View style={styles.mascotSpeechBubble}>
                  <Text style={styles.mascotSpeechBubbleText}>
                    {language === "tr" ? `${formattedExceeded} Aşıldı! ⚠️` : `${formattedExceeded} Over! ⚠️`}
                  </Text>
                  <View style={styles.speechBubbleArrow} />
                </View>
              </View>
            )}
            <View style={[styles.heroMascot, { right: 0, top: 0 }]}>
              <Image source={mascot} style={styles.heroMascotImage} resizeMode="contain" />
            </View>
          </View>
        </View>

        {/* Polished 3-Column Summary Card */}
        <View style={[styles.summaryCard, { 
          backgroundColor: themeColors.surface, 
          borderColor: themeColors.border,
          borderWidth: 1.2,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: isDarkMode ? 0.25 : 0.04,
          shadowRadius: 16,
          elevation: 4
        }]}>
          <SummaryMetric
            icon="credit-card"
            title={copy.limit}
            amount={selectedPeriodLimit}
            tone="green"
          />
          <View style={[styles.divider, { backgroundColor: themeColors.border }]} />
          <SummaryMetric
            icon="pie-chart"
            title={copy.spent}
            amount={recentTotal}
            tone="orange"
          />
          <View style={[styles.divider, { backgroundColor: themeColors.border }]} />
          <SummaryMetric
            icon="shield"
            title={copy.remaining}
            amount={selectedPeriodRemaining}
            tone="green"
          />
        </View>

        <View style={styles.addExpenseButtonRow}>
          <Pressable 
            style={({ pressed }) => [styles.mainAddButton, pressed && styles.pressed]} 
            onPress={() => {
              triggerHaptic();
              setIsSheetVisible(true);
            }}
          >
            <LinearGradient colors={["#074A31", colors.primary, "#063B28"]} start={{ x: 0, y: 0.1 }} end={{ x: 1, y: 1 }} style={styles.addGradient}>
              <View style={styles.addIconWrap}>
                <Feather name="plus" size={18} color={colors.primary} />
              </View>
              <Text style={styles.addText}>{t("addExpenseBtn")}</Text>
            </LinearGradient>
          </Pressable>

          <Pressable 
            style={({ pressed }) => [styles.mainVoiceButton, pressed && styles.pressed]} 
            onPress={() => {
              triggerHaptic();
              setIsDirectVoiceActive(true);
            }}
          >
            <LinearGradient colors={["#DF7A12", "#C8640E"]} start={{ x: 0, y: 0.1 }} end={{ x: 1, y: 1 }} style={styles.voiceGradient}>
              <View style={styles.voiceIconWrap}>
                <Feather name="mic" size={18} color="#DF7A12" />
              </View>
              <Text style={styles.voiceText}>{t("voiceAddBtn")}</Text>
            </LinearGradient>
          </Pressable>
        </View>

        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: themeColors.primary }]}>{t("recentSectionTitle")}</Text>
            <Text style={[styles.sectionTotal, { color: themeColors.textMuted }]}>{t("recentSectionTotal")}: {formatCurrency(recentTotal)}</Text>
          </View>

          <View style={[
            styles.expenseCard, 
            { 
              backgroundColor: themeColors.surface, 
              borderColor: themeColors.border,
              borderWidth: 1.2,
              paddingHorizontal: 0,
              paddingVertical: 0,
              marginTop: 14,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: isDarkMode ? 0.25 : 0.04,
              shadowRadius: 16,
              elevation: 4
            }
          ]}>
            {/* The Integrated Segment Header */}
            <View style={[
              styles.cardSegmentHeader, 
              { 
                backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.02)" : "rgba(13, 50, 40, 0.02)",
                borderBottomColor: themeColors.border
              }
            ]}>
              {periods.map((period) => {
                const isSelected = selectedPeriod === period.value;
                return (
                  <Pressable
                    key={period.value}
                    onPress={() => {
                      triggerHaptic();
                      setSelectedPeriod(period.value);
                    }}
                    style={({ pressed }) => [
                      styles.cardSegmentItem, 
                      isSelected && [
                        styles.cardSegmentActive, 
                        { 
                          backgroundColor: isDarkMode ? "#1C2521" : colors.white,
                          shadowColor: "#000"
                        }
                      ],
                      pressed && styles.pressed
                    ]}
                  >
                    <Feather name={period.icon} size={15} color={isSelected ? themeColors.primary : themeColors.textMuted} />
                    <Text style={[styles.cardSegmentText, { color: isSelected ? themeColors.primary : themeColors.textMuted }]}>
                      {period.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* List inner content with layout padding */}
            <View style={{ paddingHorizontal: 14, paddingTop: 6, flex: 1 }}>
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
                  <View style={[styles.emptyExpenses, { backgroundColor: themeColors.surface }]}>
                    <Feather name="inbox" size={28} color={themeColors.textMuted} />
                    <Text style={[styles.emptyExpensesText, { color: themeColors.text }]}>{t("emptyExpenses")}</Text>
                    <Text style={[styles.emptyExpensesSubtext, { color: themeColors.textMuted }]}>{t("emptyExpensesSub")}</Text>
                  </View>
                }
                renderItem={({ item, index }) => {
                  const iconConfig = getCategoryIconConfig(item.expense.category);
                  return (
                    <View>
                      <View style={styles.expenseRow}>
                        <View style={[styles.expenseIcon, { backgroundColor: iconConfig.bg, alignItems: "center", justifyContent: "center" }]}>
                          <Feather name={iconConfig.name} size={15} color={iconConfig.color} />
                        </View>
                        <View style={styles.expenseCopy}>
                          <Text style={[styles.expenseTitle, { color: themeColors.text, fontWeight: "800", fontSize: 14.5 }]}>{item.expense.label}</Text>
                          <Text style={[styles.expenseCategory, { color: themeColors.textMuted, fontWeight: "600", fontSize: 11 }]}>
                            {item.expense.category}{item.expense.subtitle && item.expense.subtitle !== item.expense.category ? ` • ${item.expense.subtitle}` : ""}
                          </Text>
                        </View>
                        <View style={styles.expenseMeta}>
                          <Text style={[styles.expenseAmount, { color: themeColors.text, fontWeight: "900", fontSize: 15 }]}>{formatCurrency(item.expense.amount)}</Text>
                          <Text style={[styles.expenseDate, { color: themeColors.textMuted, fontWeight: "700", fontSize: 10 }]}>{formatExpenseDate(item.expense.occurredAt)}</Text>
                        </View>
                      </View>
                      {index < periodExpenseRows.length - 1 && <View style={[styles.expenseDivider, { backgroundColor: themeColors.border }]} />}
                    </View>
                  );
                }}
              />
            </View>
            {isRecentListScrollable ? (
              <View pointerEvents="none" style={[styles.customScrollTrack, { backgroundColor: themeColors.border }]}>
                <Animated.View style={[styles.customScrollThumb, { backgroundColor: themeColors.primary, transform: [{ translateY: customScrollThumbTranslateY }] }]} />
              </View>
            ) : null}
          </View>
        </View>
      </View>
    );
  }

  function renderAnalysisTab() {
    const activeChartData = analysisPeriod === "weekly" ? analysisWeeklyData : analysisMonthlyData;
    const highestCategory = analysisCategoryData[0]?.category || "Yok";

    return (
      <ScrollView style={styles.tabContentContainer} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={styles.header}>
          <View style={styles.greetingWrap}>
            <Text style={[styles.greeting, { color: themeColors.text }]}>{t("analysisTitle")}</Text>
            <Text style={[styles.subtitle, { color: themeColors.textMuted }]}>{t("analysisSubtitle")}</Text>
          </View>
        </View>

        {/* Period Selector Segment Row */}
        <View style={[styles.segmentContainer, { backgroundColor: isDarkMode ? "rgba(255,255,255,0.04)" : "rgba(13,50,40,0.03)" }]}>
          <Pressable 
            style={[
              styles.segmentButton, 
              analysisPeriod === "weekly" && [styles.segmentButtonActive, { backgroundColor: themeColors.surface }]
            ]}
            onPress={() => {
              triggerHaptic();
              setAnalysisPeriod("weekly");
            }}
          >
            <Text style={[styles.segmentText, { color: analysisPeriod === "weekly" ? themeColors.text : themeColors.textMuted }]}>{t("analysisPeriodWeekly")}</Text>
          </Pressable>
          <Pressable 
            style={[
              styles.segmentButton, 
              analysisPeriod === "monthly" && [styles.segmentButtonActive, { backgroundColor: themeColors.surface }]
            ]}
            onPress={() => {
              triggerHaptic();
              setAnalysisPeriod("monthly");
            }}
          >
            <Text style={[styles.segmentText, { color: analysisPeriod === "monthly" ? themeColors.text : themeColors.textMuted }]}>{t("analysisPeriodMonthly")}</Text>
          </Pressable>
        </View>

        {/* Spending Status Panel */}
        <View style={[
          styles.analysisCard, 
          { 
            backgroundColor: selectedPeriodRemaining < 0 
              ? (isDarkMode ? "rgba(211, 47, 47, 0.08)" : "#FDEDED") 
              : (isDarkMode ? "rgba(7, 74, 49, 0.08)" : "#EAF5F0"),
            borderColor: selectedPeriodRemaining < 0 
              ? (isDarkMode ? "rgba(211, 47, 47, 0.3)" : "#F8D7DA") 
              : (isDarkMode ? "rgba(7, 74, 49, 0.3)" : "#D1E8DD"),
            borderWidth: 1.2,
            borderRadius: 20,
            padding: 16,
            marginTop: 14,
            flexDirection: "row",
            gap: 12,
            alignItems: "center",
            marginBottom: 0
          }
        ]}>
          <View style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: selectedPeriodRemaining < 0 ? "rgba(211, 47, 47, 0.12)" : "rgba(0, 223, 137, 0.12)",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <Feather 
              name={selectedPeriodRemaining < 0 ? "alert-triangle" : "check-circle"} 
              size={22} 
              color={selectedPeriodRemaining < 0 ? "#D32F2F" : "#00DF89"} 
            />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ 
              fontSize: 14, 
              fontWeight: "900", 
              color: selectedPeriodRemaining < 0 ? "#D32F2F" : "#00DF89" 
            }}>
              {selectedPeriodRemaining < 0 
                ? (language === "tr" ? "Harcama Durumu: Bütçe Aşıldı! ⚠️" : "Spending Status: Over Budget! ⚠️")
                : (language === "tr" ? "Harcama Durumu: Her Şey Yolunda! 🎉" : "Spending Status: On Track! 🎉")
              }
            </Text>
            <Text style={{ 
              fontSize: 12, 
              lineHeight: 17, 
              fontWeight: "600", 
              color: themeColors.textMuted 
            }}>
              {selectedPeriodRemaining < 0 
                ? (language === "tr" 
                    ? `Bu dönem limitinizi ${formatCurrency(Math.abs(selectedPeriodRemaining))} aştınız. Tasarruf hedefiniz tehlikede, harcamaları yavaşlatın.` 
                    : `You exceeded your limit by ${formatCurrency(Math.abs(selectedPeriodRemaining))} this period. Your savings goal is in danger, slow down spending.`)
                : (language === "tr"
                    ? `Tebrikler! Planlanan limitin içindesiniz. ${formatCurrency(selectedPeriodRemaining)} harcama limitiniz daha var. Böyle devam edin!`
                    : `Congratulations! You are within the limit. You have ${formatCurrency(selectedPeriodRemaining)} remaining limit. Keep it up!`)
              }
            </Text>
          </View>
        </View>

        {/* Dynamic Trend Bar Chart */}
        <View style={[styles.analysisCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border, marginTop: 14 }]}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <Text style={[styles.analysisCardTitle, { color: themeColors.text, marginBottom: 0 }]}>
              {analysisPeriod === "weekly" ? t("analysisChartWeeklyTitle") : t("analysisChartMonthlyTitle")}
            </Text>
            {selectedChartLabel && (
              <Pressable 
                onPress={() => {
                  triggerHaptic();
                  setSelectedChartLabel(null);
                }}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 8,
                  backgroundColor: isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(13,50,40,0.05)"
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: "800", color: themeColors.primary }}>
                  {language === "tr" ? "Seçimi Temizle" : "Clear Filter"}
                </Text>
              </Pressable>
            )}
          </View>
          <View style={styles.chartRow}>
            {activeChartData.map((day, idx) => {
              const isSelected = selectedChartLabel === day.label;
              const isAnySelected = selectedChartLabel !== null;
              const barOpacity = isAnySelected ? (isSelected ? 1.0 : 0.35) : 1.0;
              const barColor = isSelected ? "#00DF89" : themeColors.primary;

              return (
                <Pressable 
                  key={idx} 
                  style={[styles.chartCol, { opacity: barOpacity }]}
                  onPress={() => {
                    triggerHaptic();
                    setSelectedChartLabel(selectedChartLabel === day.label ? null : day.label);
                  }}
                >
                  <View style={[styles.chartBarTrack, { backgroundColor: isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(13,50,40,0.04)" }]}>
                    <View 
                      style={[
                        styles.chartBarFill, 
                        { 
                          height: `${day.percentage}%`,
                          backgroundColor: day.amount > 0 ? barColor : "transparent"
                        }
                      ]} 
                    />
                  </View>
                  <Text style={[styles.chartBarLabel, { color: isSelected ? barColor : themeColors.textMuted, fontWeight: isSelected ? "900" : "700" }]}>
                    {day.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* AI Insight Card */}
        {analysisCategoryData.length > 0 && (
          <LinearGradient
            colors={isDarkMode ? ["rgba(24, 74, 52, 0.16)", "rgba(12, 42, 28, 0.05)"] : ["#EAF5F0", "#F5FAF7"]}
            style={[
              styles.insightCard, 
              { 
                borderColor: isDarkMode ? "rgba(24, 74, 52, 0.32)" : "#D1E8DD",
                borderWidth: 1.2,
                paddingLeft: 22,
                paddingRight: 16,
                paddingVertical: 16,
                borderRadius: 20,
                shadowColor: themeColors.primary,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: isDarkMode ? 0.05 : 0.025,
                shadowRadius: 12,
                elevation: 2,
                overflow: "hidden"
              }
            ]}
          >
            {/* Left Vertical Glowing Accent Bar */}
            <LinearGradient
              colors={["#00DF89", themeColors.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: 5
              }}
            />

            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={styles.insightHeader}>
                <View style={{
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  backgroundColor: isDarkMode ? "rgba(0, 223, 137, 0.1)" : "rgba(13, 50, 40, 0.06)",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 2
                }}>
                  <Feather name="zap" size={13} color={isDarkMode ? "#00DF89" : themeColors.primary} />
                </View>
                <Text style={[styles.insightTitle, { color: themeColors.primary, fontSize: 14, fontWeight: "900" }]}>
                  {t("analysisAiTipTitle")}
                </Text>
              </View>
              <View style={{
                backgroundColor: isDarkMode ? "rgba(0, 223, 137, 0.12)" : "rgba(13,50,40,0.06)",
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: isDarkMode ? "rgba(0, 223, 137, 0.15)" : "transparent"
              }}>
                <Text style={{ fontSize: 9, fontWeight: "900", color: isDarkMode ? "#00DF89" : themeColors.primary, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  ✨ {language === "tr" ? "YAPAY ZEKA" : "AI INSIGHT"}
                </Text>
              </View>
            </View>
            <Text style={[styles.insightBody, { color: themeColors.text, marginTop: 8, lineHeight: 19, fontSize: 13, fontWeight: "600" }]}>
              {t("analysisAiTipBody", { category: highestCategory })}
            </Text>
          </LinearGradient>
        )}

        {/* Categories breakdown */}
        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: themeColors.primary }]}>{t("analysisCategoryHeader")}</Text>
            <Text style={[styles.sectionTotal, { color: themeColors.textMuted }]}>
              {t("analysisCategoryTotal")}: {formatCurrency(selectedChartLabel ? analysisTotal : recentTotal)}
            </Text>
          </View>

          <View style={[styles.expenseCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border, padding: 16, flex: 1, minHeight: 220 }]}>
            {analysisCategoryData.length === 0 ? (
              <View style={styles.emptyExpenses}>
                <Feather name="bar-chart-2" size={28} color={themeColors.textMuted} />
                <Text style={[styles.emptyExpensesText, { color: themeColors.text }]}>{t("analysisNoData")}</Text>
                <Text style={[styles.emptyExpensesSubtext, { color: themeColors.textMuted }]}>{t("analysisNoDataSub")}</Text>
              </View>
            ) : (
              <View style={{ gap: 20 }}>
                {analysisCategoryData.map((item) => {
                  const categoryKey = getCategoryKey(item.category);
                  const limit = categoryLimits[categoryKey] || 0;
                  const hasLimit = limit > 0;
                  const isLimitExceeded = hasLimit && item.amount > limit;
                  
                  const progressPercent = hasLimit 
                    ? Math.min((item.amount / limit) * 100, 100) 
                    : item.percentage;
                  
                  const barColor = isLimitExceeded ? "#D32F2F" : themeColors.primary;
                  const amountColor = isLimitExceeded ? "#D32F2F" : themeColors.text;

                  return (
                    <View key={item.category} style={{ gap: 6 }}>
                      <View style={styles.categoryRow}>
                        <View style={styles.categoryInfo}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                            <Text style={[styles.categoryName, { color: themeColors.text, fontWeight: "800", fontSize: 14 }]}>{item.category}</Text>
                            {isLimitExceeded && (
                              <View style={{ backgroundColor: "rgba(211, 47, 47, 0.1)", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                                <Text style={{ fontSize: 9, fontWeight: "900", color: "#D32F2F" }}>⚠️ {language === "tr" ? "AŞILDI" : "EXCEEDED"}</Text>
                              </View>
                            )}
                          </View>
                          <Text style={[styles.categoryAmount, { color: amountColor, fontWeight: "800", fontSize: 13 }]}>
                            {hasLimit 
                              ? `${formatCurrency(item.amount)} / ${formatCurrency(limit)}`
                              : `${formatCurrency(item.amount)} (${Math.round(item.percentage)}%)`
                            }
                          </Text>
                        </View>
                        <View style={[styles.progressTrack, { backgroundColor: isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(13,50,40,0.04)" }]}>
                          <View 
                            style={[
                              styles.progressFill, 
                              { 
                                width: `${progressPercent}%`,
                                backgroundColor: barColor
                              }
                            ]} 
                          />
                        </View>
                      </View>

                    {/* Subcategories Breakdown */}
                    {item.subcategories && item.subcategories.length > 0 && (
                      <View style={{ paddingLeft: 12, gap: 5, marginTop: 2 }}>
                        {item.subcategories.map((sub) => (
                          <View key={sub.name} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                            <Text style={{ fontSize: 12, color: themeColors.textMuted, fontWeight: "600" }}>
                              • {sub.name}
                            </Text>
                            <Text style={{ fontSize: 12, color: themeColors.text, fontWeight: "600" }}>
                              {formatCurrency(sub.amount)} ({Math.round(sub.percentage)}%)
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
            )}
          </View>
        </View>
      </ScrollView>
    );
  }

  function renderProfileTab() {
    return (
      <ScrollView style={styles.tabContentContainer} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Header with integrated User Profile */}
        <View style={[styles.header, { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }]}>
          <View style={styles.greetingWrap}>
            <Text style={[styles.greeting, { color: themeColors.text }]}>Gürkan 👋</Text>
            <Text style={[styles.subtitle, { color: themeColors.textMuted }]}>{t("profileSubtitle")}</Text>
          </View>
          <View style={[styles.profileAvatarHeader, { backgroundColor: themeColors.primary }]}>
            <Text style={styles.profileAvatarHeaderText}>G</Text>
          </View>
        </View>

        {/* Compact Side-by-Side Budget Summary Card */}
        <View style={[styles.profileCardCompact, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <View style={styles.profileBudgetCol}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: themeColors.primary }} />
              <Text style={[styles.profileBudgetLabelCompact, { color: themeColors.textMuted }]}>{t("profileIncomeLabel")}</Text>
            </View>
            <Text style={[styles.profileBudgetValCompact, { color: themeColors.primary }]}>{formatCurrency(totalIncome)}</Text>
            <Pressable 
              style={({ pressed }) => [styles.profileMiniBtn, { backgroundColor: isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(13,50,40,0.05)" }, pressed && styles.pressed]}
              onPress={() => {
                triggerHaptic();
                router.push("/income-setup");
              }}
            >
              <Text style={[styles.profileMiniBtnText, { color: themeColors.primary }]}>{t("profileEditIncomeBtn")}</Text>
            </Pressable>
          </View>

          <View style={[styles.profileVerticalDivider, { backgroundColor: themeColors.border }]} />

          <View style={styles.profileBudgetCol}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#DF7A12" }} />
              <Text style={[styles.profileBudgetLabelCompact, { color: themeColors.textMuted }]}>{t("profileFixedExpenseLabel")}</Text>
            </View>
            <Text style={[styles.profileBudgetValCompact, { color: "#DF7A12" }]}>{formatCurrency(totalFixedExpenses)}</Text>
            <Pressable 
              style={({ pressed }) => [styles.profileMiniBtn, { backgroundColor: isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(223,122,18,0.06)" }, pressed && styles.pressed]}
              onPress={() => {
                triggerHaptic();
                router.push("/fixed-expense");
              }}
            >
              <Text style={[styles.profileMiniBtnText, { color: "#DF7A12" }]}>{t("profileEditExpenseBtn")}</Text>
            </Pressable>
          </View>
        </View>

        {/* Savings Goal Management Card */}
        <View style={[styles.profileCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border, flexDirection: "column", gap: 10, paddingVertical: 14 }]}>
          <Text style={[styles.profileCardTitle, { color: themeColors.text }]}>{t("profileSavingsGoalHeader")}</Text>
          <View style={styles.profileBudgetRow}>
            <Text style={[styles.profileBudgetLabel, { color: themeColors.textMuted }]}>{t("profileGoalTarget")}</Text>
            <Text style={[styles.profileBudgetVal, { color: themeColors.text, fontWeight: "700" }]}>{formatCurrency(savingsGoal.targetAmount)}</Text>
          </View>
          <View style={styles.profileBudgetRow}>
            <Text style={[styles.profileBudgetLabel, { color: themeColors.textMuted }]}>{t("profileGoalSaved")}</Text>
            <Text style={[styles.profileBudgetVal, { color: themeColors.text, fontWeight: "700" }]}>{formatCurrency(savingsGoal.currentAmount)}</Text>
          </View>
          
          <Pressable 
            style={({ pressed }) => [
              styles.profileEditButton, 
              { backgroundColor: isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(13,50,40,0.06)" },
              pressed && styles.pressed
            ]}
            onPress={() => {
              triggerHaptic();
              setTempGoalTitle(savingsGoal.title || "");
              setTempGoalTarget(String(savingsGoal.targetAmount || ""));
              setTempGoalSaved(String(savingsGoal.currentAmount || ""));
              setIsGoalModalVisible(true);
            }}
          >
            <Text style={[styles.profileEditButtonText, { color: themeColors.primary }]}>{t("profileEditGoalBtn")}</Text>
          </Pressable>
        </View>

        {/* Savings Challenges Card */}
        <View style={[styles.profileCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border, flexDirection: "column", gap: 12, paddingVertical: 14 }]}>
          <Text style={[styles.profileCardTitle, { color: themeColors.text }]}>
            🏆 {language === "tr" ? "Meydan Okumalar" : "Savings Challenges"}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 10 }}>
            {challenges.map((challenge) => {
              const borderCol = challenge.isFailed
                ? "rgba(211, 47, 47, 0.4)"
                : (challenge.isCompleted ? "#00DF89" : themeColors.border);
              
              const progressVal = challenge.isFailed ? 1.0 : challenge.progress;
              const barFillColor = challenge.isFailed 
                ? "#D32F2F" 
                : (challenge.isCompleted ? "#00DF89" : themeColors.primary);

              return (
                <View 
                  key={challenge.id} 
                  style={{
                    width: 240,
                    borderRadius: 20,
                    borderWidth: 1.2,
                    borderColor: borderCol,
                    padding: 14,
                    backgroundColor: isDarkMode ? "rgba(255,255,255,0.01)" : "rgba(0,0,0,0.01)"
                  }}
                >
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <View style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: challenge.isFailed 
                        ? "rgba(211, 47, 47, 0.08)"
                        : (challenge.isCompleted ? "rgba(0, 223, 137, 0.1)" : "rgba(0,0,0,0.05)"),
                      alignItems: "center",
                      justifyContent: "center"
                    }}>
                      <Feather 
                        name={challenge.icon as any} 
                        size={16} 
                        color={challenge.isFailed 
                          ? "#D32F2F"
                          : (challenge.isCompleted ? "#00DF89" : themeColors.text)} 
                      />
                    </View>
                    
                    {challenge.isCompleted && (
                      <View style={{ backgroundColor: "rgba(0, 223, 137, 0.12)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                        <Text style={{ fontSize: 9, fontWeight: "900", color: "#00DF89" }}>✨ {language === "tr" ? "TAMAMLANDI" : "COMPLETED"}</Text>
                      </View>
                    )}
                    {challenge.isFailed && (
                      <View style={{ backgroundColor: "rgba(211, 47, 47, 0.1)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                        <Text style={{ fontSize: 9, fontWeight: "900", color: "#D32F2F" }}>❌ {language === "tr" ? "BAŞARISIZ" : "FAILED"}</Text>
                      </View>
                    )}
                    {!challenge.isCompleted && !challenge.isFailed && (
                      <Text style={{ fontSize: 10, fontWeight: "800", color: themeColors.textMuted }}>
                        {challenge.progressText}
                      </Text>
                    )}
                  </View>

                  <Text style={{ fontSize: 13, fontWeight: "900", color: themeColors.text, marginBottom: 2 }}>{challenge.title}</Text>
                  <Text style={{ fontSize: 11, color: themeColors.textMuted, lineHeight: 15, height: 45, fontWeight: "600" }} numberOfLines={3}>
                    {challenge.desc}
                  </Text>

                  <View style={{ height: 6, borderRadius: 3, backgroundColor: isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)", overflow: "hidden", marginTop: 8 }}>
                    <View style={{ width: `${progressVal * 100}%`, height: "100%", backgroundColor: barFillColor, borderRadius: 3 }} />
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* Settings Toggle Card */}
        <View style={[styles.profileCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border, flexDirection: "column", paddingVertical: 8 }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingIconWrap}>
              <Feather name="moon" size={20} color={themeColors.text} />
              <Text style={[styles.settingLabel, { color: themeColors.text }]}>{t("profileSettingDarkMode")}</Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={(val) => {
                triggerHaptic();
                setIsDarkMode(val);
              }}
              trackColor={{ false: "#D1CFC7", true: themeColors.primary }}
              thumbColor={colors.white}
            />
          </View>

          <View style={[styles.expenseDivider, { backgroundColor: themeColors.border }]} />

          <View style={styles.settingRow}>
            <View style={styles.settingIconWrap}>
              <Feather name="activity" size={20} color={themeColors.text} />
              <Text style={[styles.settingLabel, { color: themeColors.text }]}>{t("profileSettingHaptics")}</Text>
            </View>
            <Switch
              value={isHapticsEnabled}
              onValueChange={(val) => {
                Vibration.vibrate(10);
                setIsHapticsEnabled(val);
              }}
              trackColor={{ false: "#D1CFC7", true: themeColors.primary }}
              thumbColor={colors.white}
            />
          </View>

          <View style={[styles.expenseDivider, { backgroundColor: themeColors.border }]} />

          <View style={styles.settingRow}>
            <View style={styles.settingIconWrap}>
              <Feather name="globe" size={20} color={themeColors.text} />
              <Text style={[styles.settingLabel, { color: themeColors.text }]}>{t("profileSettingLanguage")}</Text>
            </View>
            <View style={{ flexDirection: "row", gap: 6 }}>
              <Pressable 
                onPress={() => { triggerHaptic(); setLanguage("tr"); }}
                style={[{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }, language === "tr" ? { backgroundColor: themeColors.primary } : { backgroundColor: "rgba(0,0,0,0.05)" }]}
              >
                <Text style={{ fontSize: 12, fontWeight: "800", color: language === "tr" ? colors.white : themeColors.text }}>TR</Text>
              </Pressable>
              <Pressable 
                onPress={() => { triggerHaptic(); setLanguage("en"); }}
                style={[{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }, language === "en" ? { backgroundColor: themeColors.primary } : { backgroundColor: "rgba(0,0,0,0.05)" }]}
              >
                <Text style={{ fontSize: 12, fontWeight: "800", color: language === "en" ? colors.white : themeColors.text }}>EN</Text>
              </Pressable>
            </View>
          </View>

          <View style={[styles.expenseDivider, { backgroundColor: themeColors.border }]} />

          <View style={styles.settingRow}>
            <View style={styles.settingIconWrap}>
              <Feather name="dollar-sign" size={20} color={themeColors.text} />
              <Text style={[styles.settingLabel, { color: themeColors.text }]}>
                {language === "tr" ? "Para Birimi" : "Currency"}
              </Text>
            </View>
            <View style={{ flexDirection: "row", gap: 6 }}>
              <Pressable 
                onPress={() => { triggerHaptic(); setCurrency("TRY"); }}
                style={[{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }, currency === "TRY" ? { backgroundColor: themeColors.primary } : { backgroundColor: "rgba(0,0,0,0.05)" }]}
              >
                <Text style={{ fontSize: 12, fontWeight: "800", color: currency === "TRY" ? colors.white : themeColors.text }}>₺ (TL)</Text>
              </Pressable>
              <Pressable 
                onPress={() => { triggerHaptic(); setCurrency("USD"); }}
                style={[{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }, currency === "USD" ? { backgroundColor: themeColors.primary } : { backgroundColor: "rgba(0,0,0,0.05)" }]}
              >
                <Text style={{ fontSize: 12, fontWeight: "800", color: currency === "USD" ? colors.white : themeColors.text }}>$ (USD)</Text>
              </Pressable>
              <Pressable 
                onPress={() => { triggerHaptic(); setCurrency("EUR"); }}
                style={[{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }, currency === "EUR" ? { backgroundColor: themeColors.primary } : { backgroundColor: "rgba(0,0,0,0.05)" }]}
              >
                <Text style={{ fontSize: 12, fontWeight: "800", color: currency === "EUR" ? colors.white : themeColors.text }}>€ (EUR)</Text>
              </Pressable>
            </View>
          </View>

          <View style={[styles.expenseDivider, { backgroundColor: themeColors.border }]} />

          <Pressable 
            style={({ pressed }) => [styles.settingRow, pressed && styles.pressed]}
            onPress={() => {
              triggerHaptic();
              setIsCategoryLimitsModalVisible(true);
            }}
          >
            <View style={styles.settingIconWrap}>
              <Feather name="sliders" size={20} color={themeColors.text} />
              <Text style={[styles.settingLabel, { color: themeColors.text }]}>
                {language === "tr" ? "Kategori Limitleri" : "Category Limits"}
              </Text>
            </View>
            <Feather name="chevron-right" size={20} color={themeColors.textMuted} />
          </Pressable>
        </View>

        {/* Support & Information Card */}
        <View style={[styles.profileCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border, flexDirection: "column", paddingVertical: 8, marginTop: 14 }]}>
          <Pressable 
            style={({ pressed }) => [styles.settingRow, pressed && styles.pressed]}
            onPress={() => {
              triggerHaptic();
              setToastConfig({
                visible: true,
                message: t("sheetContactToast"),
                subtext: t("sheetContactToastSub")
              });
            }}
          >
            <View style={styles.settingIconWrap}>
              <Feather name="mail" size={20} color={themeColors.text} />
              <Text style={[styles.settingLabel, { color: themeColors.text }]}>{t("profileSettingContact")}</Text>
            </View>
            <Feather name="chevron-right" size={20} color={themeColors.textMuted} />
          </Pressable>

          <View style={[styles.expenseDivider, { backgroundColor: themeColors.border }]} />

          <Pressable 
            style={({ pressed }) => [styles.settingRow, pressed && styles.pressed]}
            onPress={() => {
              triggerHaptic();
              setIsFaqModalVisible(true);
            }}
          >
            <View style={styles.settingIconWrap}>
              <Feather name="help-circle" size={20} color={themeColors.text} />
              <Text style={[styles.settingLabel, { color: themeColors.text }]}>{t("profileSettingFaq")}</Text>
            </View>
            <Feather name="chevron-right" size={20} color={themeColors.textMuted} />
          </Pressable>

          <View style={[styles.expenseDivider, { backgroundColor: themeColors.border }]} />

          <Pressable 
            style={({ pressed }) => [styles.settingRow, pressed && styles.pressed]}
            onPress={() => {
              triggerHaptic();
              setIsAboutModalVisible(true);
            }}
          >
            <View style={styles.settingIconWrap}>
              <Feather name="info" size={20} color={themeColors.text} />
              <Text style={[styles.settingLabel, { color: themeColors.text }]}>{t("profileSettingAbout")}</Text>
            </View>
            <Feather name="chevron-right" size={20} color={themeColors.textMuted} />
          </Pressable>
        </View>

        {/* Danger Zone Card */}
        <View style={[styles.profileCard, { backgroundColor: themeColors.surface, borderColor: themeColors.danger, borderWidth: 1.5, flexDirection: "column", paddingVertical: 8, marginTop: 14 }]}>
          <Pressable 
            style={({ pressed }) => [styles.settingRow, pressed && styles.pressed]}
            onPress={() => {
              triggerHaptic();
              setIsResetConfirmVisible(true);
            }}
          >
            <View style={styles.settingIconWrap}>
              <Feather name="trash-2" size={20} color={themeColors.danger} />
              <Text style={[styles.settingLabel, { color: themeColors.danger }]}>{t("profileSettingReset")}</Text>
            </View>
            <Feather name="chevron-right" size={20} color={themeColors.danger} />
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: themeColors.background }]}>
      <View style={[styles.screen, { backgroundColor: themeColors.background }]}>
        <View style={styles.content}>
          {currentTab === "home" && renderHomeTab()}
          {currentTab === "analysis" && renderAnalysisTab()}
          {currentTab === "profile" && renderProfileTab()}
        </View>

        <View style={[styles.tabBar, { backgroundColor: isDarkMode ? "rgba(20,30,27,0.96)" : "rgba(255,254,250,0.96)", borderColor: themeColors.border }]}>
          <TabItem 
            icon="home" 
            label={language === "tr" ? "Ana sayfa" : "Home"} 
            active={currentTab === "home"} 
            onPress={() => { triggerHaptic(); setCurrentTab("home"); }} 
          />
          <TabItem 
            icon="pie-chart" 
            label={language === "tr" ? "Analiz" : "Analysis"} 
            active={currentTab === "analysis"} 
            onPress={() => { triggerHaptic(); setCurrentTab("analysis"); }} 
          />
          <TabItem 
            icon="user" 
            label={language === "tr" ? "Profil" : "Profile"} 
            active={currentTab === "profile"} 
            onPress={() => { triggerHaptic(); setCurrentTab("profile"); }} 
          />
        </View>

        <VoiceExpenseSheet
          visible={isSheetVisible}
          onClose={() => setIsSheetVisible(false)}
          onSave={(expense) => {
            addExpense(expense);
            setIsSheetVisible(false);
            
            const wouldExceed = expense.amount > selectedPeriodRemaining;
            if (wouldExceed) {
              if (isHapticsEnabled) {
                Vibration.vibrate([0, 50, 80, 50]);
              }
            } else {
              triggerHaptic();
            }

            setToastConfig({
              visible: true,
              message: wouldExceed 
                ? (language === "tr" ? "Limit Aşıldı! ⚠️" : "Limit Exceeded! ⚠️")
                : `${formatCurrency(expense.amount)} ${t("toastAdded")}`,
              subtext: wouldExceed
                ? (language === "tr" ? `${expense.label} bütçe sınırınızı aştı.` : `${expense.label} went over your budget limit.`)
                : `${expense.label} ${t("toastAddedSub")}`,
              type: wouldExceed ? "warning" : "success"
            });
          }}
          draftTranscript={draftTranscript}
          setDraftTranscript={setDraftTranscript}
        />

        <NotificationsModal
          visible={isNotificationsVisible}
          onClose={() => setIsNotificationsVisible(false)}
          notifications={notifications}
        />

        <CategoryLimitsModal
          visible={isCategoryLimitsModalVisible}
          onClose={() => setIsCategoryLimitsModalVisible(false)}
          categoryLimits={categoryLimits}
          setCategoryLimit={setCategoryLimit}
        />

        <SavingsGoalEditModal
          visible={isGoalModalVisible}
          onClose={() => setIsGoalModalVisible(false)}
          title={tempGoalTitle}
          setTitle={setTempGoalTitle}
          targetAmount={tempGoalTarget}
          setTargetAmount={setTempGoalTarget}
          currentAmount={tempGoalSaved}
          setCurrentAmount={setTempGoalSaved}
          onSave={() => {
            const parsedTarget = parseAmount(tempGoalTarget);
            const parsedSaved = parseAmount(tempGoalSaved);
            setSavingsGoal({
              ...savingsGoal,
              title: tempGoalTitle.trim() || "Birikim Hedefi",
              selectedGoal: tempGoalTitle.trim() || "Birikim Hedefi",
              targetAmount: parsedTarget,
              currentAmount: parsedSaved,
              monthlyContribution: Math.min(savingsGoal.monthlyContribution, Math.max(parsedTarget - parsedSaved, 0))
            });
            setIsGoalModalVisible(false);
          }}
        />

        <AboutModal
          visible={isAboutModalVisible}
          onClose={() => setIsAboutModalVisible(false)}
        />

        <FaqModal
          visible={isFaqModalVisible}
          onClose={() => setIsFaqModalVisible(false)}
        />

        <ResetConfirmModal
          visible={isResetConfirmVisible}
          onClose={() => setIsResetConfirmVisible(false)}
          onConfirm={() => {
            triggerHaptic();
            // Clear variable expenses
            setExpenses([]);
            // Clear incomes
            setIncomes([
              { id: "salary", label: "Maaş", amount: 0, period: "monthly" },
              { id: "freelance", label: "Freelance", amount: 0, period: "monthly" },
              { id: "extra", label: "Ek gelir", amount: 0, period: "monthly" }
            ]);
            // Clear savings goal
            setSavingsGoal({
              title: "Acil durum",
              selectedGoal: "Acil durum",
              targetAmount: 0,
              currentAmount: 0,
              monthlyContribution: 0,
              dailyTarget: 0,
              planStartDate: new Date().toISOString()
            });
            setIsResetConfirmVisible(false);
            setToastConfig({
              visible: true,
              message: t("resetToastMessage"),
              subtext: t("resetToastSub")
            });
          }}
        />

        {/* Siri Direct Voice Overlay */}
        {isDirectVoiceActive && (
          <Animated.View style={[styles.directVoiceOverlay, { opacity: overlayOpacity }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setIsDirectVoiceActive(false)} />
            <View style={styles.directVoiceContent}>
              <Text style={styles.directVoiceTitle}>{t("siriListening")}</Text>
              <Text style={styles.directVoiceSubtitle}>{t("siriSubtitle")}</Text>
              
              <View style={styles.directVoiceTranscriptBox}>
                <Text style={styles.directVoiceTranscriptText}>
                  {voiceTranscript || t("siriPlaceholder")}
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
            type={toastConfig.type}
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
  const isDarkMode = useFinanceStore((state) => state.isDarkMode);
  const themeColors = isDarkMode ? darkColors : lightColors;
  const language = useFinanceStore((state) => state.language);
  const t = (key: keyof typeof translations["tr"]) => translations[language][key] || key;

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
          <Text style={styles.sheetTitle}>{t("sheetTitle")}</Text>
          <Text style={styles.sheetSubtitle}>{t("sheetSubtitle")}</Text>

          <View style={styles.speechBubbleContainer}>
            <TextInput
              value={transcript}
              onChangeText={setTranscript}
              placeholder={isListening ? t("sheetListening") : t("sheetInputPlaceholder")}
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
                  {error || (permissionStatus === "unsupported" ? t("sheetHelperTextUnsupported") : t("sheetHelperTextVoice"))}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.formGroup}>
            <View style={styles.formRow}>
              <Text style={styles.formLabel}>{t("sheetLabelAmount")}</Text>
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
              <Text style={styles.formLabel}>{t("sheetLabelCategory")}</Text>
              <TextInput
                value={category}
                onChangeText={setCategory}
                placeholder={t("sheetCategoryPlaceholder")}
                placeholderTextColor="#9CA19E"
                style={styles.formInput}
              />
            </View>
            <View style={styles.formDivider} />
            <View style={styles.formRow}>
              <Text style={styles.formLabel}>{t("sheetLabelNote")}</Text>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder={t("sheetNotePlaceholder")}
                placeholderTextColor="#9CA19E"
                style={styles.formInput}
              />
            </View>
          </View>

          <View style={styles.sheetActions}>
            <Pressable style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]} onPress={closeSheet}>
              <Text style={styles.cancelButtonText}>{t("sheetCancelBtn")}</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]} onPress={saveExpense}>
              <Text style={styles.saveButtonText}>{t("sheetSaveBtn")}</Text>
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
  type = "success",
  onHide
}: {
  message: string;
  subtext?: string;
  type?: "success" | "warning";
  onHide: () => void;
}) {
  const isDarkMode = useFinanceStore((state) => state.isDarkMode);
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(slideAnim, { toValue: 50, duration: 400, useNativeDriver: true }),
      Animated.delay(2400),
      Animated.timing(slideAnim, { toValue: -100, duration: 300, useNativeDriver: true })
    ]).start(() => onHide());
  }, [slideAnim]);

  const isWarning = type === "warning";
  const bg = isWarning 
    ? (isDarkMode ? "#2D1917" : "#FDF2F2") 
    : (isDarkMode ? "#172E26" : "#E8F5E9");
  
  const border = isWarning 
    ? "rgba(211, 47, 47, 0.4)" 
    : "rgba(46, 125, 50, 0.3)";
  
  const text = isWarning ? "#D32F2F" : (isDarkMode ? "#FFFFFF" : "#1B5E20");
  const subtextCol = isWarning ? "rgba(211, 47, 47, 0.7)" : (isDarkMode ? "rgba(255, 255, 255, 0.7)" : "#2E7D32");

  return (
    <Animated.View style={[
      styles.toastCapsule, 
      { 
        transform: [{ translateY: slideAnim }],
        backgroundColor: bg,
        borderColor: border,
        borderWidth: 1
      }
    ]}>
      <View style={[
        styles.toastCheckmark, 
        { backgroundColor: isWarning ? "#D32F2F" : "#2E7D32" }
      ]}>
        <Feather name={isWarning ? "alert-triangle" : "check"} size={16} color={colors.white} />
      </View>
      <View style={styles.toastCopy}>
        <Text style={[styles.toastMessage, { color: text }]}>{message}</Text>
        {subtext && <Text style={[styles.toastSubtext, { color: subtextCol }]}>{subtext}</Text>}
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
  const isDarkMode = useFinanceStore((state) => state.isDarkMode);
  const themeColors = isDarkMode ? darkColors : lightColors;
  
  const isNegative = title.toLowerCase().includes("kalan") || title.toLowerCase().includes("remaining") ? amount < 0 : false;
  
  let tint = tone === "green" ? themeColors.primary : "#DF7A12";
  let activeIcon = icon;
  
  if (isNegative) {
    tint = "#D32F2F"; // Red alarm!
    activeIcon = "alert-triangle"; // Warning icon
  }
  
  return (
    <View style={styles.metric}>
      <View style={[
        styles.metricIcon, 
        tone === "orange" && styles.metricIconOrange, 
        isDarkMode && { backgroundColor: "rgba(255,255,255,0.06)" },
        isNegative && { backgroundColor: "rgba(211, 47, 47, 0.08)" }
      ]}>
        <Feather name={activeIcon} size={20} color={tint} />
      </View>
      <Text style={[styles.metricTitle, { color: themeColors.textMuted }]}>{title}</Text>
      <Text style={[styles.metricAmount, { color: tint, fontWeight: isNegative ? "900" : "800" }]} numberOfLines={1} adjustsFontSizeToFit>
        {formatCurrency(amount)}
      </Text>
    </View>
  );
}

function TabItem({ 
  icon, 
  label, 
  active = false,
  onPress
}: { 
  icon: keyof typeof Feather.glyphMap; 
  label: string; 
  active?: boolean;
  onPress: () => void;
}) {
  const isDarkMode = useFinanceStore((state) => state.isDarkMode);
  const themeColors = isDarkMode ? darkColors : lightColors;
  return (
    <Pressable style={styles.tabItem} onPress={onPress}>
      <View style={{ alignItems: "center", justifyContent: "center", gap: 3, paddingVertical: 4 }}>
        <Feather name={icon} size={20} color={active ? themeColors.primary : themeColors.textMuted} />
        <Text style={[styles.tabLabel, { 
          color: active ? themeColors.text : themeColors.textMuted, 
          fontWeight: active ? "900" : "600",
          fontSize: 10.5,
          letterSpacing: 0.2
        }]}>
          {label}
        </Text>
        {active && (
          <View style={{
            width: 5,
            height: 5,
            borderRadius: 2.5,
            backgroundColor: themeColors.primary,
            marginTop: 1,
            shadowColor: themeColors.primary,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.4,
            shadowRadius: 3,
            elevation: 2
          }} />
        )}
      </View>
    </Pressable>
  );
}

function getProgress(value: number, limit: number) {
  if (limit <= 0) {
    return 0;
  }

  return Math.min(Math.max(value / limit, 0), 1);
}

function getCategoryKey(category?: string): string {
  if (!category) return "other";
  const normalized = category.toLowerCase().trim();
  if (normalized.includes("market") || normalized.includes("supermarket")) return "market";
  if (normalized.includes("sağlık") || normalized.includes("health") || normalized.includes("eczane") || normalized.includes("ilaç") || normalized.includes("ilac")) return "health";
  if (normalized.includes("ulaşım") || normalized.includes("transit") || normalized.includes("taksi") || normalized.includes("araç") || normalized.includes("arac") || normalized.includes("lastik")) return "transport";
  if (normalized.includes("yemek") || normalized.includes("dining") || normalized.includes("restoran") || normalized.includes("cafe") || normalized.includes("kahve")) return "dining";
  if (normalized.includes("giyim") || normalized.includes("clothing") || normalized.includes("moda") || normalized.includes("pantolon")) return "clothing";
  if (normalized.includes("eğlence") || normalized.includes("entertainment") || normalized.includes("sosyal") || normalized.includes("netflix") || normalized.includes("sinema")) return "entertainment";
  return "other";
}

function getCategoryIconConfig(category?: string): { name: keyof typeof Feather.glyphMap; bg: string; color: string } {
  const key = getCategoryKey(category);
  switch (key) {
    case "market":
      return { name: "shopping-cart", bg: "rgba(0, 229, 143, 0.08)", color: "#00B26F" };
    case "dining":
      return { name: "coffee", bg: "rgba(239, 122, 18, 0.08)", color: "#DF7A12" };
    case "transport":
      return { name: "truck", bg: "rgba(59, 130, 246, 0.08)", color: "#2563EB" };
    case "clothing":
      return { name: "tag", bg: "rgba(139, 92, 246, 0.08)", color: "#7C3AED" };
    case "entertainment":
      return { name: "film", bg: "rgba(236, 72, 153, 0.08)", color: "#DB2777" };
    case "health":
      return { name: "activity", bg: "rgba(239, 68, 68, 0.08)", color: "#DC2626" };
    default:
      return { name: "help-circle", bg: "rgba(107, 114, 128, 0.08)", color: "#5B6570" };
  }
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

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  time: string;
  type: "warning" | "info" | "success";
  icon: keyof typeof Feather.glyphMap;
};

function NotificationsModal({
  visible,
  onClose,
  notifications
}: {
  visible: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
}) {
  const isDarkMode = useFinanceStore((state) => state.isDarkMode);
  const themeColors = isDarkMode ? darkColors : lightColors;
  const language = useFinanceStore((state) => state.language);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.sheetKeyboardView}>
        <Pressable style={styles.sheetBackdrop} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: themeColors.surface, borderColor: themeColors.border, minHeight: 380, maxHeight: "80%" }]}>
          <View style={styles.sheetHandle} />
          
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%", marginBottom: 12 }}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={[styles.sheetTitle, { color: themeColors.primary }]}>
                {language === "tr" ? "Bildirim Merkezi" : "Notification Center"}
              </Text>
              <Text style={[styles.sheetSubtitle, { color: themeColors.textMuted }]}>
                {language === "tr" ? "Bütçe alarmları ve akıllı finansal ipuçları" : "Budget alarms and AI insights"}
              </Text>
            </View>
            <Pressable 
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                alignItems: "center",
                justifyContent: "center"
              }}
              onPress={onClose}
            >
              <Feather name="x" size={16} color={themeColors.text} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingVertical: 8 }}>
            {notifications.length === 0 ? (
              <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 40, gap: 12 }}>
                <Feather name="bell-off" size={40} color={themeColors.textMuted} />
                <Text style={{ fontSize: 14, color: themeColors.text, fontWeight: "700" }}>
                  {language === "tr" ? "Yeni bildirim yok" : "No new notifications"}
                </Text>
              </View>
            ) : (
              notifications.map((item) => {
                const isWarning = item.type === "warning";
                const isSuccess = item.type === "success";
                
                const tint = isWarning 
                  ? "#D32F2F" 
                  : (isSuccess ? themeColors.primary : "#DF7A12");
                
                const bg = isWarning 
                  ? (isDarkMode ? "rgba(211, 47, 47, 0.08)" : "#FDF2F2")
                  : (isSuccess 
                      ? (isDarkMode ? "rgba(0, 223, 137, 0.08)" : "#E8F5E9")
                      : (isDarkMode ? "rgba(223, 122, 18, 0.08)" : "#FFF3E0"));

                return (
                  <View 
                    key={item.id} 
                    style={{ 
                      flexDirection: "row", 
                      backgroundColor: bg, 
                      borderRadius: 18, 
                      padding: 14, 
                      alignItems: "flex-start",
                      borderWidth: 1,
                      borderColor: isDarkMode ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)"
                    }}
                  >
                    <View style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.6)",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 12,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.02,
                      shadowRadius: 2,
                      elevation: 1
                    }}>
                      <Feather name={item.icon} size={18} color={tint} />
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                        <Text style={{ fontSize: 13, fontWeight: "900", color: themeColors.text }}>
                          {item.title}
                        </Text>
                        <Text style={{ fontSize: 10, color: themeColors.textMuted, fontWeight: "600" }}>
                          {item.time}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 12, color: themeColors.text, lineHeight: 17, fontWeight: "600", marginTop: 2 }}>
                        {item.body}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function CategoryLimitsModal({
  visible,
  onClose,
  categoryLimits,
  setCategoryLimit
}: {
  visible: boolean;
  onClose: () => void;
  categoryLimits: Record<string, number>;
  setCategoryLimit: (key: string, amount: number) => void;
}) {
  const isDarkMode = useFinanceStore((state) => state.isDarkMode);
  const themeColors = isDarkMode ? darkColors : lightColors;
  const language = useFinanceStore((state) => state.language);
  const currency = useFinanceStore((state) => state.currency);
  
  const t = (key: keyof typeof translations["tr"]) => translations[language][key] || key;

  const categories = [
    { key: "market", label: language === "tr" ? "Market" : "Supermarket", icon: "shopping-cart" },
    { key: "dining", label: language === "tr" ? "Yemek" : "Dining / Cafe", icon: "coffee" },
    { key: "transport", label: language === "tr" ? "Ulaşım" : "Transit / Car", icon: "truck" },
    { key: "clothing", label: language === "tr" ? "Giyim" : "Clothing / Fashion", icon: "tag" },
    { key: "entertainment", label: language === "tr" ? "Eğlence" : "Leisure / Social", icon: "film" },
    { key: "health", label: language === "tr" ? "Sağlık" : "Health / Medical", icon: "activity" },
    { key: "other", label: language === "tr" ? "Diğer" : "Other / General", icon: "help-circle" }
  ];

  const [localLimits, setLocalLimits] = useState<Record<string, string>>({});

  useEffect(() => {
    if (visible) {
      const initial: Record<string, string> = {};
      categories.forEach((cat) => {
        const val = categoryLimits[cat.key];
        initial[cat.key] = val && val > 0 ? String(val) : "";
      });
      setLocalLimits(initial);
    }
  }, [visible, categoryLimits]);

  const handleSave = () => {
    categories.forEach((cat) => {
      const rawVal = localLimits[cat.key] || "";
      const parsed = parseAmount(rawVal);
      setCategoryLimit(cat.key, parsed);
    });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.sheetKeyboardView}>
        <Pressable style={styles.sheetBackdrop} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: themeColors.surface, borderColor: themeColors.border, minHeight: 460, maxHeight: "90%" }]}>
          <View style={styles.sheetHandle} />
          
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%", marginBottom: 12 }}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={[styles.sheetTitle, { color: themeColors.primary }]}>
                {language === "tr" ? "Kategori Limitleri" : "Category Limits"}
              </Text>
              <Text style={[styles.sheetSubtitle, { color: themeColors.textMuted }]}>
                {language === "tr" ? "Kategorilere özel aylık harcama limitleri tanımlayın." : "Define specific monthly budget limits per category."}
              </Text>
            </View>
            <Pressable 
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                alignItems: "center",
                justifyContent: "center"
              }}
              onPress={onClose}
            >
              <Feather name="x" size={16} color={themeColors.text} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingBottom: 16 }}>
            <View style={[styles.formGroup, { backgroundColor: themeColors.surface, borderColor: themeColors.border, gap: 10, paddingVertical: 10 }]}>
              {categories.map((cat, idx) => (
                <View key={cat.key}>
                  <View style={[styles.formRow, { height: 48 }]}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <Feather name={cat.icon as any} size={18} color={themeColors.textMuted} />
                      <Text style={[styles.formLabel, { color: themeColors.text, fontWeight: "700" }]}>{cat.label}</Text>
                    </View>
                    <TextInput
                      value={localLimits[cat.key] || ""}
                      onChangeText={(txt) => setLocalLimits(prev => ({ ...prev, [cat.key]: txt }))}
                      keyboardType="decimal-pad"
                      placeholder="Limitsiz"
                      placeholderTextColor="#9CA19E"
                      style={[styles.formInput, { color: themeColors.text, fontWeight: "700", textAlign: "right", flex: 1, height: 40 }]}
                    />
                  </View>
                  {idx < categories.length - 1 && <View style={[styles.formDivider, { backgroundColor: themeColors.border }]} />}
                </View>
              ))}
            </View>
          </ScrollView>

          <View style={[styles.sheetActions, { marginTop: 10 }]}>
            <Pressable style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]} onPress={onClose}>
              <Text style={styles.cancelButtonText}>{t("sheetCancelBtn")}</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]} onPress={handleSave}>
              <Text style={styles.saveButtonText}>{t("sheetSaveBtn")}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function SavingsGoalEditModal({
  visible,
  onClose,
  title,
  setTitle,
  targetAmount,
  setTargetAmount,
  currentAmount,
  setCurrentAmount,
  onSave
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  setTitle: (val: string) => void;
  targetAmount: string;
  setTargetAmount: (val: string) => void;
  currentAmount: string;
  setCurrentAmount: (val: string) => void;
  onSave: () => void;
}) {
  const isDarkMode = useFinanceStore((state) => state.isDarkMode);
  const themeColors = isDarkMode ? darkColors : lightColors;
  const language = useFinanceStore((state) => state.language);
  const t = (key: keyof typeof translations["tr"]) => translations[language][key] || key;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.sheetKeyboardView}>
        <Pressable style={styles.sheetBackdrop} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <View style={styles.sheetHandle} />
          <Text style={[styles.sheetTitle, { color: themeColors.primary }]}>{t("editGoalHeader")}</Text>
          <Text style={[styles.sheetSubtitle, { color: themeColors.textMuted }]}>{t("editGoalSub")}</Text>

          <View style={[styles.formGroup, { backgroundColor: themeColors.surface, borderColor: themeColors.border, marginTop: 20 }]}>
            <View style={styles.formRow}>
              <Text style={[styles.formLabel, { color: themeColors.textMuted }]}>{t("editGoalTargetLabel")}</Text>
              <TextInput
                value={targetAmount}
                onChangeText={setTargetAmount}
                keyboardType="decimal-pad"
                placeholder="0,00"
                placeholderTextColor="#9CA19E"
                style={[styles.formInput, { color: themeColors.text, fontWeight: "700" }]}
              />
            </View>
            <View style={[styles.formDivider, { backgroundColor: themeColors.border }]} />
            <View style={styles.formRow}>
              <Text style={[styles.formLabel, { color: themeColors.textMuted }]}>{t("editGoalSavedLabel")}</Text>
              <TextInput
                value={currentAmount}
                onChangeText={setCurrentAmount}
                keyboardType="decimal-pad"
                placeholder="0,00"
                placeholderTextColor="#9CA19E"
                style={[styles.formInput, { color: themeColors.text, fontWeight: "700" }]}
              />
            </View>
          </View>

          <View style={styles.sheetActions}>
            <Pressable style={({ pressed }) => [styles.cancelButton, { backgroundColor: isDarkMode ? "rgba(255,255,255,0.06)" : "#EFE8DD" }, pressed && styles.pressed]} onPress={onClose}>
              <Text style={[styles.cancelButtonText, { color: themeColors.text }]}>{t("cancel")}</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]} onPress={onSave}>
              <Text style={styles.saveButtonText}>{t("save")}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function AboutModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const isDarkMode = useFinanceStore((state) => state.isDarkMode);
  const themeColors = isDarkMode ? darkColors : lightColors;
  const language = useFinanceStore((state) => state.language);
  const t = (key: keyof typeof translations["tr"]) => translations[language][key] || key;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.sheetBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.dialogBox, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <View style={[styles.dialogAvatar, { backgroundColor: themeColors.primary }]}>
            <Text style={{ fontSize: 32 }}>🐷</Text>
          </View>
          <Text style={[styles.dialogTitle, { color: themeColors.text }]}>{t("aboutTitle")}</Text>
          <Text style={[styles.dialogVersion, { color: themeColors.textMuted }]}>{t("aboutVersion")}</Text>
          <Text style={[styles.dialogBody, { color: themeColors.text }]}>{t("aboutBody")}</Text>
          <Pressable style={({ pressed }) => [styles.dialogButton, pressed && styles.pressed]} onPress={onClose}>
            <Text style={styles.dialogButtonText}>{t("close")}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function FaqModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const isDarkMode = useFinanceStore((state) => state.isDarkMode);
  const themeColors = isDarkMode ? darkColors : lightColors;
  const language = useFinanceStore((state) => state.language);
  const t = (key: keyof typeof translations["tr"]) => translations[language][key] || key;

  const faqs = language === "tr" ? [
    { q: "Sesli harcama ekleme nasıl çalışır?", a: "Anasayfadaki 'Sesli Ekle' butonuna basıp '150 lira market' gibi doğal bir cümle kurduğunuzda, yapay zeka tutarı ve kategoriyi otomatik ayrıştırır." },
    { q: "Verilerim güvende mi?", a: "Tüm finansal verileriniz ve bütçe planlarınız tamamen cihazınızda (yerel depolamada) saklanır. Dışarıya hiçbir veri aktarılmaz." },
    { q: "Limitler nasıl hesaplanıyor?", a: "Aylık gelirinizden sabit giderlerinizi ve hedef birikim miktarınızı çıkarttıktan sonra kalan bütçeyi gün/hafta/ay bazında bölerek harcama limitlerinizi hesaplar." }
  ] : [
    { q: "How does voice expense input work?", a: "When you tap the 'Voice Add' button and speak naturally like '150 dollars grocery', the AI automatically parses the amount and category." },
    { q: "Is my data secure?", a: "All your financial data and budget plans are stored entirely on your device (local storage). No data is transmitted externally." },
    { q: "How are limits calculated?", a: "After deducting your monthly fixed expenses and target savings goal from your monthly income, it divides the remaining budget to determine daily, weekly, and monthly limit thresholds." }
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.sheetKeyboardView}>
        <Pressable style={styles.sheetBackdrop} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: themeColors.surface, borderColor: themeColors.border, minHeight: 450 }]}>
          <View style={styles.sheetHandle} />
          <Text style={[styles.sheetTitle, { color: themeColors.primary }]}>{t("faqTitle")}</Text>
          <Text style={[styles.sheetSubtitle, { color: themeColors.textMuted }]}>{t("faqSubtitle")}</Text>
          
          <View style={{ gap: 14, marginTop: 20 }}>
            {faqs.map((faq, index) => (
              <View key={index} style={[styles.faqBox, { backgroundColor: isDarkMode ? "rgba(255,255,255,0.03)" : "rgba(13,50,40,0.02)", borderColor: themeColors.border }]}>
                <Text style={[styles.faqQuestion, { color: themeColors.text }]}>💡 {faq.q}</Text>
                <Text style={[styles.faqAnswer, { color: themeColors.textMuted }]}>{faq.a}</Text>
              </View>
            ))}
          </View>

          <Pressable style={({ pressed }) => [styles.cancelButton, { width: "100%", marginTop: 24, backgroundColor: isDarkMode ? "rgba(255,255,255,0.06)" : "#EFE8DD" }, pressed && styles.pressed]} onPress={onClose}>
            <Text style={[styles.cancelButtonText, { color: themeColors.text }]}>{t("close")}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function ResetConfirmModal({ visible, onClose, onConfirm }: { visible: boolean; onClose: () => void; onConfirm: () => void }) {
  const isDarkMode = useFinanceStore((state) => state.isDarkMode);
  const themeColors = isDarkMode ? darkColors : lightColors;
  const language = useFinanceStore((state) => state.language);
  const t = (key: keyof typeof translations["tr"]) => translations[language][key] || key;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.sheetBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.dialogBox, { backgroundColor: themeColors.surface, borderColor: themeColors.danger, borderWidth: 1.5 }]}>
          <View style={[styles.dialogAvatar, { backgroundColor: "#FFCDD2" }]}>
            <Feather name="alert-triangle" size={28} color="#D32F2F" />
          </View>
          <Text style={[styles.dialogTitle, { color: themeColors.danger }]}>{t("resetTitle")}</Text>
          <Text style={[styles.dialogBody, { color: themeColors.text, textAlign: "center" }]}>{t("resetBody")}</Text>
          <View style={styles.dialogActions}>
            <Pressable style={({ pressed }) => [styles.dialogCancelButton, pressed && styles.pressed]} onPress={onClose}>
              <Text style={[styles.dialogCancelText, { color: themeColors.text }]}>{t("resetCancel")}</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.dialogConfirmButton, pressed && styles.pressed]} onPress={onConfirm}>
              <Text style={styles.dialogConfirmText}>{t("resetConfirm")}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
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
    opacity: 0.85,
    transform: [{ scale: 0.96 }]
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
  mascotSpeechBubbleWrapper: {
    position: "absolute",
    left: -20,
    right: -20,
    top: -26,
    alignItems: "center",
    zIndex: 20
  },
  mascotSpeechBubble: {
    backgroundColor: "#D32F2F",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
    elevation: 4
  },
  mascotSpeechBubbleText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900"
  },
  speechBubbleArrow: {
    position: "absolute",
    bottom: -6,
    alignSelf: "center",
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#D32F2F"
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
    backgroundColor: "rgba(4, 9, 7, 0.97)",
    zIndex: 99999,
    justifyContent: "center",
    alignItems: "center"
  },
  directVoiceContent: {
    width: "85%",
    alignItems: "center"
  },
  directVoiceTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: -0.5
  },
  directVoiceSubtitle: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.5)",
    textAlign: "center"
  },
  directVoiceTranscriptBox: {
    marginTop: 40,
    minHeight: 130,
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 28,
    borderWidth: 1.2,
    borderColor: "rgba(255, 255, 255, 0.06)",
    padding: 24,
    justifyContent: "center",
    alignItems: "center"
  },
  directVoiceTranscriptText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 28
  },
  directVoiceWaveWrap: {
    height: 48,
    marginTop: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8
  },
  directVoiceWaveBar: {
    width: 6,
    height: 36,
    borderRadius: 3,
    backgroundColor: "#00E58F"
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
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
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
  },
  tabContentContainer: {
    flex: 1
  },
  // Analysis Styles
  analysisCard: {
    marginTop: 16,
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2
  },
  analysisCardTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 20
  },
  chartRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 140,
    paddingHorizontal: 8
  },
  chartCol: {
    alignItems: "center",
    flex: 1
  },
  chartBarTrack: {
    width: 16,
    height: 100,
    borderRadius: 8,
    justifyContent: "flex-end",
    overflow: "hidden"
  },
  chartBarFill: {
    width: "100%",
    borderRadius: 8
  },
  chartBarLabel: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: "700"
  },
  categoryRow: {
    width: "100%"
  },
  categoryInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6
  },
  categoryName: {
    fontSize: 14,
    fontWeight: "700"
  },
  categoryAmount: {
    fontSize: 13,
    fontWeight: "600"
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    width: "100%",
    overflow: "hidden"
  },
  progressFill: {
    height: "100%",
    borderRadius: 4
  },
  // Profile Styles
  profileAvatarHeader: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2
  },
  profileAvatarHeaderText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "900"
  },
  profileCardCompact: {
    marginTop: 16,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1
  },
  profileBudgetCol: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  profileVerticalDivider: {
    width: 1,
    height: "90%",
    alignSelf: "center",
    marginHorizontal: 12
  },
  profileMiniBtn: {
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center"
  },
  profileMiniBtnText: {
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 14
  },
  profileBudgetLabelCompact: {
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 16
  },
  profileBudgetValCompact: {
    fontSize: 16,
    fontWeight: "900",
    marginTop: 2,
    lineHeight: 21
  },
  profileCard: {
    marginTop: 16,
    borderRadius: 24,
    borderWidth: 1,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2
  },
  profileAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: "center",
    alignItems: "center"
  },
  profileAvatarText: {
    color: colors.white,
    fontSize: 22,
    fontWeight: "900"
  },
  profileMeta: {
    marginLeft: 16
  },
  profileName: {
    fontSize: 18,
    fontWeight: "900"
  },
  profileEmail: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2
  },
  profileCardTitle: {
    fontSize: 15,
    fontWeight: "800",
    alignSelf: "flex-start",
    marginBottom: 6
  },
  profileBudgetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingVertical: 4
  },
  profileBudgetLabel: {
    fontSize: 14,
    fontWeight: "600"
  },
  profileBudgetVal: {
    fontSize: 15
  },
  profileEditButton: {
    marginTop: 6,
    width: "100%",
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center"
  },
  profileEditButtonText: {
    fontSize: 14,
    fontWeight: "800"
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingVertical: 10,
    paddingHorizontal: 6
  },
  settingIconWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: "700"
  },
  segmentContainer: {
    flexDirection: "row",
    marginTop: 14,
    borderRadius: 14,
    padding: 3,
    gap: 4
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center"
  },
  segmentButtonActive: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1
  },
  segmentText: {
    fontSize: 13,
    fontWeight: "800"
  },
  profileSubActionButtonText: {
    fontSize: 13,
    fontWeight: "800"
  },
  insightCard: {
    marginTop: 16,
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    gap: 6
  },
  insightHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: "900"
  },
  insightBody: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "600"
  },
  profileActionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    gap: 12,
    marginTop: 8
  },
  profileSubActionButton: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(13,50,40,0.04)",
    justifyContent: "center",
    alignItems: "center"
  },
  // Dialog (About / Confirm) Styles
  dialogBox: {
    width: "84%",
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8
  },
  dialogAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16
  },
  dialogTitle: {
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center"
  },
  dialogVersion: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
    marginBottom: 16
  },
  dialogBody: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 24
  },
  dialogButton: {
    width: "100%",
    height: 48,
    borderRadius: 14,
    backgroundColor: "#0D3228", // colors.primary literal
    justifyContent: "center",
    alignItems: "center"
  },
  dialogButtonText: {
    color: "#FFFFFF", // colors.white literal
    fontSize: 15,
    fontWeight: "800"
  },
  dialogActions: {
    flexDirection: "row",
    gap: 12,
    width: "100%"
  },
  dialogCancelButton: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.05)",
    justifyContent: "center",
    alignItems: "center"
  },
  dialogCancelText: {
    fontSize: 14,
    fontWeight: "800"
  },
  dialogConfirmButton: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#D32F2F",
    justifyContent: "center",
    alignItems: "center"
  },
  dialogConfirmText: {
    color: "#FFFFFF", // colors.white literal
    fontSize: 14,
    fontWeight: "800"
  },
  // FAQ styles
  faqBox: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    gap: 4
  },
  faqQuestion: {
    fontSize: 13,
    fontWeight: "800"
  },
  faqAnswer: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "600"
  },
  // Card Segment Header Styles
  cardSegmentHeader: {
    flexDirection: "row",
    padding: 5,
    borderBottomWidth: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    gap: 4
  },
  cardSegmentItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 18,
    gap: 6
  },
  cardSegmentActive: {
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2
  },
  cardSegmentText: {
    fontSize: 13,
    fontWeight: "900",
    lineHeight: 18
  }
});
