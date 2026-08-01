import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { router } from "expo-router";
import {
  Alert,
  Animated,
  AppState,
  FlatList,
  Image,
  InputAccessoryView,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  PanResponder,
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
import Svg, { Circle, Path } from "react-native-svg";

import { useVoiceExpenseInput } from "@/hooks/useVoiceExpenseInput";
import { Expense, GoalItem, Period } from "@/models/finance";
import { signOutUser } from "@/utils/supabaseAuth";
import { useFinanceStore } from "@/store/financeStore";
import { ParsedVoiceExpense, parseTurkishExpense } from "@/utils/voiceExpense";
import { colors, radius, lightColors, darkColors } from "@/theme";
import { formatAmountInput, formatCurrency, parseAmount } from "@/utils/currency";
import { getExpensesForPeriod, getSimulatedDate, getDynamicDailyLimit, getRevisedSavingsStatus, getSpendableMonthlyBudget, getExpensesTotalForPeriod, toSafeAmount, getDailyLimit, isExpenseInPeriod, getExpensePlanWeekIndex } from "@/utils/finance";
import { moderateScale, verticalScale } from "@/utils/responsive";
import { translations } from "@/utils/translations";
import { syncSiriExpenses } from "@/utils/siriSync";
import { syncWidgetData } from "@/utils/widgetSync";

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
  const incomes = useFinanceStore((state) => state.incomes);
  const setIncomes = useFinanceStore((state) => state.setIncomes);
  const setFixedExpenses = useFinanceStore((state) => state.setFixedExpenses);
  const deleteExpense = useFinanceStore((state) => state.deleteExpense);
  const fixedExpenses = useMemo(() => expenses.filter((e) => e.isFixed), [expenses]);
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
  const isSmartNotificationsEnabled = useFinanceStore((state) => state.isSmartNotificationsEnabled);
  const setIsSmartNotificationsEnabled = useFinanceStore((state) => state.setIsSmartNotificationsEnabled);
  const monthlyArchives = useFinanceStore((state) => state.monthlyArchives);
  const addMonthlyArchiveRecord = useFinanceStore((state) => state.addMonthlyArchiveRecord);
  const getRemainingLimitForPeriod = useFinanceStore((state) => state.getRemainingLimitForPeriod);
  const simulatedDateOffsetDays = useFinanceStore((state) => state.simulatedDateOffsetDays);
  const fetchExchangeRates = useFinanceStore((state) => state.fetchExchangeRates);
  const lastRatesUpdated = useFinanceStore((state) => state.lastRatesUpdated);
  const exchangeRates = useFinanceStore((state) => state.exchangeRates);
  const userProfile = useFinanceStore((state) => state.userProfile);
  const setUserProfile = useFinanceStore((state) => state.setUserProfile);
  const userFirstName = userProfile?.fullName ? userProfile.fullName.trim().split(" ")[0] : "";

  const goals = useFinanceStore((state) => state.goals) || [];
  const addGoal = useFinanceStore((state) => state.addGoal);
  const updateGoal = useFinanceStore((state) => state.updateGoal);
  const deleteGoal = useFinanceStore((state) => state.deleteGoal);
  const addAmountToGoal = useFinanceStore((state) => state.addAmountToGoal);

  useEffect(() => {
    fetchExchangeRates();
  }, []);

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
  const [analysisPeriod, setAnalysisPeriod] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [isGoalModalVisible, setIsGoalModalVisible] = useState(false);
  const [isGoalAchievedModalVisible, setIsGoalAchievedModalVisible] = useState(false);
  const [isLegalModalVisible, setIsLegalModalVisible] = useState(false);
  const [legalTab, setLegalTab] = useState<"terms" | "privacy" | "disclaimer">("terms");
  const [isCategoryLimitsModalVisible, setIsCategoryLimitsModalVisible] = useState(false);
  const [isAboutModalVisible, setIsAboutModalVisible] = useState(false);
  const [isFaqModalVisible, setIsFaqModalVisible] = useState(false);
  const [isResetConfirmVisible, setIsResetConfirmVisible] = useState(false);
  const [tempGoalTitle, setTempGoalTitle] = useState("");
  const [tempGoalTarget, setTempGoalTarget] = useState("");
  const [tempGoalSaved, setTempGoalSaved] = useState("");
  const [isNotificationsVisible, setIsNotificationsVisible] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(true);
  const [selectedDetailExpense, setSelectedDetailExpense] = useState<Expense | null>(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [mascotMessage, setMascotMessage] = useState<string | null>(null);
  const mascotTimeoutRef = useRef<any>(null);

  // Income & Fixed Expense Profile Edit Modals
  const [isIncomeEditModalVisible, setIsIncomeEditModalVisible] = useState(false);
  const [isFixedExpenseEditModalVisible, setIsFixedExpenseEditModalVisible] = useState(false);
  const [tempIncomes, setTempIncomes] = useState<Array<{ id: string; label: string; amount: string; subtitle?: string; period?: Period }>>([]);
  const [tempFixedExpenses, setTempFixedExpenses] = useState<Array<{ id: string; label: string; amount: string; subtitle?: string; period?: Period }>>([]);

  function openIncomeEditModal() {
    triggerHaptic();
    setTempIncomes(
      (incomes || []).map((inc) => ({
        id: inc.id,
        label: inc.label,
        amount: inc.amount ? formatAmountInput(String(inc.amount)) : "",
        subtitle: inc.subtitle || "",
        period: inc.period || "monthly"
      }))
    );
    setIsIncomeEditModalVisible(true);
  }

  function openFixedExpenseEditModal() {
    triggerHaptic();
    setTempFixedExpenses(
      (fixedExpenses || []).map((exp) => ({
        id: exp.id,
        label: exp.label,
        amount: exp.amount ? formatAmountInput(String(exp.amount)) : "",
        subtitle: exp.subtitle || "",
        period: exp.period || "monthly"
      }))
    );
    setIsFixedExpenseEditModalVisible(true);
  }

  // Tab state
  const [currentTab, setCurrentTab] = useState<"home" | "goals" | "analysis" | "profile">("home");
  const [isAddGoalModalVisible, setIsAddGoalModalVisible] = useState(false);
  const [selectedGoalForAddAmount, setSelectedGoalForAddAmount] = useState<GoalItem | null>(null);
  const [goalAddAmountVal, setGoalAddAmountVal] = useState("");

  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalTargetAmount, setNewGoalTargetAmount] = useState("");
  const [newGoalCurrentAmount, setNewGoalCurrentAmount] = useState("");
  const [newGoalTargetDate, setNewGoalTargetDate] = useState("");
  const [newGoalIcon, setNewGoalIcon] = useState("plane");

  const [editGoalTitle, setEditGoalTitle] = useState("");
  const [editGoalTargetAmount, setEditGoalTargetAmount] = useState("");
  const [editGoalTargetDate, setEditGoalTargetDate] = useState("");
  const [editGoalExtraSavings, setEditGoalExtraSavings] = useState("");

  // Haptics & Dark Mode
  const isDarkMode = useFinanceStore((state) => state.isDarkMode);
  const isHapticsEnabled = useFinanceStore((state) => state.isHapticsEnabled);
  const themeColors = isDarkMode ? darkColors : lightColors;

  const triggerHaptic = () => {
    // Disabled as requested
  };

  // Custom states for Siri Voice Overlay and Toast
  const [isDirectVoiceActive, setIsDirectVoiceActive] = useState(false);
  const [draftTranscript, setDraftTranscript] = useState("");
  const [toastConfig, setToastConfig] = useState<{ visible: boolean; message: string; subtext?: string; type?: "success" | "warning" } | null>(null);
  
  // Analysis Chart filter state
  const [selectedChartLabel, setSelectedChartLabel] = useState<string | null>(null);

  // Profile Edit Modal State
  const [isProfileEditModalVisible, setIsProfileEditModalVisible] = useState(false);
  const [editFullNameInput, setEditFullNameInput] = useState(userProfile?.fullName || "");

  // Listen for incoming deep links for Siri / Kestirmeler (Shortcuts) integration and sync Siri AppGroup expenses
  useEffect(() => {
    // Initial Siri sync on mount
    syncSiriExpenses();

    // AppState listener to sync Siri expenses when app comes to foreground
    const appStateSub = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        syncSiriExpenses();
      }
    });

    // Check if app was opened via deep link initially
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    // Listen to incoming deep links while app is open/backgrounded
    const linkSub = Linking.addEventListener("url", (event) => {
      handleDeepLink(event.url);
    });

    return () => {
      appStateSub.remove();
      linkSub.remove();
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
    clearTranscript: clearVoiceTranscript,
    setTranscript: setVoiceTranscript,
    parsedExpense: voiceParsedExpense
  } = useVoiceExpenseInput();

  const directVoiceWave = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  function openDirectVoice() {
    triggerHaptic();
    clearVoiceTranscript();
    setDraftTranscript("");
    setIsSheetVisible(true);
    setTimeout(() => {
      startVoiceListening();
    }, 200);
  }

  function closeDirectVoice() {
    stopVoiceListening();
    setIsDirectVoiceActive(false);
  }

  function handleSaveDirectVoice() {
    stopVoiceListening();
    const numericAmount = voiceParsedExpense.amount;
    if (numericAmount && numericAmount > 0) {
      const expense = {
        id: `voice-expense-${Date.now()}-${Math.random()}`,
        label: voiceParsedExpense.label.trim() || `${voiceParsedExpense.category.trim() || "Harcama"} harcaması`,
        subtitle: voiceParsedExpense.subcategory.trim() || voiceParsedExpense.category.trim() || "Harcama",
        amount: numericAmount,
        period: "daily" as const,
        isFixed: false,
        category: voiceParsedExpense.category.trim() || "Harcama",
        note: voiceTranscript.trim() || voiceParsedExpense.label.trim(),
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
      if (voiceTranscript.trim()) {
        setDraftTranscript(voiceTranscript);
        setIsSheetVisible(true);
      }
      setIsDirectVoiceActive(false);
    }
  }

  useEffect(() => {
    if (isDirectVoiceActive) {
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true
      }).start();
    } else {
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
      }).start();
    }
  }, [isDirectVoiceActive, overlayOpacity]);

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

  const simulatedDate = useMemo(() => {
    return getSimulatedDate(simulatedDateOffsetDays || 0);
  }, [simulatedDateOffsetDays]);

  const dynamicDaily = useMemo(() => {
    return getDynamicDailyLimit(incomes, expenses, savingsGoal, simulatedDate);
  }, [incomes, expenses, savingsGoal, simulatedDate]);

  const revisedSavingsInfo = useMemo(() => {
    return getRevisedSavingsStatus(incomes, expenses, savingsGoal, simulatedDate);
  }, [incomes, expenses, savingsGoal, simulatedDate]);

  useEffect(() => {
    syncWidgetData(incomes, expenses, savingsGoal, simulatedDate);

    const monthKey = `${simulatedDate.getFullYear()}-${String(simulatedDate.getMonth() + 1).padStart(2, '0')}`;
    const monthNameTr = simulatedDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
    const monthNameEn = simulatedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const monthTitle = language === 'tr' ? monthNameTr : monthNameEn;

    const currentSpent = getExpensesTotalForPeriod(expenses, "monthly", simulatedDate);
    const revInfo = getRevisedSavingsStatus(incomes, expenses, savingsGoal, simulatedDate);

    if (savingsGoal.monthlyContribution > 0) {
      addMonthlyArchiveRecord({
        id: `archive-${monthKey}`,
        monthKey,
        monthTitle,
        targetSavings: savingsGoal.monthlyContribution,
        achievedSavings: revInfo.revisedSavings,
        totalSpent: currentSpent,
        spendableBudget: getSpendableMonthlyBudget(incomes, expenses, savingsGoal),
        isSuccess: !revInfo.isOverused
      });
    }
  }, [incomes, expenses, savingsGoal, simulatedDate, language, addMonthlyArchiveRecord]);

  const planDay = useMemo(() => {
    const start = new Date(savingsGoal.planStartDate || new Date());
    const dStart = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const dSim = new Date(simulatedDate.getFullYear(), simulatedDate.getMonth(), simulatedDate.getDate());
    const diffTime = Math.max(0, dSim.getTime() - dStart.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return Math.min(30, diffDays + 1);
  }, [simulatedDate, savingsGoal.planStartDate]);

  const formattedSimulatedDate = useMemo(() => {
    const locale = language === "tr" ? "tr-TR" : "en-US";
    return simulatedDate.toLocaleDateString(locale, {
      day: "numeric",
      month: "long",
      weekday: "long"
    });
  }, [simulatedDate, language]);


  const copy = periodCopy[selectedPeriod];
  const selectedPeriodLimit = plan.limits[selectedPeriod];
  const periodExpenses = useMemo(() => getExpensesForPeriod(expenses, selectedPeriod, simulatedDate, savingsGoal.planStartDate), [expenses, selectedPeriod, simulatedDate, savingsGoal.planStartDate]);
  const periodExpenseRows = useMemo(() => buildExpenseRows(periodExpenses), [periodExpenses]);
  const recentTotal = plan.selectedPeriodSpent;
  const selectedPeriodRemaining = plan.selectedPeriodRemaining;
  const goalTargetAmount = Math.max(savingsGoal.targetAmount || savingsGoal.monthlyContribution || 0, 0);

  const estimatedPredictiveSavings = useMemo(() => {
    const totalDailyLimit = plan.limits.daily || 1;
    const daysInMonthPassed = Math.max(simulatedDate.getDate(), 1);
    const expectedBudgetSpentSoFar = totalDailyLimit * daysInMonthPassed;
    const actualSpentSoFar = recentTotal;
    const difference = expectedBudgetSpentSoFar - actualSpentSoFar;
    return Math.max(Math.round(savingsGoal.monthlyContribution + difference), 0);
  }, [plan.limits.daily, simulatedDate, recentTotal, savingsGoal.monthlyContribution]);
  
  const spentToday = useMemo(() => {
    return expenses
      .filter((exp) => {
        if (exp.isFixed || !exp.occurredAt) return false;
        return new Date(exp.occurredAt).toDateString() === simulatedDate.toDateString();
      })
      .reduce((sum, exp) => sum + exp.amount, 0);
  }, [expenses, simulatedDate]);

  const goalSavedAmount = useMemo(() => {
    const spendableMonthly = getSpendableMonthlyBudget(incomes, expenses, savingsGoal);
    const monthlySpent = getExpensesTotalForPeriod(expenses, "monthly", simulatedDate);
    const targetSavings = toSafeAmount(savingsGoal.monthlyContribution);

    if (monthlySpent <= spendableMonthly) {
      const dailyContribution = targetSavings > 0 ? targetSavings / 30 : 0;
      const accrued = Math.min(targetSavings, Math.round(planDay * dailyContribution));
      return Math.max(accrued, toSafeAmount(savingsGoal.currentAmount));
    } else {
      const budgetOveruse = monthlySpent - spendableMonthly;
      return targetSavings - budgetOveruse;
    }
  }, [incomes, expenses, savingsGoal, simulatedDate, planDay]);

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
    const dailyRemaining = plan.limits.daily - getExpensesForPeriod(expenses, "daily", simulatedDate, savingsGoal?.planStartDate).reduce((sum, e) => sum + e.amount, 0);
    const weeklyRemaining = plan.limits.weekly - getExpensesForPeriod(expenses, "weekly", simulatedDate, savingsGoal?.planStartDate).reduce((sum, e) => sum + e.amount, 0);
    
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
    const planStart = new Date(savingsGoal?.planStartDate || new Date());
    planStart.setHours(0, 0, 0, 0);

    const last7Days = Array(7).fill(0).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    });

    const dailySpendMap = new Map<number, number>();
    // Only track days that are on or after the planStartDate
    last7Days.forEach(t => {
      if (t >= planStart.getTime()) {
        dailySpendMap.set(t, 0);
      }
    });

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

    const weeklyExpenses = getExpensesForPeriod(expenses, "weekly", new Date(), savingsGoal?.planStartDate);
    const weeklyMarketSpent = weeklyExpenses
      .filter(e => getCategoryKey(e.category) === "market")
      .reduce((sum, e) => sum + e.amount, 0);
    const marketProgress = Math.min(weeklyMarketSpent / 1500, 1.0);
    const isMarketExceeded = weeklyMarketSpent > 1500;
    // Market target is 'stay under', so it's never completed until week ends (which resets it), thus false.
    const isMarketCompleted = false; 

    const weeklyDiningSpent = weeklyExpenses
      .filter(e => getCategoryKey(e.category) === "dining")
      .reduce((sum, e) => sum + e.amount, 0);
    const diningProgress = Math.min(weeklyDiningSpent / 300, 1.0);
    const isDiningExceeded = weeklyDiningSpent > 300;
    const isDiningCompleted = false;

    const goalTarget = Math.max(savingsGoal.targetAmount || 0, 0);
    const goalSaved = Math.max(savingsGoal.currentAmount || 0, 0);
    const isGoalQuarterCompleted = goalTarget > 0 ? (goalSaved / goalTarget) >= 0.25 : false;

    return [
      {
        id: "no-spend-5d",
        title: language === "tr" ? "2 Gün Sıfır Harcama" : "2-Day No-Spend",
        desc: language === "tr" ? "Son 7 günün en az 2 gününü ekstra harcamasız kapatın." : "Have at least 2 days without extra expenses in the last 7 days.",
        progress: Math.min(noSpendDaysCount / 2, 1.0),
        progressText: `${Math.min(noSpendDaysCount, 2)} / 2 ${language === "tr" ? "gün" : "days"}`,
        isCompleted: noSpendDaysCount >= 2,
        isFailed: false,
        isExceeded: false,
        icon: "shield"
      },
      {
        id: "market-saver",
        title: language === "tr" ? "Market Tasarrufu" : "Grocery Saver",
        desc: language === "tr" ? "Bu haftalık market harcamanızı ₺3.000 altında tutun." : "Keep weekly grocery spending under ₺3,000.",
        progress: Math.min(weeklyMarketSpent / 3000, 1.0),
        progressText: `${formatCurrency(weeklyMarketSpent)} / ${formatCurrency(3000)}`,
        isCompleted: weeklyMarketSpent <= 3000,
        isFailed: false,
        isExceeded: weeklyMarketSpent > 3000,
        icon: "shopping-bag"
      },
      {
        id: "dining-friend",
        title: language === "tr" ? "Dışarıda Yemek & Kahve" : "Dining & Coffee",
        desc: language === "tr" ? "Bu haftalık kafe/restoran harcamanızı ₺1.200 altında tutun." : "Keep weekly cafe/dining spending under ₺1,200.",
        progress: Math.min(weeklyDiningSpent / 1200, 1.0),
        progressText: `${formatCurrency(weeklyDiningSpent)} / ${formatCurrency(1200)}`,
        isCompleted: weeklyDiningSpent <= 1200,
        isFailed: false,
        isExceeded: weeklyDiningSpent > 1200,
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
        isExceeded: false,
        icon: "award"
      }
    ];
  }, [expenses, savingsGoal, language, currency]);

  const analysisExpenses = useMemo(() => getExpensesForPeriod(expenses, analysisPeriod, simulatedDate, savingsGoal?.planStartDate), [expenses, analysisPeriod, simulatedDate, savingsGoal?.planStartDate]);

  // Filtered expenses based on chart selection
  const filteredAnalysisExpenses = useMemo(() => {
    if (!selectedChartLabel) {
      return analysisExpenses;
    }
    
    return analysisExpenses.filter((exp) => {
      if (exp.isFixed || !exp.occurredAt) return false;
      const date = new Date(exp.occurredAt);
      
      if (analysisPeriod === "daily") {
        const hour = date.getHours();
        let hourLabel = language === "tr" ? "Akşam" : "Evening";
        if (hour >= 0 && hour < 6) hourLabel = language === "tr" ? "Gece" : "Night";
        else if (hour >= 6 && hour < 12) hourLabel = language === "tr" ? "Sabah" : "Morning";
        else if (hour >= 12 && hour < 18) hourLabel = language === "tr" ? "Öğle" : "Afternoon";
        return hourLabel === selectedChartLabel;
      } else if (analysisPeriod === "weekly") {
        const dayLabels = language === "tr"
          ? ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"]
          : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        // Sadece mevcut takvim haftası içindeki (Pazartesi-bugün) harcamalar
        const todaySim = new Date(simulatedDate);
        const dow = todaySim.getDay();
        const daysFromMon = dow === 0 ? 6 : dow - 1;
        const weekStart = new Date(todaySim);
        weekStart.setDate(todaySim.getDate() - daysFromMon);
        weekStart.setHours(0, 0, 0, 0);
        if (date < weekStart) return false;
        const dayOfWeekIndex = (date.getDay() + 6) % 7;
        return dayLabels[dayOfWeekIndex] === selectedChartLabel;
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
  }, [analysisExpenses, selectedChartLabel, analysisPeriod, language]);

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
  }, [filteredAnalysisExpenses, analysisPeriod, language]);

  // Daily hourly spend trend for Analysis tab bar chart (Gece, Sabah, Öğle, Akşam)
  const analysisDailyData = useMemo(() => {
    const periods = [
      { label: language === "tr" ? "Gece" : "Night", start: 0, end: 6 },
      { label: language === "tr" ? "Sabah" : "Morning", start: 6, end: 12 },
      { label: language === "tr" ? "Öğle" : "Afternoon", start: 12, end: 18 },
      { label: language === "tr" ? "Akşam" : "Evening", start: 18, end: 24 }
    ];
    
    const periodSpends = Array(4).fill(0);
    
    expenses.forEach((exp) => {
      if (exp.isFixed || !exp.occurredAt) return;
      if (isExpenseInPeriod(exp, "daily", simulatedDate, savingsGoal?.planStartDate)) {
        const date = new Date(exp.occurredAt);
        const hour = date.getHours();
        if (hour >= 0 && hour < 6) periodSpends[0] += exp.amount;
        else if (hour >= 6 && hour < 12) periodSpends[1] += exp.amount;
        else if (hour >= 12 && hour < 18) periodSpends[2] += exp.amount;
        else periodSpends[3] += exp.amount;
      }
    });

    const maxSpend = Math.max(...periodSpends, 1);

    return periods.map((p, index) => ({
      label: p.label,
      amount: periodSpends[index],
      percentage: (periodSpends[index] / maxSpend) * 100
    }));
  }, [expenses, language, simulatedDate, savingsGoal?.planStartDate]);

  // Haftalık bar grafiği — Planın bulunduğumuz haftasındaki harcamaları günlere dağıtır
  const analysisWeeklyData = useMemo(() => {
    const dayLabels = language === "tr"
      ? ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"]
      : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const dailySpend = Array(7).fill(0);

    expenses.forEach((exp) => {
      if (exp.isFixed || !exp.occurredAt) return;
      // Sadece plan haftasına ait harcamalar
      if (isExpenseInPeriod(exp, "weekly", simulatedDate, savingsGoal?.planStartDate)) {
        const date = new Date(exp.occurredAt);
        const dayOfWeekIndex = (date.getDay() + 6) % 7; // Pazartesi=0, Pazar=6
        dailySpend[dayOfWeekIndex] += exp.amount;
      }
    });

    const maxSpend = Math.max(...dailySpend, 1);

    return dayLabels.map((label, index) => ({
      label,
      amount: dailySpend[index],
      percentage: (dailySpend[index] / maxSpend) * 100
    }));
  }, [expenses, language, simulatedDate, savingsGoal?.planStartDate]);

  // Monthly spending by weeks for Analysis tab bar chart
  const analysisMonthlyData = useMemo(() => {
    const weeks = ["1. Hft", "2. Hft", "3. Hft", "4. Hft"];
    const weeklySpend = Array(4).fill(0);
    const pStart = savingsGoal?.planStartDate ? new Date(savingsGoal.planStartDate) : simulatedDate;

    expenses.forEach((exp) => {
      if (exp.isFixed || !exp.occurredAt) return;
      
      // Sadece bulunduğumuz plan ayındaki (30 günlük döngü) harcamaları al
      if (isExpenseInPeriod(exp, "monthly", simulatedDate, savingsGoal?.planStartDate)) {
        const date = new Date(exp.occurredAt);
        const weekIndex = getExpensePlanWeekIndex(date, pStart);
        if (weekIndex >= 1 && weekIndex <= 4) {
          weeklySpend[weekIndex - 1] += exp.amount;
        }
      }
    });

    const maxSpend = Math.max(...weeklySpend, 1);

    return weeks.map((label, index) => ({
      label,
      amount: weeklySpend[index],
      percentage: (weeklySpend[index] / maxSpend) * 100
    }));
  }, [expenses, simulatedDate, savingsGoal?.planStartDate]);

  const topCategoryInfo = useMemo(() => {
    const totals: Record<string, number> = {};
    // Analiz sekmesinin seçili dönemine göre filtrelenmiş harcamalar
    analysisExpenses.forEach((exp) => {
      if (exp.isFixed) return;
      const cat = exp.category || (language === "tr" ? "Diğer" : "Other");
      totals[cat] = (totals[cat] || 0) + exp.amount;
    });
    const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
    if (sorted.length === 0) return null;
    return {
      category: sorted[0][0],
      amount: sorted[0][1]
    };
  }, [analysisExpenses, language]);

  function handleMascotPress() {
    triggerHaptic();
    const isDeficit = selectedPeriodRemaining < 0;
    const highestCat = topCategoryInfo?.category || (language === "tr" ? "Genel" : "General");
    const streak = useFinanceStore.getState().getZeroSpendingStreak();
    const userProfileState = useFinanceStore.getState().userProfile;
    const userFirstName = userProfileState?.fullName?.trim().split(" ")[0] || (userProfileState?.email ? userProfileState.email.split("@")[0] : (language === "tr" ? "Kullanıcı" : "User"));

    const streakQuotes = language === "tr" ? [
      `Tebrikler ${userFirstName}! Tam ${streak} gündür sıfır harcama yaptın, harika gidiyorsun! 🏆🐖`,
      `Müthiş! ${streak} günlük sıfır harcama serin var, tasarruf şampiyonusun! 🔥✨`
    ] : [
      `Congratulations ${userFirstName}! You haven't spent anything for ${streak} days, you are doing great! 🏆🐖`,
      `Awesome! You have a ${streak}-day zero spending streak, you are a savings champion! 🔥✨`
    ];

    const deficitQuotes = language === "tr" ? [
      "Bütçeyi biraz aştık ama sakin ol, yarın tasarruf günümüz olsun! 🐖",
      "Harcamaları kısıp bütçeyi dengeleyebiliriz, sana güveniyorum! 💪",
      "Hedefimiz tehlikede olsa da pes etmek yok, birlikte başaracağız! 🎯",
      `Bu dönem ${highestCat} harcamaları bütçemizi zorladı sanki? 🧐`
    ] : [
      "We went over budget, but tomorrow is a new savings day! 🐖",
      "We can balance the budget by cutting back a little. I believe in you! 💪",
      "Don't give up on our goal, we can do this together! 🎯",
      `It seems ${highestCat} spending pushed our budget this period! 🧐`
    ];

    const healthyQuotes = language === "tr" ? [
      `Harika gidiyoruz ${userFirstName}! Böyle devam edersek hedef cepte! 🎯`,
      "Bugün kahveyi evde demleyip tasarrufa katkı sağlamaya ne dersin? ☕",
      "Bütçemiz güvende, maskotun senden çok memnun! 🐖✨",
      "Küçük birikimler büyük hedeflere ulaştırır, harika gidiyorsun! 💸"
    ] : [
      `We are doing great ${userFirstName}! Keep it up and we will hit our target! 🎯`,
      "How about making coffee at home today to save a bit? ☕",
      "Our budget is safe, your piggy bank is very happy! 🐖✨",
      "Small savings lead to big targets. Keep up the good work! 💸"
    ];

    const quotes = (streak >= 3 && !isDeficit) ? streakQuotes : (isDeficit ? deficitQuotes : healthyQuotes);
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    setMascotMessage(randomQuote);

    if (mascotTimeoutRef.current) {
      clearTimeout(mascotTimeoutRef.current);
    }

    mascotTimeoutRef.current = setTimeout(() => {
      setMascotMessage(null);
    }, 6000);
  }

  useEffect(() => {
    return () => {
      if (mascotTimeoutRef.current) {
        clearTimeout(mascotTimeoutRef.current);
      }
    };
  }, []);

  function renderHomeTab() {
    const absExceededAmount = Math.abs(selectedPeriodRemaining);
    const formattedExceeded = formatCurrency(absExceededAmount);
    const spentRatio = selectedPeriodLimit > 0 ? recentTotal / selectedPeriodLimit : 0;
    const displayRatio = Math.min(spentRatio, 1.0);
    const progressBarColor = spentRatio >= 1.0 
      ? "#D32F2F" 
      : (spentRatio >= 0.8 ? "#DF7A12" : "#00DF89");

    return (
      <View style={styles.tabContentContainer}>
        <View style={styles.header}>
          <View style={styles.greetingWrap}>
            <Text style={[styles.greeting, { color: themeColors.text }]}>
              {t("welcomeUser", { name: userFirstName || (language === "tr" ? "Kullanıcı" : "User") })}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2, marginBottom: 1 }}>
              <Feather name="calendar" size={12} color={themeColors.primary} />
              <Text style={{ fontSize: 11.5, fontWeight: "800", color: themeColors.primary }}>
                {formattedSimulatedDate} — {language === "tr" ? `${planDay}. Gün` : `Day ${planDay}`}
              </Text>
            </View>

            {selectedPeriodRemaining < 0 ? (
              <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.subtitle, { color: "#D32F2F", fontWeight: "900", fontSize: 12 }]}>
                {language === "tr" 
                  ? `🚨 Dikkat: Bütçe ${formattedExceeded} Aşıldı!` 
                  : `🚨 Warning: Budget Exceeded by ${formattedExceeded}!`}
              </Text>
            ) : selectedPeriod === "daily" && dynamicDaily < selectedPeriodLimit ? (
              <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.subtitle, { color: isDarkMode ? "#FDBA74" : "#C8640E", fontWeight: "900", fontSize: 12 }]}>
                {language === "tr"
                  ? `⚖️ Akıllı Dengeleme: Günlük Limit ${formatCurrency(dynamicDaily)}`
                  : `⚖️ Smart Rebalancing: Daily Limit ${formatCurrency(dynamicDaily)}`}
              </Text>
            ) : (
              <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.subtitle, { color: themeColors.textMuted }]}>{t("welcomeSub")}</Text>
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
            <Feather name="bell" size={22} color={themeColors.text} />
            {hasUnreadNotifications && <View style={styles.notificationDot} />}
          </Pressable>
        </View>

        {/* Savings Goal Management (Mascot Card) */}
        <Pressable 
          onPress={() => {
            triggerHaptic();
            setIsGoalAchievedModalVisible(true);
          }}
          style={({ pressed }) => [{
            marginTop: 10,
            borderRadius: 20,
            overflow: "visible",
            borderWidth: 1.2,
            borderColor: isDarkMode ? "rgba(0, 223, 137, 0.3)" : "rgba(212, 160, 89, 0.35)",
            shadowColor: isDarkMode ? "#00DF89" : "#B98E4B",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: isDarkMode ? 0.15 : 0.10,
            shadowRadius: 14,
            elevation: 4
          }, pressed && styles.pressed]}
        >
          <LinearGradient
            colors={isDarkMode ? ["#162B23", "#0F1F19"] : ["#FCF8F3", "#F3E7D7"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ padding: 13, position: "relative", borderRadius: 18, overflow: "visible" }}
          >
            <View style={{ width: "68%", paddingRight: 4 }}>
              <View style={{ marginBottom: 6 }}>
                <View style={[styles.goalBadge, { backgroundColor: isDarkMode ? "rgba(0,223,137,0.18)" : "rgba(13,50,40,0.08)" }]}>
                  <Text style={styles.goalBadgeIcon}>🎯</Text>
                  <Text style={[styles.goalBadgeText, { color: themeColors.primary, fontWeight: "900" }]}>{t("savingsGoalTitle").toUpperCase()}</Text>
                </View>
              </View>

              <View style={{ flexDirection: "row", marginTop: 2, marginBottom: 8, gap: 8, alignItems: "center" }}>
                <View style={{ flexShrink: 1 }}>
                  <Text style={{ fontSize: 9, fontWeight: "800", color: isDarkMode ? "rgba(255,255,255,0.6)" : "#4B6358", marginBottom: 1 }}>
                    {language === "tr" ? "TOPLAM HEDEF" : "TOTAL GOAL"}
                  </Text>
                  <Text 
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.75}
                    style={{ fontSize: 17, fontWeight: "900", color: isDarkMode ? "#F1F5F9" : "#074A31" }}
                  >
                    {formatCurrency(goalTargetAmount)}
                  </Text>
                </View>

                <View style={{ width: 1.2, height: 24, backgroundColor: themeColors.border, opacity: 0.6 }} />

                <View style={{
                  flexShrink: 1,
                  backgroundColor: isDarkMode ? "rgba(0,229,143,0.16)" : "rgba(0,229,143,0.12)",
                  paddingHorizontal: 7,
                  paddingVertical: 3,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: "rgba(0,229,143,0.3)"
                }}>
                  <Text style={{ fontSize: 9, fontWeight: "800", color: isDarkMode ? "#00E58F" : "#0D5D46", marginBottom: 1 }}>
                    {language === "tr" ? "BİRİKEN" : "SAVED SO FAR"}
                  </Text>
                  <Text 
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.70}
                    style={{ fontSize: 15, fontWeight: "900", color: isDarkMode ? "#00E58F" : "#009E60" }}
                  >
                    {formatCurrency(goalSavedAmount)}
                  </Text>
                </View>
              </View>

              {/* Gradient Progress Bar with Glow Indicator Dot */}
              <View style={{ height: 8, borderRadius: 4, backgroundColor: isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(13,50,40,0.08)", position: "relative", justifyContent: "center" }}>
                <View style={{ height: "100%", width: `${goalProgress * 100}%`, borderRadius: 4, overflow: "hidden" }}>
                  <LinearGradient
                    colors={["#00DF89", "#10B981", "#059669"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ flex: 1 }}
                  />
                </View>
                {/* Glowing Tip Dot */}
                {goalProgress > 0 && (
                  <View style={{
                    position: "absolute",
                    left: `${Math.min(goalProgress * 100, 96)}%`,
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: "#00FF9D",
                    borderWidth: 2,
                    borderColor: isDarkMode ? "#172620" : "#FFFFFF",
                    shadowColor: "#00FF9D",
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.8,
                    shadowRadius: 5,
                    elevation: 4,
                    marginLeft: -6
                  }} />
                )}
              </View>

              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 5 }}>
                <Text style={{ fontSize: 10, fontWeight: "700", color: themeColors.textMuted }}>
                  {language === "tr" ? `Hedefin %${goalProgressPercent}’i tamamlandı` : `${goalProgressPercent}% of goal completed`}
                </Text>
                {goalProgressPercent >= 50 && (
                  <Text style={{ fontSize: 9.5, fontWeight: "800", color: "#00E58F" }}>
                    🔥 {language === "tr" ? "Harika İlerleme!" : "Great Progress!"}
                  </Text>
                )}
              </View>
            </View>

            <View style={{ position: "absolute", right: 6, top: 6, width: 88, height: 88, zIndex: 9999, overflow: "visible" }}>
              {(mascotMessage || selectedPeriodRemaining < 0) && (
                <View style={[styles.mascotSpeechBubbleWrapper, { top: -32, right: 0, zIndex: 9999 }]}>
                  <View style={[
                    styles.mascotSpeechBubble, 
                    { 
                      backgroundColor: selectedPeriodRemaining < 0 ? "#D32F2F" : "#0D3228",
                      maxWidth: 220 
                    }
                  ]}>
                    <Text style={[styles.mascotSpeechBubbleText, { textAlign: mascotMessage ? "center" : "left" }]}>
                      {mascotMessage || (language === "tr" ? `${formattedExceeded} Aşıldı! ⚠️` : `${formattedExceeded} Over! ⚠️`)}
                    </Text>
                    <View style={[
                      styles.speechBubbleArrow, 
                      { borderTopColor: selectedPeriodRemaining < 0 ? "#D32F2F" : "#0D3228" }
                    ]} />
                  </View>
                </View>
              )}
              <Pressable onPress={handleMascotPress} style={({ pressed }) => pressed && styles.pressed}>
                <LinearGradient
                  colors={
                    selectedPeriodRemaining < 0
                      ? ["rgba(211, 47, 47, 0.6)", "rgba(223, 122, 18, 0.2)"]
                      : ["rgba(0, 229, 143, 0.65)", "rgba(0, 191, 118, 0.2)"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    width: 84,
                    height: 84,
                    borderRadius: 42,
                    padding: 2,
                    alignItems: "center",
                    justifyContent: "center",
                    shadowColor: selectedPeriodRemaining < 0 ? "#D32F2F" : "#00E58F",
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: isDarkMode ? 0.45 : 0.22,
                    shadowRadius: 10,
                    elevation: 4
                  }}
                >
                  <View style={[styles.heroMascot, { 
                    position: "relative", 
                    right: 0, 
                    top: 0, 
                    width: 80, 
                    height: 80, 
                    borderRadius: 40,
                    backgroundColor: colors.white,
                    alignItems: "center",
                    justifyContent: "center",
                    shadowOpacity: 0
                  }]}>
                    <Image source={mascot} style={styles.heroMascotImage} resizeMode="contain" />
                  </View>
                </LinearGradient>
              </Pressable>
            </View>
          </LinearGradient>
        </Pressable>

        {/* Soft & Ultra-Balanced Emerald Summary Card */}
        <View style={{
          marginTop: 8,
          borderRadius: 22,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: isDarkMode ? "rgba(0, 223, 137, 0.25)" : "rgba(0, 223, 137, 0.15)",
          shadowColor: "#00DF89",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: isDarkMode ? 0.25 : 0.10,
          shadowRadius: 18,
          elevation: 5
        }}>
          <LinearGradient
            colors={isDarkMode ? ["#0E2A20", "#14372C", "#0A1F17"] : ["#17483B", "#1F594A", "#123A2F"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.summaryCard}
          >
            <SummaryMetric
              icon="credit-card"
              title={copy.limit}
              amount={selectedPeriod === "daily" ? dynamicDaily : selectedPeriodLimit}
              tone="green"
            />
            <View style={[styles.divider, { backgroundColor: "rgba(255, 255, 255, 0.14)" }]} />
            <SummaryMetric
              icon="pie-chart"
              title={copy.spent}
              amount={selectedPeriod === "daily" ? getExpensesTotalForPeriod(expenses, "daily", simulatedDate) : recentTotal}
              tone="orange"
            />
            <View style={[styles.divider, { backgroundColor: "rgba(255, 255, 255, 0.14)" }]} />
            <SummaryMetric
              icon="shield"
              title={copy.remaining}
              amount={selectedPeriod === "daily" ? (dynamicDaily - getExpensesTotalForPeriod(expenses, "daily", simulatedDate)) : selectedPeriodRemaining}
              tone="green"
            />
          </LinearGradient>
        </View>

        <View style={styles.addExpenseButtonRow}>
          <Pressable 
            style={({ pressed }) => [styles.mainAddButton, pressed && styles.pressed]} 
            onPress={() => {
              triggerHaptic();
              setIsSheetVisible(true);
            }}
          >
            <LinearGradient 
              colors={["#00E58F", "#00BF76", "#048052"]} 
              start={{ x: 0, y: 0.1 }} 
              end={{ x: 1, y: 1 }} 
              style={[
                styles.addGradient,
                {
                  shadowColor: "#00E58F",
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.35,
                  shadowRadius: 14,
                  elevation: 6
                }
              ]}
            >
              <View style={[styles.addIconWrap, { backgroundColor: "#031D14" }]}>
                <Feather name="plus" size={20} color="#00E58F" />
              </View>
              <Text style={[styles.addText, { color: "#031D14", fontWeight: "900" }]}>{t("addExpenseBtn")}</Text>
            </LinearGradient>
          </Pressable>
        </View>

        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: themeColors.primary }]}>{t("recentSectionTitle")}</Text>
            <View style={{
              backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(13, 50, 40, 0.05)",
              borderColor: themeColors.border,
              borderWidth: 1,
              borderRadius: 12,
              paddingHorizontal: 10,
              paddingVertical: 4
            }}>
              <Text style={[styles.sectionTotal, { color: themeColors.primary, fontSize: 11, lineHeight: 15 }]}>
                {language === "tr" ? "Toplam: " : "Total: "}
                {formatCurrency(recentTotal)}
              </Text>
            </View>
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
                      isSelected ? {
                        backgroundColor: "#00DF89",
                        borderColor: "#00DF89",
                        borderWidth: 1.5,
                        shadowColor: "#00DF89",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.4,
                        shadowRadius: 8,
                        elevation: 5
                      } : {
                        backgroundColor: "transparent",
                        borderWidth: 1.5,
                        borderColor: "transparent"
                      },
                      pressed && styles.pressed
                    ]}
                  >
                    <Feather 
                      name={period.icon} 
                      size={15} 
                      color={isSelected ? "#040907" : themeColors.textMuted} 
                    />
                    <Text 
                      style={[
                        styles.cardSegmentText, 
                        { 
                          color: isSelected ? "#040907" : themeColors.textMuted,
                          fontWeight: isSelected ? "900" : "600"
                        }
                      ]}
                    >
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
                scrollEnabled={isRecentListScrollable}
                bounces={false}
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
                renderItem={({ item, index }) => (
                  <SwipeableExpenseRow
                    key={item.renderId}
                    item={item}
                    index={index}
                    isLast={index === periodExpenseRows.length - 1}
                    themeColors={themeColors}
                    onPress={() => {
                      triggerHaptic();
                      setSelectedDetailExpense(item.expense);
                      setIsDetailModalVisible(true);
                    }}
                    onDelete={() => {
                      triggerHaptic();
                      deleteExpense(item.expense.id);
                      setToastConfig({
                        visible: true,
                        message: language === "tr" ? "Harcama Silindi 🗑️" : "Expense Deleted 🗑️",
                        subtext: language === "tr" ? "Bütçe limitleriniz ve birikiminiz yeniden hesaplandı." : "Budget limits recalculated.",
                        type: "warning"
                      });
                    }}
                  />
                )}
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

  function renderGoalsTab() {
    const monthlyRemaining = getRemainingLimitForPeriod("monthly");
    const spendableMonthly = plan?.spendableMonthlyBudget || 0;

    return (
      <ScrollView style={styles.tabContentContainer} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 36 }}>
        {/* Header Row */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={{ fontSize: 26, fontWeight: "900", color: themeColors.text }}>
              {language === "tr" ? "Hedeflerim" : "My Goals"}
            </Text>
          </View>
          <Pressable
            onPress={() => {
              triggerHaptic();
              setNewGoalTitle("");
              setNewGoalTargetAmount("");
              setNewGoalCurrentAmount("");
              setNewGoalTargetDate("");
              setNewGoalIcon("plane");
              setIsAddGoalModalVisible(true);
            }}
            style={{
              backgroundColor: isDarkMode ? "#00DF89" : "#4B9B58",
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              paddingHorizontal: 14,
              paddingVertical: 9,
              borderRadius: 14,
              shadowColor: "#00DF89",
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.25,
              shadowRadius: 6,
              elevation: 3
            }}
          >
            <Feather name="plus" size={16} color="#FFFFFF" />
            <Text style={{ fontSize: 13, fontWeight: "800", color: "#FFFFFF" }}>
              {language === "tr" ? "Yeni Hedef" : "New Goal"}
            </Text>
          </Pressable>
        </View>

        {/* Smart Forecast Card */}
        <View style={{
          backgroundColor: isDarkMode ? "rgba(0, 223, 137, 0.08)" : "rgba(75, 155, 88, 0.08)",
          borderColor: isDarkMode ? "rgba(0, 223, 137, 0.2)" : "rgba(75, 155, 88, 0.18)",
          borderWidth: 1.2,
          borderRadius: 20,
          padding: 16,
          marginBottom: 16,
          flexDirection: "row",
          alignItems: "center",
          gap: 12
        }}>
          <View style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: isDarkMode ? "rgba(0, 223, 137, 0.15)" : "rgba(75, 155, 88, 0.15)",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <Feather name="target" size={22} color={isDarkMode ? "#00DF89" : "#4B9B58"} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ fontSize: 11, fontWeight: "900", color: isDarkMode ? "#00DF89" : "#4B9B58", textTransform: "uppercase", letterSpacing: 0.4 }}>
              🎯 {language === "tr" ? "AKILLI HEDEF ÖNGÖRÜSÜ" : "SMART GOAL FORECAST"}
            </Text>
            <Text style={{ fontSize: 12, lineHeight: 17, fontWeight: "600", color: themeColors.text }}>
              {spendableMonthly > 0 ? (
                language === "tr" ? (
                  <>
                    Aylık <Text style={{ fontWeight: "900", color: isDarkMode ? "#00DF89" : "#4B9B58" }}>{formatCurrency(spendableMonthly)}</Text> birikim potansiyelinizle hayallerinize adım adım yaklaşıyorsunuz! 🚀
                  </>
                ) : (
                  <>
                    With your <Text style={{ fontWeight: "900", color: isDarkMode ? "#00DF89" : "#4B9B58" }}>{formatCurrency(spendableMonthly)}</Text> monthly savings potential, you're getting closer to your dreams! 🚀
                  </>
                )
              ) : (
                language === "tr" ? "Küçük adımlarla büyük hedeflere ulaşın! Düzenli birikim ekleyerek ilerlemenizi takip edin." : "Achieve big goals with small steps! Track your progress by adding savings."
              )}
            </Text>
          </View>
        </View>

        {/* Goals List (With Swipe-to-Delete and Auto App Savings Integration) */}
        {goals.length === 0 ? (
          <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 40, gap: 12 }}>
            <Feather name="target" size={40} color={themeColors.textMuted} />
            <Text style={{ fontSize: 15, fontWeight: "800", color: themeColors.text }}>
              {language === "tr" ? "Henüz eklenmiş bir hedefiniz yok" : "No goals added yet"}
            </Text>
            <Text style={{ fontSize: 12, color: themeColors.textMuted, textAlign: "center", paddingHorizontal: 20 }}>
              {language === "tr" ? "Yurt dışı gezisi, yeni bir araba veya tatil gibi hayallerinizi ekleyin." : "Add your dreams like a trip abroad, a new laptop, or vacation."}
            </Text>
          </View>
        ) : (
          <View style={{ gap: 0 }}>
            {goals.map((goal) => (
              <SwipeableGoalCard
                key={goal.id}
                goal={goal}
                accumulatedSavings={goalSavedAmount}
                onPress={() => {
                  triggerHaptic();
                  setSelectedGoalForAddAmount(goal);
                  setEditGoalTitle(goal.title);
                  setEditGoalTargetAmount(String(goal.targetAmount || ""));
                  setEditGoalTargetDate(goal.targetDate || "");
                  setEditGoalExtraSavings(String(goal.extraSavings || ""));
                  setGoalAddAmountVal("");
                }}
                onDelete={(id) => {
                  deleteGoal(id);
                  setToastConfig({
                    visible: true,
                    message: language === "tr" ? "Hedef Silindi 🗑️" : "Goal Deleted 🗑️",
                    subtext: `${goal.title} ${language === "tr" ? "listenizden kaldırıldı." : "removed from list."}`,
                    type: "warning"
                  });
                }}
              />
            ))}
          </View>
        )}
      </ScrollView>
    );
  }

  function renderAnalysisTab() {
    const activeChartData = 
      analysisPeriod === "daily" ? analysisDailyData :
      analysisPeriod === "weekly" ? analysisWeeklyData : 
      analysisMonthlyData;
    const highestCategory = analysisCategoryData[0]?.category || "Yok";
    const analysisPeriodRemaining = getRemainingLimitForPeriod(analysisPeriod);

    const dailyRemaining = getRemainingLimitForPeriod("daily");
    const monthlyRemainingPlan = getRemainingLimitForPeriod("monthly");

    const periodBadgeText = analysisPeriod === "daily" 
      ? (language === "tr" ? "Bugün" : "Today") 
      : analysisPeriod === "weekly" 
      ? (language === "tr" ? "Bu Hafta" : "This Week") 
      : (language === "tr" ? "Bu Ay" : "This Month");

    const periodLabelTR = analysisPeriod === "daily" ? "bugün" : analysisPeriod === "weekly" ? "bu hafta" : "bu ay";
    const periodLabelEN = analysisPeriod === "daily" ? "today" : analysisPeriod === "weekly" ? "this week" : "this month";
    const periodLabelTRCap = periodLabelTR.charAt(0).toUpperCase() + periodLabelTR.slice(1);

    let analysisInsightText = "";
    if (language === "tr") {
      if (analysisPeriodRemaining < 0 && monthlyRemainingPlan > 0) {
        analysisInsightText = `${periodLabelTRCap} harcama limitini aştın fakat aylık genel bütçen hâlâ güvende! Harcamalarını biraz toparlarsan hedefine kolayca ulaşırsın. 💪`;
      } else if (analysisPeriodRemaining < 0 && monthlyRemainingPlan < 0) {
        analysisInsightText = `${periodLabelTRCap} limitini aştın ve aylık bütçen de ekside! Tasarruf hedefine ulaşmak için harcamalarını acilen kısmalısın. 🚨`;
      } else if (analysisPeriodRemaining >= 0 && monthlyRemainingPlan < 0) {
        analysisInsightText = `${periodLabelTRCap} harika gidiyorsun ama aylık toplam bütçen limitlerin üzerinde. Limitlerini korumaya devam edersen durumu kurtarabilirsin! 🧐`;
      } else {
        analysisInsightText = `Harika! ${periodLabelTRCap} limitinin altındasın ve aylık tasarruf hedefin pürüzsüz ilerliyor. Birikim planına tam uyum sağlıyorsun! 🎯`;
      }
    } else {
      if (analysisPeriodRemaining < 0 && monthlyRemainingPlan > 0) {
        analysisInsightText = `You exceeded your ${periodLabelEN} limit, but your monthly budget is still safe! Keep balancing your spending to reach your goal. 💪`;
      } else if (analysisPeriodRemaining < 0 && monthlyRemainingPlan < 0) {
        analysisInsightText = `You exceeded both your ${periodLabelEN} and monthly limits! You must cut down on spending to meet your savings target. 🚨`;
      } else if (analysisPeriodRemaining >= 0 && monthlyRemainingPlan < 0) {
        analysisInsightText = `You are doing great ${periodLabelEN}, but your total monthly budget has exceeded the limit. Keep maintaining your limits to recover! 🧐`;
      } else {
        analysisInsightText = `Great job! You are within your ${periodLabelEN} limit and your monthly savings goal is on track. You are following your plan perfectly! 🎯`;
      }
    }

    return (
      <ScrollView style={styles.tabContentContainer} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 28 }}>
        <View style={styles.header}>
          <View style={styles.greetingWrap}>
            <Text style={[styles.greeting, { color: themeColors.text, fontSize: 26, fontWeight: "900" }]}>{t("analysisTitle")}</Text>
            <Text style={[styles.subtitle, { color: themeColors.textMuted }]}>{t("analysisSubtitle")}</Text>
          </View>
        </View>

        {/* Period Selector Segment Row */}
        <View style={[styles.segmentContainer, { backgroundColor: isDarkMode ? "rgba(255,255,255,0.06)" : "#F3F4F6", borderRadius: 20, padding: 4, marginTop: 4 }]}>
          <Pressable 
            style={[
              styles.segmentButton, 
              analysisPeriod === "daily" ? {
                backgroundColor: isDarkMode ? "#00DF89" : "#4B9B58",
                borderRadius: 16,
                shadowColor: "#00DF89",
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.25,
                shadowRadius: 6,
                elevation: 3
              } : { backgroundColor: "transparent" }
            ]}
            onPress={() => {
              triggerHaptic();
              setAnalysisPeriod("daily");
            }}
          >
            <Text style={[styles.segmentText, { color: analysisPeriod === "daily" ? "#FFFFFF" : themeColors.textMuted, fontWeight: analysisPeriod === "daily" ? "800" : "600" }]}>{t("analysisPeriodDaily")}</Text>
          </Pressable>
          <Pressable 
            style={[
              styles.segmentButton, 
              analysisPeriod === "weekly" ? {
                backgroundColor: isDarkMode ? "#00DF89" : "#4B9B58",
                borderRadius: 16,
                shadowColor: "#00DF89",
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.25,
                shadowRadius: 6,
                elevation: 3
              } : { backgroundColor: "transparent" }
            ]}
            onPress={() => {
              triggerHaptic();
              setAnalysisPeriod("weekly");
            }}
          >
            <Text style={[styles.segmentText, { color: analysisPeriod === "weekly" ? "#FFFFFF" : themeColors.textMuted, fontWeight: analysisPeriod === "weekly" ? "800" : "600" }]}>{t("analysisPeriodWeekly")}</Text>
          </Pressable>
          <Pressable 
            style={[
              styles.segmentButton, 
              analysisPeriod === "monthly" ? {
                backgroundColor: isDarkMode ? "#00DF89" : "#4B9B58",
                borderRadius: 16,
                shadowColor: "#00DF89",
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.25,
                shadowRadius: 6,
                elevation: 3
              } : { backgroundColor: "transparent" }
            ]}
            onPress={() => {
              triggerHaptic();
              setAnalysisPeriod("monthly");
            }}
          >
            <Text style={[styles.segmentText, { color: analysisPeriod === "monthly" ? "#FFFFFF" : themeColors.textMuted, fontWeight: analysisPeriod === "monthly" ? "800" : "600" }]}>{t("analysisPeriodMonthly")}</Text>
          </Pressable>
        </View>

        {/* Main Analysis Hero Card (Matching Screenshot Design) */}
        <View style={[
          styles.expenseCard, 
          { 
            backgroundColor: themeColors.surface, 
            borderColor: themeColors.border, 
            borderRadius: 24, 
            padding: 20, 
            marginTop: 16,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isDarkMode ? 0.2 : 0.05,
            shadowRadius: 12,
            elevation: 3
          }
        ]}>
          {/* Top Center: Large Donut Chart */}
          <View style={{ alignItems: "center", justifyContent: "center", marginVertical: 10 }}>
            <DonutChart
              size={210}
              slices={analysisCategoryData.map((item, index) => ({
                color: CATEGORY_DONUT_COLORS[index % CATEGORY_DONUT_COLORS.length],
                percentage: item.percentage
              }))}
              totalAmountText={formatCurrency(analysisTotal)}
              totalLabelText={language === "tr" ? "Toplam Harcama" : "Total Spending"}
              periodBadgeText={periodBadgeText}
              isDarkMode={isDarkMode}
              surfaceColor={themeColors.surface}
            />
          </View>

          {/* Bottom Category Breakdown List */}
          <View style={{ marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(13,50,40,0.05)" }}>
            {analysisCategoryData.length === 0 ? (
              <View style={styles.emptyExpenses}>
                <Feather name="bar-chart-2" size={28} color={themeColors.textMuted} />
                <Text style={[styles.emptyExpensesText, { color: themeColors.text }]}>{t("analysisNoData")}</Text>
                <Text style={[styles.emptyExpensesSubtext, { color: themeColors.textMuted }]}>{t("analysisNoDataSub")}</Text>
              </View>
            ) : (
              <View style={{ gap: 0 }}>
                {analysisCategoryData.map((item, index) => {
                  const catColor = CATEGORY_DONUT_COLORS[index % CATEGORY_DONUT_COLORS.length];
                  const categoryKey = getCategoryKey(item.category);
                  const baseMonthlyLimit = categoryLimits[categoryKey] || 0;
                  const periodLimit = baseMonthlyLimit > 0
                    ? (analysisPeriod === "daily" ? Math.round(baseMonthlyLimit / 30) : analysisPeriod === "weekly" ? Math.round(baseMonthlyLimit / 4.3) : baseMonthlyLimit)
                    : 0;
                  const hasLimit = periodLimit > 0;
                  const isLimitExceeded = hasLimit && item.amount > periodLimit;
                  const isExpanded = expandedCategory === item.category;

                  return (
                    <View 
                      key={item.category} 
                      style={{ 
                        borderBottomWidth: index < analysisCategoryData.length - 1 ? 1 : 0, 
                        borderBottomColor: isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(13,50,40,0.04)" 
                      }}
                    >
                      <Pressable 
                        onPress={() => {
                          triggerHaptic();
                          setExpandedCategory(isExpanded ? null : item.category);
                        }}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          paddingVertical: 13
                        }}
                      >
                        {/* Left: Color dot + Category Name */}
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1, paddingRight: 8 }}>
                          <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: catColor }} />
                          <Text style={{ fontSize: 15, fontWeight: "700", color: themeColors.text }}>
                            {item.category}
                          </Text>
                          {isLimitExceeded && (
                            <View style={{ backgroundColor: "rgba(211, 47, 47, 0.1)", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                              <Text style={{ fontSize: 9, fontWeight: "900", color: "#D32F2F" }}>⚠️ {language === "tr" ? "AŞILDI" : "EXCEEDED"}</Text>
                            </View>
                          )}
                        </View>

                        {/* Right: Amount + Chevron */}
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                          <Text style={{ fontSize: 15, fontWeight: "900", color: isLimitExceeded ? "#D32F2F" : themeColors.text }}>
                            {formatCurrency(item.amount)}
                          </Text>
                          <Feather name={isExpanded ? "chevron-down" : "chevron-right"} size={16} color={themeColors.textMuted} />
                        </View>
                      </Pressable>

                      {/* Expandable Details */}
                      {isExpanded && (
                        <View style={{ paddingBottom: 12, paddingLeft: 22, gap: 6, marginTop: -2 }}>
                          {hasLimit && (
                            <Text style={{ fontSize: 11, fontWeight: "700", color: isLimitExceeded ? "#D32F2F" : themeColors.textMuted }}>
                              {language === "tr" 
                                ? `Limit: ${formatCurrency(periodLimit)} — Kullanım: %${Math.round((item.amount / periodLimit) * 100)}`
                                : `Limit: ${formatCurrency(periodLimit)} — Used: %${Math.round((item.amount / periodLimit) * 100)}`}
                            </Text>
                          )}
                          {item.subcategories && item.subcategories.length > 0 && (
                            <View style={{ gap: 4, marginTop: 2 }}>
                              {item.subcategories.map((sub) => (
                                <View key={sub.name} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                                  <Text style={{ fontSize: 12, color: themeColors.textMuted, fontWeight: "600" }}>
                                    • {sub.name}
                                  </Text>
                                  <Text style={{ fontSize: 12, color: themeColors.text, fontWeight: "700" }}>
                                    {formatCurrency(sub.amount)} ({Math.round(sub.percentage)}%)
                                  </Text>
                                </View>
                              ))}
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </View>

        {/* Spending Status Panel */}
        <View style={[
          styles.analysisCard, 
          { 
            backgroundColor: analysisPeriodRemaining < 0 
              ? (isDarkMode ? "rgba(211, 47, 47, 0.08)" : "#FDEDED") 
              : (isDarkMode ? "rgba(7, 74, 49, 0.08)" : "#EAF5F0"),
            borderColor: analysisPeriodRemaining < 0 
              ? (isDarkMode ? "rgba(211, 47, 47, 0.3)" : "#F8D7DA") 
              : (isDarkMode ? "rgba(7, 74, 49, 0.3)" : "#D1E8DD"),
            borderWidth: 1.2,
            borderRadius: 20,
            padding: 16,
            marginTop: 14,
            flexDirection: "column",
            gap: 12
          }
        ]}>
          <View style={{ flexDirection: "row", gap: 12, alignItems: "center", width: "100%" }}>
            <View style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              backgroundColor: analysisPeriodRemaining < 0 ? "rgba(211, 47, 47, 0.12)" : "rgba(0, 223, 137, 0.12)",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <Feather 
                name={analysisPeriodRemaining < 0 ? "alert-triangle" : "check-circle"} 
                size={22} 
                color={analysisPeriodRemaining < 0 ? "#D32F2F" : "#00DF89"} 
              />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ 
                fontSize: 14, 
                fontWeight: "900", 
                color: analysisPeriodRemaining < 0 ? "#D32F2F" : "#00DF89" 
              }}>
                {analysisPeriodRemaining < 0 
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
                {analysisPeriodRemaining < 0 
                  ? (language === "tr" 
                      ? `${analysisPeriod === "daily" ? "Bugün" : analysisPeriod === "weekly" ? "Bu hafta" : "Bu ay"} harcama limitinizi ${formatCurrency(Math.abs(analysisPeriodRemaining))} aştınız. Tasarruf hedefiniz tehlikede, harcamaları yavaşlatın.` 
                      : `You exceeded your limit by ${formatCurrency(Math.abs(analysisPeriodRemaining))} ${analysisPeriod === "daily" ? "today" : analysisPeriod === "weekly" ? "this week" : "this month"}. Your savings goal is in danger, slow down spending.`)
                  : (language === "tr"
                      ? `Tebrikler! Planlanan limitin içindesiniz. ${formatCurrency(analysisPeriodRemaining)} harcama limitiniz daha var. Böyle devam edin!`
                      : `Congratulations! You are within the limit. You have ${formatCurrency(analysisPeriodRemaining)} remaining limit. Keep it up!`)
                }
              </Text>
            </View>
          </View>

          {/* Predictive Savings Forecast Card */}
          {analysisPeriod === "monthly" && (
          <View style={{ 
            marginTop: 8, 
            padding: 12, 
            borderRadius: 14, 
            backgroundColor: isDarkMode ? "rgba(0, 223, 137, 0.06)" : "rgba(13, 50, 40, 0.04)", 
            borderWidth: 1.2, 
            borderColor: isDarkMode ? "rgba(0, 223, 137, 0.2)" : "rgba(13, 50, 40, 0.08)",
            flexDirection: "row",
            gap: 10,
            alignItems: "center"
          }}>
            <View style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: isDarkMode ? "rgba(0, 223, 137, 0.15)" : "rgba(13, 50, 40, 0.08)",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <Feather name="trending-up" size={16} color={isDarkMode ? "#00E58F" : themeColors.primary} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontSize: 11, fontWeight: "800", color: revisedSavingsInfo.isOverused ? "#D32F2F" : (isDarkMode ? "#00E58F" : themeColors.primary), textTransform: "uppercase", letterSpacing: 0.4 }}>
                🚀 {language === "tr" ? "AY SONU BİRİKİM TAHMİNİ" : "MONTH-END SAVINGS FORECAST"}
              </Text>
              <Text style={{ fontSize: 12, lineHeight: 17, fontWeight: "600", color: themeColors.text }}>
                {revisedSavingsInfo.isOverused ? (
                  language === "tr" ? (
                    <>
                      Harcama bütçeniz <Text style={{ fontWeight: "900", color: "#D32F2F" }}>{formatCurrency(revisedSavingsInfo.overuseAmount)}</Text> aşıldığı için gerçekleşen birikiminiz <Text style={{ fontWeight: "900", color: "#DF7A12" }}>{formatCurrency(revisedSavingsInfo.revisedSavings)}</Text> seviyesine geriledi ⚠️
                    </>
                  ) : (
                    <>
                      Overspent by <Text style={{ fontWeight: "900", color: "#D32F2F" }}>{formatCurrency(revisedSavingsInfo.overuseAmount)}</Text>, actual month-end savings reduced to <Text style={{ fontWeight: "900", color: "#DF7A12" }}>{formatCurrency(revisedSavingsInfo.revisedSavings)}</Text> ⚠️
                    </>
                  )
                ) : (
                  language === "tr" ? (
                    <>
                      Mevcut harcama temponuzla ay sonu hedeflenen <Text style={{ fontWeight: "900", color: isDarkMode ? "#00E58F" : "#009E60" }}>{formatCurrency(revisedSavingsInfo.targetSavings)}</Text> birikim hedefinize ulaşıyorsunuz! ✅
                    </>
                  ) : (
                    <>
                      With your current spending pace, you are hitting your <Text style={{ fontWeight: "900", color: isDarkMode ? "#00E58F" : "#009E60" }}>{formatCurrency(revisedSavingsInfo.targetSavings)}</Text> savings goal! ✅
                    </>
                  )
                )}
              </Text>
            </View>
          </View>
          )}

          {/* Dynamic Trend Insight box */}
          <View style={{ 
            marginTop: 4, 
            padding: 12, 
            borderRadius: 14, 
            backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.02)" : "rgba(0, 0, 0, 0.02)", 
            borderWidth: 1, 
            borderColor: isDarkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)",
            flexDirection: "row",
            gap: 8,
            alignItems: "flex-start"
          }}>
            <Feather name="info" size={16} color={themeColors.primary} style={{ marginTop: 1.5 }} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontSize: 10, fontWeight: "900", color: themeColors.primary, textTransform: "uppercase" }}>
                {language === "tr" ? "💡 AKILLI FİNANSAL ÖNGÖRÜ" : "💡 SMART FINANCIAL INSIGHT"}
              </Text>
              <Text style={{ fontSize: 11, lineHeight: 15, fontWeight: "700", color: themeColors.text }}>
                {analysisInsightText}
              </Text>
            </View>
          </View>
        </View>

        {/* Dynamic Trend Bar Chart */}
        <View style={[styles.analysisCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border, marginTop: 14 }]}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <Text style={[styles.analysisCardTitle, { color: themeColors.text, marginBottom: 0 }]}>
              {analysisPeriod === "daily" ? t("analysisChartDailyTitle") : 
               analysisPeriod === "weekly" ? t("analysisChartWeeklyTitle") : 
               t("analysisChartMonthlyTitle")}
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
                overflow: "hidden",
                marginTop: 14
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
      </ScrollView>
    );
  }

  function renderProfileTab() {
    const profState = useFinanceStore.getState().userProfile;
    const displayFullName = profState?.fullName?.trim() || (profState?.email ? profState.email.split("@")[0] : (language === "tr" ? "Kullanıcı" : "User"));
    const initialLetter = userFirstName ? userFirstName[0].toUpperCase() : (displayFullName ? displayFullName[0].toUpperCase() : "K");

    return (
      <ScrollView style={styles.tabContentContainer} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Header with integrated User Profile */}
        <View style={[styles.header, { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }]}>
          <View style={styles.greetingWrap}>
            <Text style={[styles.greeting, { color: themeColors.text, fontWeight: "900" }]}>{displayFullName} 👋</Text>
            <Text style={[styles.subtitle, { color: themeColors.textMuted, fontWeight: "600" }]}>{t("profileSubtitle")}</Text>
          </View>
          <Pressable 
            onPress={() => {
              triggerHaptic();
              setEditFullNameInput(profState?.fullName || userFirstName || "");
              setIsProfileEditModalVisible(true);
            }}
            style={({ pressed }) => [
              styles.profileAvatarHeader, 
              { 
                backgroundColor: "#00E58F",
                borderWidth: 2,
                borderColor: isDarkMode ? "#14251E" : "#FFFFFF",
                shadowColor: "#00E58F",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.45,
                shadowRadius: 10,
                elevation: 5,
                opacity: pressed ? 0.8 : 1
              }
            ]}
          >
            <Text style={[styles.profileAvatarHeaderText, { color: "#031D14", fontWeight: "900" }]}>{initialLetter}</Text>
          </Pressable>
        </View>

        {/* Compact Side-by-Side Budget Summary Card */}
        <View style={[
          styles.profileCardCompact, 
          { 
            backgroundColor: themeColors.surface, 
            borderColor: isDarkMode ? "rgba(0, 223, 137, 0.25)" : "rgba(13, 50, 40, 0.12)",
            borderWidth: 1.2,
            borderLeftWidth: 3.5,
            borderLeftColor: "#00DF89",
            shadowColor: "#00DF89",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: isDarkMode ? 0.2 : 0.08,
            shadowRadius: 16,
            elevation: 4
          }
        ]}>
          <View style={styles.profileBudgetCol}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: "#00DF89" }} />
              <Text style={[styles.profileBudgetLabelCompact, { color: themeColors.textMuted, fontWeight: "700" }]}>{t("profileIncomeLabel")}</Text>
            </View>
            <Text style={[styles.profileBudgetValCompact, { color: isDarkMode ? "#00E58F" : "#065F46", fontWeight: "900" }]}>{formatCurrency(totalIncome)}</Text>
            <Pressable 
              style={({ pressed }) => [
                styles.profileMiniBtn, 
                { 
                  backgroundColor: isDarkMode ? "rgba(0,223,137,0.14)" : "rgba(13,50,40,0.06)",
                  borderWidth: 1,
                  borderColor: "rgba(0,223,137,0.25)"
                }, 
                pressed && styles.pressed
              ]}
              onPress={openIncomeEditModal}
            >
              <Text style={[styles.profileMiniBtnText, { color: isDarkMode ? "#00E58F" : "#065F46", fontWeight: "800" }]}>{t("profileEditIncomeBtn")}</Text>
            </Pressable>
          </View>

          <View style={[styles.profileVerticalDivider, { backgroundColor: themeColors.border }]} />

          <View style={styles.profileBudgetCol}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: "#DF7A12" }} />
              <Text style={[styles.profileBudgetLabelCompact, { color: themeColors.textMuted, fontWeight: "700" }]}>{t("profileFixedExpenseLabel")}</Text>
            </View>
            <Text style={[styles.profileBudgetValCompact, { color: "#DF7A12", fontWeight: "900" }]}>{formatCurrency(totalFixedExpenses)}</Text>
            <Pressable 
              style={({ pressed }) => [
                styles.profileMiniBtn, 
                { 
                  backgroundColor: isDarkMode ? "rgba(223,122,18,0.14)" : "rgba(223,122,18,0.08)",
                  borderWidth: 1,
                  borderColor: "rgba(223,122,18,0.25)"
                }, 
                pressed && styles.pressed
              ]}
              onPress={openFixedExpenseEditModal}
            >
              <Text style={[styles.profileMiniBtnText, { color: "#DF7A12", fontWeight: "800" }]}>{t("profileEditExpenseBtn")}</Text>
            </Pressable>
          </View>
        </View>

        {/* Savings Goal Management Card */}
        <View style={[
          styles.profileCard, 
          { 
            backgroundColor: themeColors.surface, 
            borderColor: isDarkMode ? "rgba(0, 223, 137, 0.25)" : "rgba(13, 50, 40, 0.12)",
            borderWidth: 1.2,
            borderLeftWidth: 3.5,
            borderLeftColor: "#00DF89",
            flexDirection: "column", 
            gap: 10, 
            paddingVertical: 14,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: isDarkMode ? 0.2 : 0.04,
            shadowRadius: 14,
            elevation: 4
          }
        ]}>
          <Text style={[styles.profileCardTitle, { color: themeColors.text, fontWeight: "900" }]}>{t("profileSavingsGoalHeader")}</Text>
          <View style={styles.profileBudgetRow}>
            <Text style={[styles.profileBudgetLabel, { color: themeColors.textMuted, fontWeight: "600" }]}>{t("profileGoalTarget")}</Text>
            <Text style={[styles.profileBudgetVal, { color: themeColors.text, fontWeight: "900" }]}>{formatCurrency(savingsGoal.targetAmount)}</Text>
          </View>
          <View style={styles.profileBudgetRow}>
            <Text style={[styles.profileBudgetLabel, { color: themeColors.textMuted, fontWeight: "600" }]}>{t("profileGoalSaved")}</Text>
            <Text style={[styles.profileBudgetVal, { color: isDarkMode ? "#00E58F" : "#009E60", fontWeight: "900" }]}>{formatCurrency(goalSavedAmount)}</Text>
          </View>
          
          <Pressable 
            style={({ pressed }) => [
              styles.profileEditButton, 
              { 
                backgroundColor: isDarkMode ? "rgba(0,223,137,0.14)" : "rgba(13,50,40,0.06)",
                borderWidth: 1,
                borderColor: "rgba(0,223,137,0.25)"
              },
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
            <Text style={[styles.profileEditButtonText, { color: isDarkMode ? "#00E58F" : "#065F46", fontWeight: "800" }]}>{t("profileEditGoalBtn")}</Text>
          </Pressable>
        </View>

        {/* Savings Challenges Card */}
        <View style={[
          styles.profileCard, 
          { 
            backgroundColor: themeColors.surface, 
            borderColor: isDarkMode ? "rgba(0, 223, 137, 0.2)" : "rgba(13, 50, 40, 0.1)", 
            borderWidth: 1.2,
            flexDirection: "column", 
            gap: 12, 
            paddingVertical: 14,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: isDarkMode ? 0.2 : 0.04,
            shadowRadius: 14,
            elevation: 4
          }
        ]}>
          <Text style={[styles.profileCardTitle, { color: themeColors.text, fontWeight: "900" }]}>
            🏆 {language === "tr" ? "Meydan Okumalar" : "Savings Challenges"}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 10 }}>
            {challenges.map((challenge: any) => {
              const isDanger = challenge.isFailed || challenge.isExceeded;
              const borderCol = isDanger
                ? "rgba(211, 47, 47, 0.4)"
                : (challenge.isCompleted ? "#00DF89" : themeColors.border);
              
              const progressVal = isDanger ? 1.0 : challenge.progress;
              const barFillColor = isDanger 
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
                      backgroundColor: isDanger 
                        ? "rgba(211, 47, 47, 0.08)"
                        : (challenge.isCompleted ? "rgba(0, 223, 137, 0.1)" : "rgba(0,0,0,0.05)"),
                      alignItems: "center",
                      justifyContent: "center"
                    }}>
                      <Feather 
                        name={challenge.icon as any} 
                        size={16} 
                        color={isDanger 
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
        <View style={[
          styles.profileCard, 
          { 
            backgroundColor: themeColors.surface, 
            borderColor: isDarkMode ? "rgba(0, 223, 137, 0.2)" : "rgba(13, 50, 40, 0.1)", 
            borderWidth: 1.2,
            borderLeftWidth: 3.5,
            borderLeftColor: "#00DF89",
            flexDirection: "column", 
            paddingVertical: 8,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: isDarkMode ? 0.2 : 0.04,
            shadowRadius: 14,
            elevation: 4
          }
        ]}>
          <View style={styles.settingRow}>
            <View style={styles.settingIconWrap}>
              <Feather name="moon" size={20} color={themeColors.text} />
              <Text style={[styles.settingLabel, { color: themeColors.text, fontWeight: "800" }]}>{t("profileSettingDarkMode")}</Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={(val) => {
                triggerHaptic();
                setIsDarkMode(val);
              }}
              trackColor={{ false: "#D1CFC7", true: "#00E58F" }}
              thumbColor={colors.white}
            />
          </View>

          <View style={[styles.expenseDivider, { backgroundColor: themeColors.border }]} />



          <View style={styles.settingRow}>
            <View style={styles.settingIconWrap}>
              <Feather name="globe" size={20} color={themeColors.text} />
              <Text style={[styles.settingLabel, { color: themeColors.text, fontWeight: "800" }]}>{t("profileSettingLanguage")}</Text>
            </View>
            <View style={{ flexDirection: "row", gap: 6 }}>
              <Pressable 
                onPress={() => { triggerHaptic(); setLanguage("tr"); }}
                style={[{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }, language === "tr" ? { backgroundColor: "#00E58F" } : { backgroundColor: "rgba(0,0,0,0.05)" }]}
              >
                <Text style={{ fontSize: 12, fontWeight: "900", color: language === "tr" ? "#031D14" : themeColors.text }}>TR</Text>
              </Pressable>
              <Pressable 
                onPress={() => { triggerHaptic(); setLanguage("en"); }}
                style={[{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }, language === "en" ? { backgroundColor: "#00E58F" } : { backgroundColor: "rgba(0,0,0,0.05)" }]}
              >
                <Text style={{ fontSize: 12, fontWeight: "900", color: language === "en" ? "#031D14" : themeColors.text }}>EN</Text>
              </Pressable>
            </View>
          </View>

          <View style={[styles.expenseDivider, { backgroundColor: themeColors.border }]} />

          <View style={styles.settingRow}>
            <View style={styles.settingIconWrap}>
              <Feather name="dollar-sign" size={20} color={themeColors.text} />
              <Text style={[styles.settingLabel, { color: themeColors.text, fontWeight: "800" }]}>
                {language === "tr" ? "Para Birimi" : "Currency"}
              </Text>
            </View>
            <View style={{ flexDirection: "row", gap: 6 }}>
              <Pressable 
                onPress={() => { triggerHaptic(); setCurrency("TRY"); }}
                style={[{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }, currency === "TRY" ? { backgroundColor: "#00E58F" } : { backgroundColor: "rgba(0,0,0,0.05)" }]}
              >
                <Text style={{ fontSize: 12, fontWeight: "900", color: currency === "TRY" ? "#031D14" : themeColors.text }}>₺ (TL)</Text>
              </Pressable>
              <Pressable 
                onPress={() => { triggerHaptic(); setCurrency("USD"); }}
                style={[{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }, currency === "USD" ? { backgroundColor: "#00E58F" } : { backgroundColor: "rgba(0,0,0,0.05)" }]}
              >
                <Text style={{ fontSize: 12, fontWeight: "900", color: currency === "USD" ? "#031D14" : themeColors.text }}>$ (USD)</Text>
              </Pressable>
              <Pressable 
                onPress={() => { triggerHaptic(); setCurrency("EUR"); }}
                style={[{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }, currency === "EUR" ? { backgroundColor: "#00E58F" } : { backgroundColor: "rgba(0,0,0,0.05)" }]}
              >
                <Text style={{ fontSize: 12, fontWeight: "900", color: currency === "EUR" ? "#031D14" : themeColors.text }}>€ (EUR)</Text>
              </Pressable>
            </View>
          </View>

          {/* Canlı Piyasa Kurları Rozeti & Genişletilmiş Bilgi Kartı */}
          <View style={{ backgroundColor: isDarkMode ? "rgba(0, 229, 143, 0.08)" : "#F0FDF4", borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16, marginHorizontal: 0, marginVertical: 10, borderWidth: 1, borderColor: "rgba(0, 229, 143, 0.35)" }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Feather name="activity" size={17} color="#00E58F" />
                <Text style={{ fontSize: 14, fontWeight: "900", color: themeColors.text }}>
                  {language === "tr" ? "Canlı Piyasa Kurları" : "Live Exchange Rates"}
                </Text>
              </View>
              <Text style={{ fontSize: 11, fontWeight: "700", color: themeColors.textMuted }}>
                {language === "tr" ? `Saat Başı (${lastRatesUpdated})` : `Hourly (${lastRatesUpdated})`}
              </Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12, paddingHorizontal: 4 }}>
              <Text style={{ fontSize: 13.5, fontWeight: "800", color: themeColors.text }}>🇺🇸 1 USD = {(1 / (exchangeRates.USD || 0.025)).toFixed(2)} ₺</Text>
              <Text style={{ fontSize: 13.5, fontWeight: "800", color: themeColors.text }}>🇪🇺 1 EUR = {(1 / (exchangeRates.EUR || 0.023)).toFixed(2)} ₺</Text>
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

          <View style={[styles.expenseDivider, { backgroundColor: themeColors.border }]} />

          <View style={styles.settingRow}>
            <View style={styles.settingIconWrap}>
              <Feather name="bell" size={20} color={themeColors.text} />
              <Text style={[styles.settingLabel, { color: themeColors.text, fontWeight: "800" }]}>
                {language === "tr" ? "Akıllı Bütçe Uyarı Bildirimleri" : "Smart Budget Notifications"}
              </Text>
            </View>
            <Switch
              value={isSmartNotificationsEnabled}
              onValueChange={(val) => {
                triggerHaptic();
                setIsSmartNotificationsEnabled(val);
                setToastConfig({
                  visible: true,
                  message: val 
                    ? (language === "tr" ? "Akıllı Bildirimler Açıldı 🔔" : "Smart Notifications On 🔔")
                    : (language === "tr" ? "Bildirimler Kapatıldı 🔕" : "Notifications Off 🔕"),
                  subtext: val
                    ? (language === "tr" ? "Günlük harcama limitine yaklaştığında akıllı uyarı alacaksın." : "You will receive smart alerts when approaching daily limit.")
                    : (language === "tr" ? "Otomatik harcama bildirimleri durduruldu." : "Automatic spending alerts paused."),
                  type: "success"
                });
              }}
              trackColor={{ false: isDarkMode ? "#2D3748" : "#E2E8F0", true: "#00E58F" }}
              thumbColor={isSmartNotificationsEnabled ? "#031D14" : "#94A3B8"}
            />
          </View>
        </View>

        {/* 🏆 Monthly Financial Archive Card */}
        <View style={[styles.profileCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border, flexDirection: "column", padding: 16, marginTop: 14 }]}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={{ fontSize: 16 }}>🏆</Text>
              <Text style={{ fontSize: 15, fontWeight: "900", color: themeColors.text }}>
                {language === "tr" ? "Geçmiş Birikim Arşivi" : "Past Savings Archive"}
              </Text>
            </View>
            <Text style={{ fontSize: 11, fontWeight: "800", color: themeColors.primary }}>
              {monthlyArchives.length} {language === "tr" ? "Dönem" : "Period"}
            </Text>
          </View>

          {monthlyArchives.length === 0 ? (
            <View style={{ paddingVertical: 12, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontSize: 12.5, fontWeight: "600", color: themeColors.textMuted, textAlign: "center" }}>
                {language === "tr" 
                  ? "Dönem sonuna ulaşıldıkça başarı rozetleriniz ve birikim geçmişiniz burada arşivlenecektir." 
                  : "Your achievement badges and savings history will be archived here as periods complete."}
              </Text>
            </View>
          ) : (
            monthlyArchives.map((archive) => (
              <View
                key={archive.id || archive.monthKey}
                style={{
                  marginBottom: 8,
                  padding: 12,
                  borderRadius: 14,
                  backgroundColor: archive.isSuccess 
                    ? (isDarkMode ? "rgba(0, 223, 137, 0.08)" : "rgba(0, 223, 137, 0.05)")
                    : (isDarkMode ? "rgba(223, 122, 18, 0.08)" : "rgba(223, 122, 18, 0.05)"),
                  borderWidth: 1,
                  borderColor: archive.isSuccess ? "rgba(0, 223, 137, 0.25)" : "rgba(223, 122, 18, 0.25)",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}
              >
                <View style={{ gap: 2 }}>
                  <Text style={{ fontSize: 13, fontWeight: "900", color: themeColors.text }}>
                    {archive.monthTitle}
                  </Text>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: archive.isSuccess ? "#00E58F" : "#DF7A12" }}>
                    {archive.isSuccess 
                      ? (language === "tr" ? "🏆 Birikim Hedefi Başarıldı!" : "🏆 Goal Achieved!") 
                      : (language === "tr" ? "⚠️ Birikim Revize Edildi" : "⚠️ Savings Revised")}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={{ fontSize: 14, fontWeight: "900", color: archive.isSuccess ? (isDarkMode ? "#00E58F" : "#009E60") : "#DF7A12" }}>
                    {formatCurrency(archive.achievedSavings)}
                  </Text>
                  <Text style={{ fontSize: 10, fontWeight: "600", color: themeColors.textMuted }}>
                    {language === "tr" ? `Hedef: ${formatCurrency(archive.targetSavings)}` : `Target: ${formatCurrency(archive.targetSavings)}`}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Support & Information Card */}
        <View style={[styles.profileCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border, flexDirection: "column", paddingVertical: 8, marginTop: 14 }]}>
          <Pressable 
            style={({ pressed }) => [styles.settingRow, pressed && styles.pressed]}
            onPress={async () => {
              triggerHaptic();
              const targetEmail = language === "tr" ? "destek@birikimyap.co" : "support@birikimyap.co";
              const subjectText = language === "tr" ? "Birikim Yap Destek Talebi" : "Birikim Yap Support Request";
              const mailUrl = `mailto:${targetEmail}?subject=${encodeURIComponent(subjectText)}`;
              try {
                const canOpen = await Linking.canOpenURL(mailUrl);
                if (canOpen) {
                  await Linking.openURL(mailUrl);
                } else {
                  setToastConfig({
                    visible: true,
                    message: language === "tr" ? "Destek E-postası" : "Support Email",
                    subtext: `${language === "tr" ? "E-posta adresimiz" : "Our email"}: ${targetEmail}`
                  });
                }
              } catch (e) {
                setToastConfig({
                  visible: true,
                  message: language === "tr" ? "Destek E-postası" : "Support Email",
                  subtext: `${language === "tr" ? "E-posta adresimiz" : "Our email"}: ${targetEmail}`
                });
              }
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

          <View style={[styles.expenseDivider, { backgroundColor: themeColors.border }]} />

          <Pressable 
            style={({ pressed }) => [styles.settingRow, pressed && styles.pressed]}
            onPress={() => {
              triggerHaptic();
              setLegalTab("terms");
              setIsLegalModalVisible(true);
            }}
          >
            <View style={styles.settingIconWrap}>
              <Feather name="file-text" size={20} color={themeColors.text} />
              <Text style={[styles.settingLabel, { color: themeColors.text }]}>
                {language === "tr" ? "Yasal Bilgiler" : "Legal"}
              </Text>
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

        {/* Log Out Card */}
        <View style={[styles.profileCard, { backgroundColor: themeColors.surface, borderColor: "#EF4444", borderWidth: 1.5, flexDirection: "column", paddingVertical: 8, marginTop: 14 }]}>
          <Pressable 
            style={({ pressed }) => [styles.settingRow, pressed && styles.pressed]}
            onPress={() => {
              triggerHaptic();
              Alert.alert(
                language === "tr" ? "Çıkış Yap" : "Log Out",
                language === "tr" ? "Hesabınızdan çıkış yapmak istediğinize emin misiniz?" : "Are you sure you want to log out?",
                [
                  { text: language === "tr" ? "İptal" : "Cancel", style: "cancel" },
                  {
                    text: language === "tr" ? "Çıkış Yap" : "Log Out",
                    style: "destructive",
                    onPress: async () => {
                      triggerHaptic();
                      await signOutUser();
                      useFinanceStore.getState().resetAllData();
                      router.replace("/");
                    }
                  }
                ]
              );
            }}
          >
            <View style={styles.settingIconWrap}>
              <Feather name="log-out" size={20} color="#EF4444" />
              <Text style={[styles.settingLabel, { color: "#EF4444", fontWeight: "800" }]}>
                {language === "tr" ? "Hesaptan Çıkış Yap" : "Log Out"}
              </Text>
            </View>
            <Feather name="chevron-right" size={20} color="#EF4444" />
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
          {currentTab === "goals" && renderGoalsTab()}
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
            icon="target" 
            label={language === "tr" ? "Hedeflerim" : "My Goals"} 
            active={currentTab === "goals"} 
            onPress={() => { triggerHaptic(); setCurrentTab("goals"); }} 
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
          isListening={isVoiceListening}
          transcript={voiceTranscript}
          error={voiceError}
          startListening={startVoiceListening}
          stopListening={stopVoiceListening}
          setTranscript={setVoiceTranscript}
          parsedExpense={voiceParsedExpense}
          permissionStatus={voicePermissionStatus}
        />

        <NotificationsModal
          visible={isNotificationsVisible}
          onClose={() => setIsNotificationsVisible(false)}
          notifications={notifications}
        />

        {/* Add New Goal Modal (With KeyboardAvoidingView & Smart Presets) */}
        <Modal
          visible={isAddGoalModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setIsAddGoalModalVisible(false)}
        >
          <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"} 
            style={{ flex: 1, justifyContent: "flex-end" }}
          >
            <Pressable 
              style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}
              onPress={() => setIsAddGoalModalVisible(false)}
            >
              <Pressable 
                style={{
                  backgroundColor: themeColors.surface,
                  borderTopLeftRadius: 28,
                  borderTopRightRadius: 28,
                  padding: 24,
                  gap: 16,
                  maxHeight: "85%",
                  borderWidth: 1,
                  borderColor: themeColors.border
                }}
                onPress={(e) => e.stopPropagation()}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ fontSize: 18, fontWeight: "900", color: themeColors.text }}>
                    {language === "tr" ? "Yeni Birikim Hedefi Ekle" : "Add New Savings Goal"}
                  </Text>
                  <Pressable onPress={() => setIsAddGoalModalVisible(false)} style={{ padding: 4 }}>
                    <Feather name="x" size={20} color={themeColors.textMuted} />
                  </Pressable>
                </View>

                <ScrollView 
                  keyboardShouldPersistTaps="handled" 
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ gap: 14, paddingBottom: 10 }}
                >
                  {/* Quick Goal Presets Database */}
                  <View style={{ gap: 6 }}>
                    <Text style={{ fontSize: 12, fontWeight: "800", color: isDarkMode ? "#00DF89" : "#4B9B58" }}>
                      ✨ {language === "tr" ? "Hazır Hedef Önerileri (Tıkla ve Doldur)" : "Quick Goal Presets"}
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
                      {[
                        { title: "Motosiklet 🏍️", amount: "180000", date: "Aralık 2025" },
                        { title: "Çeyrek / Gram Altın 🪙", amount: "5500", date: "Temmuz 2025" },
                        { title: "Yurt Dışı Tatili ✈️", amount: "45000", date: "Ağustos 2025" },
                        { title: "Laptop / MacBook 💻", amount: "65000", date: "Ekim 2025" },
                        { title: "Otomobil Birikimi 🚗", amount: "450000", date: "Ocak 2026" },
                        { title: "Ev Peşinatı 🏠", amount: "850000", date: "Haziran 2026" }
                      ].map((preset, pIdx) => (
                        <Pressable
                          key={pIdx}
                          onPress={() => {
                            triggerHaptic();
                            setNewGoalTitle(preset.title);
                            setNewGoalTargetAmount(preset.amount);
                            setNewGoalTargetDate(preset.date);
                            setNewGoalCurrentAmount("0");
                          }}
                          style={{
                            backgroundColor: isDarkMode ? "rgba(255,255,255,0.06)" : "#F3F4F6",
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: themeColors.border,
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 6
                          }}
                        >
                          <Text style={{ fontSize: 13, fontWeight: "800", color: themeColors.text }}>
                            {preset.title}
                          </Text>
                          <Text style={{ fontSize: 11, fontWeight: "700", color: themeColors.textMuted }}>
                            ({formatCurrency(Number(preset.amount))})
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>

                  <View style={{ gap: 4 }}>
                    <Text style={{ fontSize: 12, fontWeight: "700", color: themeColors.textMuted }}>
                      {language === "tr" ? "Hedef Başlığı (örn. Yamaha Motor, Çeyrek Altın)" : "Goal Title (e.g. Vacation)"}
                    </Text>
                    <TextInput
                      value={newGoalTitle}
                      onChangeText={setNewGoalTitle}
                      placeholder={language === "tr" ? "Örn. Yamaha R6 Motor 🏍️" : "e.g. Motor 🏍️"}
                      placeholderTextColor={themeColors.textMuted}
                      style={{
                        backgroundColor: isDarkMode ? "rgba(255,255,255,0.06)" : "#F3F4F6",
                        borderRadius: 14,
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        fontSize: 15,
                        fontWeight: "700",
                        color: themeColors.text
                      }}
                    />
                    {newGoalTitle.trim().length > 0 && (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
                        <Text style={{ fontSize: 11, fontWeight: "800", color: isDarkMode ? "#00DF89" : "#4B9B58" }}>
                          🤖 Akıllı Kategori Algılandı: {getSmartGoalIconAndColor(newGoalTitle).label}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={{ fontSize: 12, fontWeight: "700", color: themeColors.textMuted }}>
                        {language === "tr" ? "Hedef Tutar (₺)" : "Target Amount (₺)"}
                      </Text>
                      <TextInput
                        value={newGoalTargetAmount}
                        onChangeText={setNewGoalTargetAmount}
                        keyboardType="numeric"
                        placeholder="25000"
                        placeholderTextColor={themeColors.textMuted}
                        style={{
                          backgroundColor: isDarkMode ? "rgba(255,255,255,0.06)" : "#F3F4F6",
                          borderRadius: 14,
                          paddingHorizontal: 14,
                          paddingVertical: 12,
                          fontSize: 15,
                          fontWeight: "700",
                          color: themeColors.text
                        }}
                      />
                    </View>
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={{ fontSize: 12, fontWeight: "700", color: isDarkMode ? "#00DF89" : "#4B9B58" }}>
                        🔒 {language === "tr" ? "Biriken (₺)" : "Saved (₺)"}
                      </Text>
                      <View style={{
                        backgroundColor: isDarkMode ? "rgba(0, 223, 137, 0.08)" : "rgba(75, 155, 88, 0.08)",
                        borderRadius: 14,
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        borderWidth: 1,
                        borderColor: isDarkMode ? "rgba(0, 223, 137, 0.25)" : "rgba(75, 155, 88, 0.2)"
                      }}>
                        <Text style={{ fontSize: 15, fontWeight: "900", color: isDarkMode ? "#00DF89" : "#4B9B58" }}>
                          {formatCurrency(goalSavedAmount)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={{ gap: 4 }}>
                    <Text style={{ fontSize: 12, fontWeight: "700", color: themeColors.textMuted }}>
                      {language === "tr" ? "Hedeflenen Tarih (örn. Mayıs 2025)" : "Target Date (e.g. May 2025)"}
                    </Text>
                    <TextInput
                      value={newGoalTargetDate}
                      onChangeText={setNewGoalTargetDate}
                      placeholder={language === "tr" ? "Mayıs 2025" : "May 2025"}
                      placeholderTextColor={themeColors.textMuted}
                      style={{
                        backgroundColor: isDarkMode ? "rgba(255,255,255,0.06)" : "#F3F4F6",
                        borderRadius: 14,
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        fontSize: 15,
                        fontWeight: "700",
                        color: themeColors.text
                      }}
                    />
                  </View>

                  <Pressable
                    onPress={() => {
                      const targetAmt = parseAmount(newGoalTargetAmount);
                      if (newGoalTitle.trim() && targetAmt > 0) {
                        triggerHaptic();
                        const smart = getSmartGoalIconAndColor(newGoalTitle);
                        addGoal({
                          title: newGoalTitle.trim(),
                          targetAmount: targetAmt,
                          currentAmount: 0,
                          targetDate: newGoalTargetDate.trim() || undefined,
                          icon: smart.icon,
                          color: smart.color
                        });
                        setNewGoalTitle("");
                        setNewGoalTargetAmount("");
                        setNewGoalCurrentAmount("");
                        setNewGoalTargetDate("");
                        setIsAddGoalModalVisible(false);
                        setToastConfig({
                          visible: true,
                          message: language === "tr" ? "Hedef Eklendi 🎯" : "Goal Added 🎯",
                          subtext: `${newGoalTitle.trim()} ${language === "tr" ? "listenize eklendi." : "added to list."}`,
                          type: "success"
                        });
                      }
                    }}
                    style={({ pressed }) => [
                      {
                        backgroundColor: isDarkMode ? "#00DF89" : "#4B9B58",
                        paddingVertical: 14,
                        borderRadius: 14,
                        alignItems: "center",
                        justifyContent: "center",
                        marginTop: 6
                      },
                      pressed && styles.pressed
                    ]}
                  >
                    <Text style={{ fontSize: 15, fontWeight: "900", color: "#FFFFFF" }}>
                      {language === "tr" ? "Hedefi Kaydet" : "Save Goal"}
                    </Text>
                  </Pressable>
                </ScrollView>
              </Pressable>
            </Pressable>
          </KeyboardAvoidingView>
        </Modal>

        {/* Edit & Goal Detail Modal */}
        {selectedGoalForAddAmount && (
          <Modal
            visible={Boolean(selectedGoalForAddAmount)}
            transparent
            animationType="slide"
            onRequestClose={() => setSelectedGoalForAddAmount(null)}
          >
            <Pressable 
              style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}
              onPress={() => setSelectedGoalForAddAmount(null)}
            >
              <Pressable 
                style={{
                  width: "100%",
                  backgroundColor: themeColors.surface,
                  borderTopLeftRadius: 28,
                  borderTopRightRadius: 28,
                  padding: 24,
                  gap: 16,
                  borderWidth: 1,
                  borderColor: themeColors.border
                }}
                onPress={(e) => e.stopPropagation()}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ fontSize: 18, fontWeight: "900", color: themeColors.text }}>
                    {language === "tr" ? "Hedefi Düzenle" : "Edit Goal"}
                  </Text>
                  <Pressable onPress={() => setSelectedGoalForAddAmount(null)} style={{ padding: 4 }}>
                    <Feather name="x" size={20} color={themeColors.textMuted} />
                  </Pressable>
                </View>

                <View style={{ gap: 12 }}>
                  <View style={{ gap: 4 }}>
                    <Text style={{ fontSize: 12, fontWeight: "700", color: themeColors.textMuted }}>
                      {language === "tr" ? "Hedef Başlığı (örn. Yamaha R6 Motor)" : "Goal Title (e.g. Vacation)"}
                    </Text>
                    <TextInput
                      value={editGoalTitle}
                      onChangeText={setEditGoalTitle}
                      style={{
                        backgroundColor: isDarkMode ? "rgba(255,255,255,0.06)" : "#F3F4F6",
                        borderRadius: 14,
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        fontSize: 15,
                        fontWeight: "700",
                        color: themeColors.text
                      }}
                    />
                  </View>

                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={{ fontSize: 12, fontWeight: "700", color: themeColors.textMuted }}>
                        {language === "tr" ? "Hedef Tutar (₺)" : "Target Amount (₺)"}
                      </Text>
                      <TextInput
                        value={editGoalTargetAmount}
                        onChangeText={setEditGoalTargetAmount}
                        keyboardType="numeric"
                        style={{
                          backgroundColor: isDarkMode ? "rgba(255,255,255,0.06)" : "#F3F4F6",
                          borderRadius: 14,
                          paddingHorizontal: 14,
                          paddingVertical: 12,
                          fontSize: 15,
                          fontWeight: "700",
                          color: themeColors.text
                        }}
                      />
                    </View>
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={{ fontSize: 12, fontWeight: "700", color: isDarkMode ? "#00DF89" : "#4B9B58" }}>
                        🔒 {language === "tr" ? "Şu An Biriken (₺)" : "Current Saved (₺)"}
                      </Text>
                      <View style={{
                        backgroundColor: isDarkMode ? "rgba(0, 223, 137, 0.08)" : "rgba(75, 155, 88, 0.08)",
                        borderRadius: 14,
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        borderWidth: 1,
                        borderColor: isDarkMode ? "rgba(0, 223, 137, 0.25)" : "rgba(75, 155, 88, 0.2)"
                      }}>
                        <Text style={{ fontSize: 15, fontWeight: "900", color: isDarkMode ? "#00DF89" : "#4B9B58" }}>
                          {formatCurrency(goalSavedAmount + (parseAmount(editGoalExtraSavings) || 0))}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={{ gap: 4 }}>
                    <Text style={{ fontSize: 12, fontWeight: "700", color: themeColors.textMuted }}>
                      {language === "tr" ? "Hedeflenen Tarih (örn. Temmuz 2025)" : "Target Date"}
                    </Text>
                    <TextInput
                      value={editGoalTargetDate}
                      onChangeText={setEditGoalTargetDate}
                      style={{
                        backgroundColor: isDarkMode ? "rgba(255,255,255,0.06)" : "#F3F4F6",
                        borderRadius: 14,
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        fontSize: 15,
                        fontWeight: "700",
                        color: themeColors.text
                      }}
                    />
                  </View>

                  <View style={{ gap: 4, marginTop: 4 }}>
                    <Text style={{ fontSize: 12, fontWeight: "700", color: themeColors.textMuted }}>
                      💡 {language === "tr" ? "Geçmiş / Ek Birikiminiz Var mı? (₺)" : "Extra Savings (₺)"}
                    </Text>
                    <TextInput
                      value={editGoalExtraSavings}
                      onChangeText={setEditGoalExtraSavings}
                      keyboardType="numeric"
                      placeholder={language === "tr" ? "Örn. 5000 (Sistem dışı biriken tutar)" : "e.g. 5000"}
                      placeholderTextColor={themeColors.textMuted}
                      style={{
                        backgroundColor: isDarkMode ? "rgba(255,255,255,0.06)" : "#F3F4F6",
                        borderRadius: 14,
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        fontSize: 14,
                        fontWeight: "700",
                        color: themeColors.text
                      }}
                    />
                    <Text style={{ fontSize: 11, color: themeColors.textMuted, fontStyle: "italic" }}>
                      {language === "tr" ? "* Biriken tutar ana sayfadaki canlı birikim kartınızdan otomatik hesaplanır." : "* Current saved is calculated automatically from app savings."}
                    </Text>
                  </View>
                </View>

                {/* Save and Delete Action Buttons */}
                <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
                  <Pressable
                    onPress={() => {
                      triggerHaptic();
                      deleteGoal(selectedGoalForAddAmount.id);
                      setSelectedGoalForAddAmount(null);
                    }}
                    style={{
                      paddingVertical: 14,
                      paddingHorizontal: 16,
                      borderRadius: 14,
                      backgroundColor: "rgba(239, 68, 68, 0.1)",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    <Feather name="trash-2" size={18} color="#EF4444" />
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      const newTarget = parseAmount(editGoalTargetAmount);
                      const extraSav = parseAmount(editGoalExtraSavings);
                      triggerHaptic();
                      updateGoal(selectedGoalForAddAmount.id, {
                        title: editGoalTitle.trim() || selectedGoalForAddAmount.title,
                        targetAmount: newTarget > 0 ? newTarget : selectedGoalForAddAmount.targetAmount,
                        extraSavings: extraSav >= 0 ? extraSav : 0,
                        targetDate: editGoalTargetDate.trim() || selectedGoalForAddAmount.targetDate
                      });
                      setSelectedGoalForAddAmount(null);
                    }}
                    style={{
                      flex: 1,
                      backgroundColor: isDarkMode ? "#00DF89" : "#4B9B58",
                      paddingVertical: 14,
                      borderRadius: 14,
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    <Text style={{ fontSize: 15, fontWeight: "900", color: "#FFFFFF" }}>
                      {language === "tr" ? "Değişiklikleri Kaydet" : "Save Changes"}
                    </Text>
                  </Pressable>
                </View>
              </Pressable>
            </Pressable>
          </Modal>
        )}

        {/* Profile Name Edit Modal */}
        <Modal
          visible={isProfileEditModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsProfileEditModalVisible(false)}
        >
          <Pressable 
            style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 20 }}
            onPress={() => setIsProfileEditModalVisible(false)}
          >
            <Pressable 
              style={{ width: "100%", maxWidth: 360, backgroundColor: themeColors.surface, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: themeColors.border, shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 8 }}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#00E58F", justifyContent: "center", alignItems: "center" }}>
                    <Feather name="user" size={20} color="#031D14" />
                  </View>
                  <Text style={{ fontSize: 18, fontWeight: "900", color: themeColors.text }}>
                    {language === "tr" ? "Profili Düzenle" : "Edit Profile"}
                  </Text>
                </View>
                <Pressable onPress={() => setIsProfileEditModalVisible(false)}>
                  <Feather name="x" size={22} color={themeColors.textMuted} />
                </Pressable>
              </View>

              <Text style={{ fontSize: 13, fontWeight: "700", color: themeColors.textMuted, marginBottom: 8 }}>
                {language === "tr" ? "Adınız Soyadınız" : "Full Name"}
              </Text>
              <TextInput
                value={editFullNameInput}
                onChangeText={setEditFullNameInput}
                placeholder={language === "tr" ? "Adınız Soyadınız" : "Full Name"}
                placeholderTextColor={themeColors.textMuted}
                style={{
                  backgroundColor: isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
                  borderWidth: 1.2,
                  borderColor: themeColors.border,
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  fontSize: 15,
                  fontWeight: "700",
                  color: themeColors.text,
                  marginBottom: 20
                }}
              />

              <View style={{ flexDirection: "row", gap: 10 }}>
                <Pressable
                  onPress={() => setIsProfileEditModalVisible(false)}
                  style={{ flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: themeColors.border, alignItems: "center" }}
                >
                  <Text style={{ fontSize: 14, fontWeight: "800", color: themeColors.text }}>
                    {language === "tr" ? "İptal" : "Cancel"}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={async () => {
                    triggerHaptic();
                    const trimmedName = editFullNameInput.trim();
                    if (trimmedName) {
                      const curProfile = useFinanceStore.getState().userProfile;
                      const updatedProfile = {
                        id: curProfile?.id || "local-user",
                        email: curProfile?.email || "user@birikimyap.co",
                        fullName: trimmedName
                      };
                      useFinanceStore.getState().setUserProfile(updatedProfile);
                      if (updatedProfile.id) {
                        const { saveUserPlanToCloud } = await import("@/utils/supabaseAuth");
                        await saveUserPlanToCloud();
                      }
                      setToastConfig({
                        visible: true,
                        message: language === "tr" ? "Profil Güncellendi! ✨" : "Profile Updated! ✨",
                        subtext: language === "tr" ? `Hoş geldin ${trimmedName.split(" ")[0]}!` : `Welcome ${trimmedName.split(" ")[0]}!`
                      });
                    }
                    setIsProfileEditModalVisible(false);
                  }}
                  style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: "#00E58F", alignItems: "center" }}
                >
                  <Text style={{ fontSize: 14, fontWeight: "900", color: "#031D14" }}>
                    {language === "tr" ? "Kaydet" : "Save"}
                  </Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>

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

        <IncomeEditModal
          visible={isIncomeEditModalVisible}
          onClose={() => setIsIncomeEditModalVisible(false)}
          tempIncomes={tempIncomes}
          setTempIncomes={setTempIncomes}
          onSave={() => {
            triggerHaptic();
            const formattedIncomes = tempIncomes.map((inc) => ({
              id: inc.id,
              label: inc.label.trim() || "Gelir",
              amount: parseAmount(inc.amount),
              period: inc.period || "monthly",
              subtitle: inc.subtitle || ""
            }));
            setIncomes(formattedIncomes);
            setIsIncomeEditModalVisible(false);
            setToastConfig({
              visible: true,
              message: language === "tr" ? "Gelirler Güncellendi! 💰" : "Incomes Updated! 💰",
              subtext: language === "tr" ? "Mevcut bütçe planınız başarıyla yeniden hesaplandı." : "Your budget plan was recalculated successfully.",
              type: "success"
            });
          }}
        />

        <FixedExpenseEditModal
          visible={isFixedExpenseEditModalVisible}
          onClose={() => setIsFixedExpenseEditModalVisible(false)}
          tempFixedExpenses={tempFixedExpenses}
          setTempFixedExpenses={setTempFixedExpenses}
          onSave={() => {
            triggerHaptic();
            const formattedFixed = tempFixedExpenses.map((exp) => ({
              id: exp.id,
              label: exp.label.trim() || "Sabit Gider",
              amount: parseAmount(exp.amount),
              period: exp.period || "monthly",
              isFixed: true,
              subtitle: exp.subtitle || ""
            }));
            setFixedExpenses(formattedFixed);
            setIsFixedExpenseEditModalVisible(false);
            setToastConfig({
              visible: true,
              message: language === "tr" ? "Sabit Giderler Güncellendi! 📌" : "Fixed Expenses Updated! 📌",
              subtext: language === "tr" ? "Mevcut bütçe planınız başarıyla yeniden hesaplandı." : "Your budget plan was recalculated successfully.",
              type: "success"
            });
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

        <LegalModal
          visible={isLegalModalVisible}
          onClose={() => setIsLegalModalVisible(false)}
          legalTab={legalTab}
          setLegalTab={setLegalTab}
          language={language}
          themeColors={themeColors}
          isDarkMode={isDarkMode}
        />

        <GoalAchievedModal
          visible={isGoalAchievedModalVisible}
          onClose={() => setIsGoalAchievedModalVisible(false)}
          onIncreaseGoal={() => {
            triggerHaptic();
            setIsGoalAchievedModalVisible(false);
            setTempGoalTitle(savingsGoal.title || (language === "tr" ? "Acil durum" : "Emergency fund"));
            setTempGoalTarget(String(savingsGoal.monthlyContribution || 0));
            setTempGoalSaved(String(savingsGoal.currentAmount || 0));
            setIsGoalModalVisible(true);
          }}
          onNewPlan={() => {
            triggerHaptic();
            setIsGoalAchievedModalVisible(false);
            setIsResetConfirmVisible(true);
          }}
          savingsGoal={savingsGoal}
          goalSavedAmount={goalSavedAmount}
          language={language}
          themeColors={themeColors}
          isDarkMode={isDarkMode}
        />

        <ResetConfirmModal
          visible={isResetConfirmVisible}
          onClose={() => setIsResetConfirmVisible(false)}
          onConfirm={async () => {
            triggerHaptic();
            const currentProfile = useFinanceStore.getState().userProfile;
            
            // Tüm bütçe ve harcama verilerini sıfırla
            useFinanceStore.getState().resetAllData();
            
            // Giriş yapmış kullanıcının profilini koru
            if (currentProfile) {
              useFinanceStore.getState().setUserProfile(currentProfile);
            }
            
            setIsResetConfirmVisible(false);
            
            // Doğrudan Sabit Gelir Ekleme (Yeni Plan Oluşturma) Ekranına Yönlendir!
            router.replace("/income-setup" as any);
          }}
        />

        <ExpenseDetailModal
          visible={isDetailModalVisible}
          onClose={() => setIsDetailModalVisible(false)}
          expense={selectedDetailExpense}
          onDelete={(id) => {
            triggerHaptic();
            const updatedExpenses = expenses.filter((e) => e.id !== id);
            setExpenses(updatedExpenses);
            setIsDetailModalVisible(false);
            setToastConfig({
              visible: true,
              message: language === "tr" ? "Harcama Silindi 🗑️" : "Expense Deleted 🗑️",
              subtext: selectedDetailExpense 
                ? (language === "tr" ? `${selectedDetailExpense.label} başarıyla listeden kaldırıldı.` : `${selectedDetailExpense.label} was removed from the list.`)
                : "",
              type: "success"
            });
          }}
        />

        {/* Siri Direct Voice Overlay */}
        {isDirectVoiceActive && (
          <Animated.View style={[styles.directVoiceOverlay, { opacity: overlayOpacity }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={closeDirectVoice} />
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

              <View style={{ flexDirection: "row", alignItems: "center", gap: 16, marginTop: 24 }}>
                <Pressable 
                  style={({ pressed }) => [
                    styles.directVoiceStopButton, 
                    { backgroundColor: "rgba(255, 255, 255, 0.12)" },
                    pressed && styles.pressed
                  ]}
                  onPress={closeDirectVoice}
                >
                  <Feather name="x" size={22} color={colors.white} />
                </Pressable>

                <Pressable 
                  style={({ pressed }) => [
                    styles.directVoiceStopButton, 
                    !isVoiceListening && { backgroundColor: colors.primary },
                    pressed && styles.pressed
                  ]}
                  onPress={() => isVoiceListening ? stopVoiceListening() : startVoiceListening()}
                >
                  <Feather name={isVoiceListening ? "square" : "mic"} size={22} color={colors.white} />
                </Pressable>

                <Pressable 
                  style={({ pressed }) => [
                    styles.directVoiceStopButton, 
                    { backgroundColor: "#00DF89" },
                    pressed && styles.pressed
                  ]}
                  onPress={handleSaveDirectVoice}
                >
                  <Feather name="check" size={22} color="#040907" />
                </Pressable>
              </View>
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

function IncomeEditModal({
  visible,
  onClose,
  tempIncomes,
  setTempIncomes,
  onSave
}: {
  visible: boolean;
  onClose: () => void;
  tempIncomes: Array<{ id: string; label: string; amount: string; subtitle?: string; period?: Period }>;
  setTempIncomes: React.Dispatch<React.SetStateAction<Array<{ id: string; label: string; amount: string; subtitle?: string; period?: Period }>>>;
  onSave: () => void;
}) {
  const isDarkMode = useFinanceStore((state) => state.isDarkMode);
  const themeColors = isDarkMode ? darkColors : lightColors;
  const language = useFinanceStore((state) => state.language);
  const t = (key: keyof typeof translations["tr"]) => translations[language][key] || key;

  const totalTempAmount = useMemo(() => {
    return tempIncomes.reduce((acc, curr) => acc + parseAmount(curr.amount), 0);
  }, [tempIncomes]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.sheetKeyboardView}>
        <Pressable style={styles.sheetBackdrop} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: themeColors.surface, borderColor: themeColors.border, maxHeight: "85%" }]}>
          <View style={styles.sheetHandle} />
          <Text style={[styles.sheetTitle, { color: themeColors.text }]}>{language === "tr" ? "Gelirleri Düzenle" : "Edit Incomes"}</Text>
          <Text style={[styles.sheetSubtitle, { color: themeColors.textMuted }]}>{language === "tr" ? "Mevcut gelirlerini güncelle veya yeni ekstra gelir ekle." : "Update incomes or add new extra income."}</Text>

          {/* Premium Total Income Live Card */}
          <View style={{
            marginTop: 14,
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 18,
            backgroundColor: isDarkMode ? "rgba(0,223,137,0.08)" : "rgba(0,223,137,0.06)",
            borderWidth: 1,
            borderColor: "rgba(0,223,137,0.2)",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#00DF89" }} />
              <Text style={{ fontSize: 13, fontWeight: "700", color: themeColors.textMuted }}>{language === "tr" ? "Aylık Toplam Gelir" : "Total Monthly Income"}</Text>
            </View>
            <Text style={{ fontSize: 18, fontWeight: "900", color: "#00DF89" }}>{formatCurrency(totalTempAmount)}</Text>
          </View>

          <ScrollView style={{ marginTop: 14, maxHeight: 340 }} showsVerticalScrollIndicator={false}>
            {tempIncomes.map((item, index) => (
              <View
                key={item.id || index}
                style={{
                  marginBottom: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderRadius: 18,
                  backgroundColor: isDarkMode ? "rgba(255,255,255,0.03)" : "#FAFAF9",
                  borderWidth: 1,
                  borderColor: isDarkMode ? "rgba(255,255,255,0.08)" : "#E7E5E4",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10
                }}
              >
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(0,223,137,0.12)", alignItems: "center", justifyContent: "center" }}>
                  <Feather name="trending-up" size={16} color="#00DF89" />
                </View>

                <TextInput
                  value={item.label}
                  onChangeText={(text) => {
                    setTempIncomes((prev) => prev.map((inc, i) => i === index ? { ...inc, label: text } : inc));
                  }}
                  placeholder={language === "tr" ? "Gelir Adı" : "Income Label"}
                  placeholderTextColor="#9CA19E"
                  style={{ fontSize: 14.5, fontWeight: "700", color: themeColors.text, flex: 1 }}
                />

                <View style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  backgroundColor: isDarkMode ? "rgba(0,223,137,0.12)" : "rgba(0,223,137,0.08)",
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: "rgba(0,223,137,0.2)"
                }}>
                  <Text style={{ fontSize: 13, fontWeight: "800", color: "#00DF89" }}>₺</Text>
                  <TextInput
                    value={item.amount}
                    onChangeText={(text) => {
                      setTempIncomes((prev) => prev.map((inc, i) => i === index ? { ...inc, amount: formatAmountInput(text) } : inc));
                    }}
                    keyboardType="decimal-pad"
                    inputAccessoryViewID="modalIncomeKeyboardDone"
                    placeholder="0"
                    placeholderTextColor="#9CA19E"
                    style={{ fontSize: 15, fontWeight: "900", color: "#00DF89", textAlign: "right", minWidth: 64, padding: 0 }}
                  />
                </View>

                <Pressable
                  onPress={() => {
                    setTempIncomes((prev) => prev.filter((_, i) => i !== index));
                  }}
                  style={{ padding: 6, borderRadius: 10, backgroundColor: "rgba(223,59,59,0.08)" }}
                >
                  <Feather name="trash-2" size={16} color="#DF3B3B" />
                </Pressable>
              </View>
            ))}

            <Pressable
              style={({ pressed }) => [
                {
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  paddingVertical: 12,
                  borderRadius: 16,
                  backgroundColor: isDarkMode ? "rgba(0,223,137,0.08)" : "rgba(0,223,137,0.05)",
                  borderWidth: 1.2,
                  borderColor: "rgba(0,223,137,0.25)",
                  marginTop: 6
                },
                pressed && styles.pressed
              ]}
              onPress={() => {
                setTempIncomes((prev) => [
                  ...prev,
                  { id: `income-${Date.now()}`, label: language === "tr" ? "Ekstra Gelir" : "Extra Income", amount: "", period: "monthly" }
                ]);
              }}
            >
              <Feather name="plus-circle" size={17} color="#00DF89" />
              <Text style={{ fontSize: 13.5, fontWeight: "800", color: "#00DF89" }}>{language === "tr" ? "+ Yeni Gelir Ekle" : "+ Add Extra Income"}</Text>
            </Pressable>
          </ScrollView>

          <View style={styles.sheetActions}>
            <Pressable style={({ pressed }) => [styles.cancelButton, { backgroundColor: isDarkMode ? "rgba(255,255,255,0.06)" : "#EFE8DD" }, pressed && styles.pressed]} onPress={onClose}>
              <Text style={[styles.cancelButtonText, { color: themeColors.text }]}>{t("sheetCancelBtn")}</Text>
            </Pressable>
            
            <Pressable style={({ pressed }) => [{ flex: 1, borderRadius: 22, overflow: "hidden" }, pressed && styles.pressed]} onPress={onSave}>
              <LinearGradient colors={["#00DF89", "#0D3228"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, minHeight: verticalScale(52), alignItems: "center", justifyContent: "center" }}>
                <Text style={styles.saveButtonText}>{language === "tr" ? "Kaydet ve Hesapla" : "Save & Recalculate"}</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function FixedExpenseEditModal({
  visible,
  onClose,
  tempFixedExpenses,
  setTempFixedExpenses,
  onSave
}: {
  visible: boolean;
  onClose: () => void;
  tempFixedExpenses: Array<{ id: string; label: string; amount: string; subtitle?: string; period?: Period }>;
  setTempFixedExpenses: React.Dispatch<React.SetStateAction<Array<{ id: string; label: string; amount: string; subtitle?: string; period?: Period }>>>;
  onSave: () => void;
}) {
  const isDarkMode = useFinanceStore((state) => state.isDarkMode);
  const themeColors = isDarkMode ? darkColors : lightColors;
  const language = useFinanceStore((state) => state.language);
  const t = (key: keyof typeof translations["tr"]) => translations[language][key] || key;

  const totalTempAmount = useMemo(() => {
    return tempFixedExpenses.reduce((acc, curr) => acc + parseAmount(curr.amount), 0);
  }, [tempFixedExpenses]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.sheetKeyboardView}>
        <Pressable style={styles.sheetBackdrop} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: themeColors.surface, borderColor: themeColors.border, maxHeight: "85%" }]}>
          <View style={styles.sheetHandle} />
          <Text style={[styles.sheetTitle, { color: themeColors.text }]}>{language === "tr" ? "Sabit Giderleri Düzenle" : "Edit Fixed Expenses"}</Text>
          <Text style={[styles.sheetSubtitle, { color: themeColors.textMuted }]}>{language === "tr" ? "Kira, fatura vb. sabit giderlerini güncelle veya yenisini ekle." : "Update rent, bills etc. or add new fixed expense."}</Text>

          {/* Premium Total Fixed Expense Live Card */}
          <View style={{
            marginTop: 14,
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 18,
            backgroundColor: isDarkMode ? "rgba(223,122,18,0.08)" : "rgba(223,122,18,0.06)",
            borderWidth: 1,
            borderColor: "rgba(223,122,18,0.2)",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#DF7A12" }} />
              <Text style={{ fontSize: 13, fontWeight: "700", color: themeColors.textMuted }}>{language === "tr" ? "Aylık Toplam Sabit Gider" : "Total Fixed Expenses"}</Text>
            </View>
            <Text style={{ fontSize: 18, fontWeight: "900", color: "#DF7A12" }}>{formatCurrency(totalTempAmount)}</Text>
          </View>

          <ScrollView style={{ marginTop: 14, maxHeight: 340 }} showsVerticalScrollIndicator={false}>
            {tempFixedExpenses.map((item, index) => (
              <View
                key={item.id || index}
                style={{
                  marginBottom: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderRadius: 18,
                  backgroundColor: isDarkMode ? "rgba(255,255,255,0.03)" : "#FAFAF9",
                  borderWidth: 1,
                  borderColor: isDarkMode ? "rgba(255,255,255,0.08)" : "#E7E5E4",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10
                }}
              >
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(223,122,18,0.12)", alignItems: "center", justifyContent: "center" }}>
                  <Feather name="shield" size={16} color="#DF7A12" />
                </View>

                <TextInput
                  value={item.label}
                  onChangeText={(text) => {
                    setTempFixedExpenses((prev) => prev.map((exp, i) => i === index ? { ...exp, label: text } : exp));
                  }}
                  placeholder={language === "tr" ? "Gider Adı" : "Expense Label"}
                  placeholderTextColor="#9CA19E"
                  style={{ fontSize: 14.5, fontWeight: "700", color: themeColors.text, flex: 1 }}
                />

                <View style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  backgroundColor: isDarkMode ? "rgba(223,122,18,0.12)" : "rgba(223,122,18,0.08)",
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: "rgba(223,122,18,0.2)"
                }}>
                  <Text style={{ fontSize: 13, fontWeight: "800", color: "#DF7A12" }}>₺</Text>
                  <TextInput
                    value={item.amount}
                    onChangeText={(text) => {
                      setTempFixedExpenses((prev) => prev.map((exp, i) => i === index ? { ...exp, amount: formatAmountInput(text) } : exp));
                    }}
                    keyboardType="decimal-pad"
                    inputAccessoryViewID="modalExpenseKeyboardDone"
                    placeholder="0"
                    placeholderTextColor="#9CA19E"
                    style={{ fontSize: 15, fontWeight: "900", color: "#DF7A12", textAlign: "right", minWidth: 64, padding: 0 }}
                  />
                </View>

                <Pressable
                  onPress={() => {
                    setTempFixedExpenses((prev) => prev.filter((_, i) => i !== index));
                  }}
                  style={{ padding: 6, borderRadius: 10, backgroundColor: "rgba(223,59,59,0.08)" }}
                >
                  <Feather name="trash-2" size={16} color="#DF3B3B" />
                </Pressable>
              </View>
            ))}

            <Pressable
              style={({ pressed }) => [
                {
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  paddingVertical: 12,
                  borderRadius: 16,
                  backgroundColor: isDarkMode ? "rgba(223,122,18,0.08)" : "rgba(223,122,18,0.05)",
                  borderWidth: 1.2,
                  borderColor: "rgba(223,122,18,0.25)",
                  marginTop: 6
                },
                pressed && styles.pressed
              ]}
              onPress={() => {
                setTempFixedExpenses((prev) => [
                  ...prev,
                  { id: `fixed-exp-${Date.now()}`, label: language === "tr" ? "Ekstra Gider" : "Extra Fixed Expense", amount: "", period: "monthly" }
                ]);
              }}
            >
              <Feather name="plus-circle" size={17} color="#DF7A12" />
              <Text style={{ fontSize: 13.5, fontWeight: "800", color: "#DF7A12" }}>{language === "tr" ? "+ Yeni Sabit Gider Ekle" : "+ Add Extra Fixed Expense"}</Text>
            </Pressable>
          </ScrollView>

          <View style={styles.sheetActions}>
            <Pressable style={({ pressed }) => [styles.cancelButton, { backgroundColor: isDarkMode ? "rgba(255,255,255,0.06)" : "#EFE8DD" }, pressed && styles.pressed]} onPress={onClose}>
              <Text style={[styles.cancelButtonText, { color: themeColors.text }]}>{t("sheetCancelBtn")}</Text>
            </Pressable>
            
            <Pressable style={({ pressed }) => [{ flex: 1, borderRadius: 22, overflow: "hidden" }, pressed && styles.pressed]} onPress={onSave}>
              <LinearGradient colors={["#DF7A12", "#C8640E"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, minHeight: verticalScale(52), alignItems: "center", justifyContent: "center" }}>
                <Text style={styles.saveButtonText}>{language === "tr" ? "Kaydet ve Hesapla" : "Save & Recalculate"}</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      {Platform.OS === "ios" && (
        <InputAccessoryView nativeID="modalExpenseKeyboardDone">
          <View style={{
            width: "100%",
            height: 44,
            backgroundColor: "#F0F1F2",
            borderTopWidth: 0.5,
            borderTopColor: "rgba(0,0,0,0.2)",
            flexDirection: "row",
            justifyContent: "flex-end",
            alignItems: "center",
            paddingHorizontal: 16
          }}>
            <Pressable 
              onPress={() => Keyboard.dismiss()} 
              hitSlop={{ top: 10, bottom: 10, left: 20, right: 20 }}
              style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
            >
              <Text style={{ color: "#007AFF", fontWeight: "700", fontSize: 17 }}>
                {language === "tr" ? "Bitti" : "Done"}
              </Text>
            </Pressable>
          </View>
        </InputAccessoryView>
      )}
    </Modal>
  );
}

function SwipeableExpenseRow({
  item,
  index,
  isLast,
  themeColors,
  onPress,
  onDelete
}: {
  item: any;
  index: number;
  isLast: boolean;
  themeColors: any;
  onPress: () => void;
  onDelete: () => void;
}) {
  const panX = useRef(new Animated.Value(0)).current;
  const iconConfig = getCategoryIconConfig(item.expense.category);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 6 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 6 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx > 0) {
          panX.setValue(Math.min(gestureState.dx, 100));
        } else if (gestureState.dx < 0) {
          panX.setValue(Math.max(gestureState.dx, -5));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > 40) {
          Animated.spring(panX, {
            toValue: 80,
            useNativeDriver: true,
            bounciness: 4
          }).start();
        } else {
          Animated.spring(panX, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 4
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(panX, {
          toValue: 0,
          useNativeDriver: true
        }).start();
      }
    })
  ).current;

  const planStartDate = useFinanceStore((state) => state.savingsGoal.planStartDate);
  const expDate = new Date(item.expense.occurredAt || new Date());
  const startDate = planStartDate ? new Date(planStartDate) : expDate;
  
  const dExp = new Date(expDate.getFullYear(), expDate.getMonth(), expDate.getDate());
  const dStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  
  const diffTime = Math.max(0, dExp.getTime() - dStart.getTime());
  const dayInPlan = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  const dayInCycle = ((dayInPlan - 1) % 30) + 1;

  let weekColor = "#00E58F";
  let weekName = "1. Hafta";
  if (dayInCycle <= 7) {
    weekColor = "#00E58F";
    weekName = "1. Hafta";
  } else if (dayInCycle <= 14) {
    weekColor = "#3B82F6";
    weekName = "2. Hafta";
  } else if (dayInCycle <= 21) {
    weekColor = "#8B5CF6";
    weekName = "3. Hafta";
  } else {
    weekColor = "#F59E0B";
    weekName = "4. Hafta";
  }

  const resetPosition = () => {
    Animated.spring(panX, {
      toValue: 0,
      useNativeDriver: true
    }).start();
  };

  return (
    <View style={{ position: "relative", overflow: "hidden" }}>
      {/* Background Delete Action Button (Positioned on Left) */}
      <View
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          width: 80,
          backgroundColor: "#DF3B3B",
          justifyContent: "center",
          alignItems: "center"
        }}
      >
        <Pressable
          onPress={() => {
            resetPosition();
            onDelete();
          }}
          style={{ width: "100%", height: "100%", justifyContent: "center", alignItems: "center" }}
        >
          <Feather name="trash-2" size={20} color="#FFFFFF" />
          <Text style={{ color: "#FFFFFF", fontSize: 11, fontWeight: "800", marginTop: 2 }}>Sil</Text>
        </Pressable>
      </View>

      {/* Foreground Interactive Content */}
      <Animated.View
        style={{ transform: [{ translateX: panX }], backgroundColor: themeColors.surface }}
        {...panResponder.panHandlers}
      >
        <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
          <View style={[styles.expenseRow, { borderLeftWidth: 3, borderLeftColor: weekColor, paddingLeft: 10 }]}>
            <View style={[styles.expenseIcon, { backgroundColor: iconConfig.bg, alignItems: "center", justifyContent: "center" }]}>
              <Feather name={iconConfig.name} size={15} color={iconConfig.color} />
            </View>
            <View style={styles.expenseCopy}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={[styles.expenseTitle, { color: themeColors.text, fontWeight: "800", fontSize: 14.5 }]}>{item.expense.label}</Text>
                <View style={{ backgroundColor: `${weekColor}22`, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginLeft: 6 }}>
                  <Text style={{ color: weekColor, fontSize: 9.5, fontWeight: "900" }}>{weekName}</Text>
                </View>
              </View>
              <Text style={[styles.expenseCategory, { color: themeColors.textMuted, fontWeight: "600", fontSize: 11, marginTop: 2 }]}>
                {item.expense.category}{item.expense.subtitle && item.expense.subtitle !== item.expense.category ? ` • ${item.expense.subtitle}` : ""}
              </Text>
            </View>
            <View style={styles.expenseMeta}>
              <Text style={[styles.expenseAmount, { color: themeColors.text, fontWeight: "900", fontSize: 15 }]}>{formatCurrency(item.expense.amount)}</Text>
              <Text style={[styles.expenseDate, { color: themeColors.textMuted, fontWeight: "700", fontSize: 10 }]}>{formatExpenseDate(item.expense.occurredAt)}</Text>
            </View>
          </View>
          {!isLast && <View style={[styles.expenseDivider, { backgroundColor: themeColors.border }]} />}
        </Pressable>
      </Animated.View>
    </View>
  );
}

function VoiceExpenseSheet({
  visible,
  onClose,
  onSave,
  draftTranscript,
  setDraftTranscript,
  isListening,
  transcript,
  error,
  startListening,
  stopListening,
  setTranscript,
  parsedExpense,
  permissionStatus
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (expense: Expense) => void;
  draftTranscript: string;
  setDraftTranscript: (text: string) => void;
  isListening: boolean;
  transcript: string;
  error: string;
  startListening: () => Promise<void>;
  stopListening: () => void;
  setTranscript: (text: string) => void;
  parsedExpense: ParsedVoiceExpense;
  permissionStatus: string;
}) {
  const isDarkMode = useFinanceStore((state) => state.isDarkMode);
  const isHapticsEnabled = useFinanceStore((state) => state.isHapticsEnabled);
  const themeColors = isDarkMode ? darkColors : lightColors;
  const language = useFinanceStore((state) => state.language);
  const t = (key: keyof typeof translations["tr"]) => translations[language][key] || key;

  const triggerHaptic = () => {
    if (isHapticsEnabled) {
      Vibration.vibrate(10);
    }
  };

  const [spokenText, setSpokenText] = useState("");
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const wave = useRef(new Animated.Value(0)).current;

  const hasAutoStartedVoice = useRef(false);
  const isManualEditing = useRef(false);

  useEffect(() => {
    if (visible) {
      isManualEditing.current = false;
      if (draftTranscript) {
        setTranscript(draftTranscript);
        setDraftTranscript("");
      } else {
        setSpokenText("");
        setAmount("");
        setLabel("");
        setCategory("");
        setNote("");
        setTranscript("");
      }
    }
  }, [visible, draftTranscript]);

  useEffect(() => {
    setSpokenText(transcript);
  }, [transcript]);

  useEffect(() => {
    if (!transcript.trim() || isManualEditing.current) {
      return;
    }

    setAmount(parsedExpense.amount ? formatAmountInput(String(parsedExpense.amount)) : "");
    setCategory(parsedExpense.category);
    setLabel(parsedExpense.label);
    setNote(transcript);
  }, [parsedExpense.amount, parsedExpense.category, parsedExpense.label, transcript]);

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
    triggerHaptic();
    if (isListening) {
      stopListening();
      return;
    }

    isManualEditing.current = false;
    setSpokenText("");
    setAmount("");
    setLabel("");
    setCategory("");
    setNote("");
    setTranscript("");
    startListening();
  }

  function saveExpense() {
    const numericAmount = parseAmount(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return;
    }

    const expense = {
      id: `voice-expense-${Date.now()}-${Math.random()}`,
      label: label.trim() || `${category.trim() || "Harcama"} harcaması`,
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
    setLabel("");
    setCategory("");
    setNote("");
    setTranscript("");
    isManualEditing.current = false;
  }

  function closeSheet() {
    if (isListening) {
      stopListening();
    }

    setSpokenText("");
    setAmount("");
    setLabel("");
    setCategory("");
    setNote("");
    setTranscript("");
    isManualEditing.current = false;
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={closeSheet}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.sheetKeyboardView}>
        <Pressable style={styles.sheetBackdrop} onPress={closeSheet} />
        
        {/* Premium Glassmorphic Sheet Container */}
        <View style={[
          styles.sheet, 
          { 
            backgroundColor: isDarkMode ? "#12231C" : "#FFFFFF", 
            borderColor: isDarkMode ? "rgba(0, 223, 137, 0.3)" : "rgba(13, 50, 40, 0.12)",
            borderWidth: 1.5,
            shadowColor: "#00DF89",
            shadowOffset: { width: 0, height: -10 },
            shadowOpacity: isDarkMode ? 0.25 : 0.08,
            shadowRadius: 24,
            elevation: 10
          }
        ]}>
          <View style={[styles.sheetHandle, { backgroundColor: isDarkMode ? "rgba(255,255,255,0.2)" : "rgba(13,50,40,0.15)" }]} />
          <Text style={[styles.sheetTitle, { color: themeColors.text, fontWeight: "900" }]}>{t("sheetTitle")}</Text>
          <Text style={[styles.sheetSubtitle, { color: themeColors.textMuted, fontWeight: "600" }]}>{t("sheetSubtitle")}</Text>

          {/* Speech Bubble / Transcript Input Box */}
          <View style={[
            styles.speechBubbleContainer, 
            { 
              backgroundColor: isDarkMode ? "rgba(0, 223, 137, 0.06)" : "rgba(13, 50, 40, 0.03)", 
              borderColor: isDarkMode ? "rgba(0, 223, 137, 0.25)" : "rgba(13, 50, 40, 0.12)",
              borderLeftWidth: 3.5,
              borderLeftColor: "#00DF89"
            }
          ]}>
            <TextInput
              value={transcript}
              onChangeText={setTranscript}
              placeholder={isListening ? t("sheetListening") : t("sheetInputPlaceholder")}
              placeholderTextColor="#9CA19E"
              style={[styles.speechBubbleInput, { color: themeColors.text, fontWeight: "700" }]}
              multiline
            />
          </View>

          <View style={styles.micControlRow}>
            <Pressable 
              style={({ pressed }) => [
                styles.sheetMicButton, 
                isListening ? {
                  backgroundColor: "#FF3B30",
                  shadowColor: "#FF3B30",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.5,
                  shadowRadius: 10,
                  elevation: 6
                } : {
                  backgroundColor: "#00E58F",
                  shadowColor: "#00E58F",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.4,
                  shadowRadius: 10,
                  elevation: 6
                },
                pressed && styles.pressed
              ]} 
              onPress={handleMicPress}
            >
              <Feather name={isListening ? "square" : "mic"} size={24} color={isListening ? "#FFFFFF" : "#031D14"} />
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
                          backgroundColor: "#00DF89",
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
                <Text style={[styles.micHelperText, { color: themeColors.textMuted, fontWeight: "600" }]}>
                  {error || (permissionStatus === "unsupported" ? t("sheetHelperTextUnsupported") : t("sheetHelperTextVoice"))}
                </Text>
              )}
            </View>
          </View>

          {/* Form Group Card with Accent Edge */}
          <View style={[
            styles.formGroup, 
            { 
              backgroundColor: isDarkMode ? "rgba(255,255,255,0.03)" : "#FFFFFF", 
              borderColor: isDarkMode ? "rgba(0, 223, 137, 0.25)" : "rgba(13, 50, 40, 0.1)", 
              borderWidth: 1.2,
              borderLeftWidth: 3.5,
              borderLeftColor: "#00DF89",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isDarkMode ? 0.2 : 0.04,
              shadowRadius: 10,
              elevation: 3
            }
          ]}>
            <View style={styles.formRow}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Feather name="tag" size={16} color={themeColors.primary} />
                <Text style={[styles.formLabel, { fontWeight: "800", color: isDarkMode ? "#E8FAF4" : "#1A3D34" }]}>{language === "tr" ? "Harcama Adı" : "Expense Name"}</Text>
              </View>
              <TextInput
                value={label}
                onChangeText={(val) => {
                  isManualEditing.current = true;
                  setLabel(val);
                }}
                placeholder={language === "tr" ? "Örn: Market alışverişi" : "e.g. Market shopping"}
                placeholderTextColor="#9CA19E"
                style={[styles.formInput, { color: themeColors.text, fontWeight: "700" }]}
              />
            </View>
            <View style={styles.formDivider} />
            <View style={styles.formRow}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Feather name="dollar-sign" size={17} color="#00DF89" />
                <Text style={[styles.formLabel, { fontWeight: "900", color: "#00DF89" }]}>{t("sheetLabelAmount")}</Text>
              </View>
              <TextInput
                value={amount}
                onChangeText={(val) => {
                  isManualEditing.current = true;
                  setAmount(formatAmountInput(val));
                }}
                keyboardType="decimal-pad"
                placeholder="0,00"
                placeholderTextColor="#9CA19E"
                style={[styles.formInputAmount, { color: "#00DF89", fontWeight: "900", fontSize: 20 }]}
              />
            </View>
            <View style={styles.formDivider} />
            <View style={styles.formRow}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Feather name="grid" size={16} color={themeColors.primary} />
                <Text style={[styles.formLabel, { fontWeight: "800", color: isDarkMode ? "#E8FAF4" : "#1A3D34" }]}>{t("sheetLabelCategory")}</Text>
              </View>
              <TextInput
                value={category}
                onChangeText={(val) => {
                  isManualEditing.current = true;
                  setCategory(val);
                }}
                placeholder={t("sheetCategoryPlaceholder")}
                placeholderTextColor="#9CA19E"
                style={[styles.formInput, { color: themeColors.text, fontWeight: "700" }]}
              />
            </View>
            <View style={styles.formDivider} />
            <View style={styles.formRow}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Feather name="edit-3" size={16} color={themeColors.primary} />
                <Text style={[styles.formLabel, { fontWeight: "800", color: isDarkMode ? "#E8FAF4" : "#1A3D34" }]}>{t("sheetLabelNote")}</Text>
              </View>
              <TextInput
                value={note}
                onChangeText={(val) => {
                  isManualEditing.current = true;
                  setNote(val);
                }}
                placeholder={t("sheetNotePlaceholder")}
                placeholderTextColor="#9CA19E"
                style={[styles.formInput, { color: themeColors.text, fontWeight: "700" }]}
              />
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.sheetActions}>
            <Pressable 
              style={({ pressed }) => [
                styles.cancelButton, 
                { backgroundColor: isDarkMode ? "rgba(255,255,255,0.08)" : "#EFE8DD" },
                pressed && styles.pressed
              ]} 
              onPress={closeSheet}
            >
              <Text style={[styles.cancelButtonText, { color: themeColors.text, fontWeight: "800" }]}>{t("sheetCancelBtn")}</Text>
            </Pressable>
            
            <Pressable 
              style={({ pressed }) => [
                { 
                  flex: 1, 
                  borderRadius: 22, 
                  overflow: "hidden",
                  shadowColor: "#00E58F",
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.38,
                  shadowRadius: 12,
                  elevation: 6
                }, 
                pressed && styles.pressed
              ]} 
              onPress={saveExpense}
            >
              <LinearGradient
                colors={["#00E58F", "#00BF76", "#048052"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  height: 54,
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "row",
                  gap: 8
                }}
              >
                <Feather name="check" size={20} color="#031D14" />
                <Text style={{ fontSize: 16, fontWeight: "900", color: "#031D14" }}>
                  {t("sheetSaveBtn")}
                </Text>
              </LinearGradient>
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
  const isNegative = title.toLowerCase().includes("kalan") || title.toLowerCase().includes("remaining") ? amount < 0 : false;
  
  let tint = tone === "green" ? "#00E58F" : "#F59E0B";
  let bgTint = tone === "green" ? "rgba(0, 229, 143, 0.10)" : "rgba(245, 158, 11, 0.10)";
  let activeIcon = icon;
  
  if (isNegative) {
    tint = "#EF4444"; // Soft red alarm
    bgTint = "rgba(239, 68, 68, 0.13)";
    activeIcon = "alert-triangle"; // Warning icon
  }
  
  return (
    <View style={styles.metric}>
      <View style={[styles.metricIcon, { backgroundColor: bgTint }]}>
        <Feather name={activeIcon} size={18} color={tint} />
      </View>
      <Text style={[styles.metricTitle, { color: "rgba(255, 255, 255, 0.75)", fontSize: 11.5, fontWeight: "700" }]}>{title}</Text>
      <Text style={[styles.metricAmount, { color: tint, fontWeight: "800", fontSize: 15.5 }]} numberOfLines={1} adjustsFontSizeToFit>
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

const CATEGORY_DONUT_COLORS = [
  "#00DF89", // Emerald Green
  "#FF7D32", // Vibrant Orange
  "#3B82F6", // Royal Blue
  "#8B5CF6", // Electric Purple
  "#F59E0B", // Amber Gold
  "#EC4899", // Rose Pink
  "#14B8A6", // Teal
  "#6366F1", // Indigo
];

interface DonutSlice {
  color: string;
  percentage: number;
}

function SwipeableGoalCard({
  goal,
  accumulatedSavings,
  onPress,
  onDelete
}: {
  goal: GoalItem;
  accumulatedSavings: number;
  onPress: () => void;
  onDelete: (id: string) => void;
}) {
  const pan = useRef(new Animated.ValueXY()).current;
  const isDarkMode = useFinanceStore((state) => state.isDarkMode);
  const themeColors = isDarkMode ? darkColors : lightColors;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 12 && Math.abs(gestureState.dy) < 12;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          pan.setValue({ x: Math.max(gestureState.dx, -90), y: 0 });
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -45) {
          Animated.spring(pan, { toValue: { x: -80, y: 0 }, useNativeDriver: false }).start();
        } else {
          Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
        }
      }
    })
  ).current;

  const currentSaved = (accumulatedSavings || 0) + (goal.extraSavings || 0);
  const target = goal.targetAmount || 1;
  const percent = Math.min(Math.round((currentSaved / target) * 100), 100);
  const cardColor = goal.color || "#4B9B58";

  let iconName: keyof typeof Feather.glyphMap = "target";
  if (goal.icon === "plane" || goal.icon === "send") iconName = "send";
  else if (goal.icon === "sun") iconName = "sun";
  else if (goal.icon === "home") iconName = "home";
  else if (goal.icon === "laptop" || goal.icon === "tv") iconName = "tv";
  else if (goal.icon === "car" || goal.icon === "truck") iconName = "truck";
  else if (goal.icon === "smartphone") iconName = "smartphone";
  else if (goal.icon === "disc") iconName = "disc";
  else if (goal.icon === "heart") iconName = "heart";

  return (
    <View style={{ position: "relative", marginBottom: 14 }}>
      {/* Background Swipe Red Delete Action */}
      <View style={{
        position: "absolute",
        right: 0,
        top: 0,
        bottom: 0,
        width: 80,
        backgroundColor: "#EF4444",
        borderRadius: 22,
        justifyContent: "center",
        alignItems: "center"
      }}>
        <Pressable 
          onPress={() => {
            Animated.timing(pan, { toValue: { x: 0, y: 0 }, duration: 150, useNativeDriver: false }).start(() => {
              onDelete(goal.id);
            });
          }}
          style={{ width: "100%", height: "100%", justifyContent: "center", alignItems: "center", gap: 2 }}
        >
          <Feather name="trash-2" size={20} color="#FFFFFF" />
          <Text style={{ fontSize: 10, fontWeight: "900", color: "#FFFFFF" }}>Sil</Text>
        </Pressable>
      </View>

      {/* Swipeable Goal Card */}
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          {
            transform: [{ translateX: pan.x }],
            backgroundColor: themeColors.surface,
            borderColor: themeColors.border,
            borderWidth: 1,
            borderRadius: 22,
            padding: 18,
            gap: 12,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isDarkMode ? 0.2 : 0.04,
            shadowRadius: 10,
            elevation: 2
          }
        ]}
      >
        <Pressable 
          onPress={() => {
            Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
            onPress();
          }}
          style={{ gap: 12 }}
        >
          {/* Top Row: Icon + Title + Target Date + Percent */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 14, flex: 1, paddingRight: 8 }}>
              <View style={{
                width: 50,
                height: 50,
                borderRadius: 16,
                backgroundColor: isDarkMode ? "rgba(255,255,255,0.06)" : `${cardColor}18`,
                alignItems: "center",
                justifyContent: "center"
              }}>
                <Feather name={iconName} size={24} color={cardColor} />
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={{ fontSize: 16, fontWeight: "800", color: themeColors.text }}>
                  {goal.title}
                </Text>
                {goal.targetDate && (
                  <Text style={{ fontSize: 12, fontWeight: "600", color: themeColors.textMuted }}>
                    {goal.targetDate}
                  </Text>
                )}
              </View>
            </View>
            <Text style={{ fontSize: 16, fontWeight: "900", color: cardColor }}>
              %{percent}
            </Text>
          </View>

          {/* Amounts Row */}
          <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
              <Text style={{ fontSize: 18, fontWeight: "900", color: themeColors.text }}>
                {formatCurrency(currentSaved)}
              </Text>
              <Text style={{ fontSize: 14, fontWeight: "700", color: themeColors.textMuted }}>
                / {formatCurrency(target)}
              </Text>
            </View>
            <View style={{ backgroundColor: isDarkMode ? "rgba(0, 223, 137, 0.1)" : "rgba(75, 155, 88, 0.1)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
              <Text style={{ fontSize: 10, fontWeight: "800", color: isDarkMode ? "#00DF89" : "#4B9B58" }}>
                🔒 Otomatik Birikim
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={{
            height: 9,
            borderRadius: 4.5,
            backgroundColor: isDarkMode ? "rgba(255,255,255,0.06)" : "#F3F4F6",
            overflow: "hidden"
          }}>
            <View style={{
              height: "100%",
              borderRadius: 4.5,
              backgroundColor: cardColor,
              width: `${percent}%`
            }} />
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number) {
  const startRad = (startAngle - 90) * (Math.PI / 180);
  const endRad = (endAngle - 90) * (Math.PI / 180);

  const x1 = x + radius * Math.cos(startRad);
  const y1 = y + radius * Math.sin(startRad);
  const x2 = x + radius * Math.cos(endRad);
  const y2 = y + radius * Math.sin(endRad);

  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`;
}

function DonutChart({
  slices,
  totalAmountText,
  totalLabelText = "Toplam Harcama",
  periodBadgeText = "Bu Ay",
  isDarkMode,
  surfaceColor,
  size = 210
}: {
  slices: DonutSlice[];
  totalAmountText: string;
  totalLabelText?: string;
  periodBadgeText?: string;
  isDarkMode: boolean;
  surfaceColor: string;
  size?: number;
}) {
  const center = size / 2;
  const strokeWidth = 26;
  const radius = (size - strokeWidth) / 2;
  const holeRadius = radius - strokeWidth / 2 - 4;

  const validSlices = slices.filter((s) => s.percentage > 0);
  const totalPercentage = validSlices.reduce((sum, s) => sum + s.percentage, 0);

  let currentAngle = 0;
  const gapAngle = validSlices.length > 1 ? 3 : 0; // Crisp 3-degree gap divider between color segments

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center", position: "relative" }}>
      <Svg width={size} height={size}>
        {/* Background Track Circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={isDarkMode ? "rgba(255,255,255,0.06)" : "#F3F4F6"}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Crisp Non-Overlapping Segment Arcs */}
        {validSlices.map((slice, idx) => {
          const sliceAngle = (slice.percentage / (totalPercentage || 100)) * 360;
          const start = currentAngle + gapAngle / 2;
          const end = currentAngle + sliceAngle - gapAngle / 2;
          currentAngle += sliceAngle;

          if (end <= start) return null;

          if (validSlices.length === 1 || sliceAngle >= 359.9) {
            return (
              <Circle
                key={idx}
                cx={center}
                cy={center}
                r={radius}
                stroke={slice.color}
                strokeWidth={strokeWidth}
                fill="none"
              />
            );
          }

          const pathD = describeArc(center, center, radius, start, end);

          return (
            <Path
              key={idx}
              d={pathD}
              stroke={slice.color}
              strokeWidth={strokeWidth}
              strokeLinecap="butt"
              fill="none"
            />
          );
        })}
      </Svg>

      {/* Center Hole */}
      <View
        style={{
          position: "absolute",
          width: holeRadius * 2,
          height: holeRadius * 2,
          borderRadius: holeRadius,
          backgroundColor: surfaceColor,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDarkMode ? 0.3 : 0.05,
          shadowRadius: 8,
          elevation: 3,
          zIndex: 10,
          paddingHorizontal: 8,
          gap: 2
        }}
      >
        <Text
          style={{
            fontSize: size > 160 ? 12 : 9.5,
            fontWeight: "600",
            color: isDarkMode ? "rgba(255,255,255,0.55)" : "#6B7280",
            textAlign: "center"
          }}
        >
          {totalLabelText}
        </Text>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
          style={{
            fontSize: size > 160 ? 21 : 13,
            fontWeight: "900",
            color: isDarkMode ? "#F9FAFB" : "#111827",
            textAlign: "center",
            marginVertical: 1
          }}
        >
          {totalAmountText}
        </Text>
        {periodBadgeText && (
          <View
            style={{
              backgroundColor: isDarkMode ? "rgba(0, 223, 137, 0.15)" : "rgba(75, 155, 88, 0.12)",
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 10,
              marginTop: 2
            }}
          >
            <Text
              style={{
                fontSize: 10,
                fontWeight: "800",
                color: isDarkMode ? "#00DF89" : "#4B9B58"
              }}
            >
              {periodBadgeText}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

function getSmartGoalIconAndColor(title: string): { icon: keyof typeof Feather.glyphMap; color: string; label: string } {
  const norm = title.toLowerCase().trim();
  if (norm.includes("motor") || norm.includes("motosiklet") || norm.includes("vespa") || norm.includes("scooter") || norm.includes("yamaha") || norm.includes("honda") || norm.includes("kawasaki")) {
    return { icon: "truck", color: "#DF7A12", label: "Motor / Motosiklet 🏍️" };
  }
  if (norm.includes("altın") || norm.includes("çeyrek") || norm.includes("yarım") || norm.includes("gram") || norm.includes("tam") || norm.includes("ziynet") || norm.includes("ata") || norm.includes("bilezik") || norm.includes("cumhuriyet")) {
    return { icon: "disc", color: "#F59E0B", label: "Altın Birikimi 🪙" };
  }
  if (norm.includes("laptop") || norm.includes("macbook") || norm.includes("bilgisayar") || norm.includes("pc") || norm.includes("ipad")) {
    return { icon: "tv", color: "#2563EB", label: "Teknoloji / PC 💻" };
  }
  if (norm.includes("iphone") || norm.includes("telefon") || norm.includes("samsung") || norm.includes("xiaomi")) {
    return { icon: "smartphone", color: "#8B5CF6", label: "Telefon 📱" };
  }
  if (norm.includes("araba") || norm.includes("otomobil") || norm.includes("araç") || norm.includes("suv") || norm.includes("mercedes") || norm.includes("bmw") || norm.includes("audi")) {
    return { icon: "truck", color: "#DC2626", label: "Otomobil 🚗" };
  }
  if (norm.includes("ev") || norm.includes("daire") || norm.includes("arsa") || norm.includes("konut") || norm.includes("tapu")) {
    return { icon: "home", color: "#059669", label: "Ev / Konut 🏠" };
  }
  if (norm.includes("tatil") || norm.includes("uçak") || norm.includes("gezi") || norm.includes("yurt dışı") || norm.includes("otel") || norm.includes("roma") || norm.includes("paris") || norm.includes("italya")) {
    return { icon: "send", color: "#0284C7", label: "Yurt Dışı Tatil ✈️" };
  }
  if (norm.includes("düğün") || norm.includes("nişan") || norm.includes("evlilik") || norm.includes("kına")) {
    return { icon: "heart", color: "#EC4899", label: "Düğün / Evlilik 💍" };
  }
  return { icon: "target", color: "#4B9B58", label: "Özel Birikim 🎯" };
}

function getCategoryKey(category?: string): string {
  if (!category) return "other";
  const normalized = category.toLowerCase().trim();
  if (normalized.includes("market") || normalized.includes("supermarket") || normalized.includes("gıda") || normalized.includes("bakkal") || normalized.includes("manav")) return "market";
  if (normalized.includes("sağlık") || normalized.includes("health") || normalized.includes("eczane") || normalized.includes("ilaç") || normalized.includes("ilac") || normalized.includes("doktor") || normalized.includes("hastane")) return "health";
  if (normalized.includes("ulaşım") || normalized.includes("transit") || normalized.includes("taksi") || normalized.includes("araç") || normalized.includes("arac") || normalized.includes("lastik") || normalized.includes("benzin") || normalized.includes("mazot") || normalized.includes("yakıt") || normalized.includes("otopark")) return "transport";
  if (normalized.includes("yemek") || normalized.includes("dining") || normalized.includes("restoran") || normalized.includes("cafe") || normalized.includes("kahve") || normalized.includes("döner") || normalized.includes("pizza") || normalized.includes("burger") || normalized.includes("lokanta")) return "dining";
  if (normalized.includes("giyim") || normalized.includes("clothing") || normalized.includes("moda") || normalized.includes("pantolon") || normalized.includes("ayakkabı") || normalized.includes("tişört") || normalized.includes("elbise")) return "clothing";
  if (normalized.includes("eğlence") || normalized.includes("entertainment") || normalized.includes("sosyal") || normalized.includes("netflix") || normalized.includes("sinema") || normalized.includes("tiyatro") || normalized.includes("bilet") || normalized.includes("oyun") || normalized.includes("spotify")) return "entertainment";
  if (normalized.includes("ev") || normalized.includes("kira") || normalized.includes("fatura") || normalized.includes("elektrik") || normalized.includes("su") || normalized.includes("doğalgaz") || normalized.includes("internet") || normalized.includes("aidat")) return "home";
  if (normalized.includes("teknoloji") || normalized.includes("elektronik") || normalized.includes("bilgisayar") || normalized.includes("telefon") || normalized.includes("kulaklık") || normalized.includes("cihaz")) return "tech";
  if (normalized.includes("birikim") || normalized.includes("yatırım") || normalized.includes("altın") || normalized.includes("borsa") || normalized.includes("hisse") || normalized.includes("fon") || normalized.includes("döviz")) return "investment";
  if (normalized.includes("eğitim") || normalized.includes("kurs") || normalized.includes("kitap") || normalized.includes("okul") || normalized.includes("ders")) return "education";
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
      return { name: "truck", bg: "rgba(37, 99, 235, 0.08)", color: "#2563EB" };
    case "clothing":
      return { name: "tag", bg: "rgba(124, 58, 237, 0.08)", color: "#7C3AED" };
    case "entertainment":
      return { name: "film", bg: "rgba(219, 39, 119, 0.08)", color: "#DB2777" };
    case "health":
      return { name: "activity", bg: "rgba(220, 38, 38, 0.08)", color: "#DC2626" };
    case "home":
      return { name: "home", bg: "rgba(5, 150, 105, 0.08)", color: "#059669" };
    case "tech":
      return { name: "tv", bg: "rgba(2, 132, 199, 0.08)", color: "#0284C7" };
    case "investment":
      return { name: "trending-up", bg: "rgba(245, 158, 11, 0.08)", color: "#F59E0B" };
    case "education":
      return { name: "book-open", bg: "rgba(79, 70, 229, 0.08)", color: "#4F46E5" };
    default:
      return { name: "package", bg: "rgba(107, 114, 128, 0.08)", color: "#6B7280" };
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
  const skipDay = useFinanceStore((state) => state.skipDay);
  const resetSimulatedDate = useFinanceStore((state) => state.resetSimulatedDate);
  const isHapticsEnabled = useFinanceStore((state) => state.isHapticsEnabled);

  const triggerHaptic = () => {
    if (isHapticsEnabled) {
      Vibration.vibrate(10);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.sheetKeyboardView}>
        <Pressable style={styles.sheetBackdrop} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: themeColors.surface, borderColor: themeColors.border, minHeight: verticalScale(380), maxHeight: "80%" }]}>
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

          {/* Developer Test Day Skip Buttons */}
          <View style={{ flexDirection: "row", gap: 10, width: "100%", marginBottom: 14 }}>
            <Pressable 
              onPress={() => {
                triggerHaptic();
                skipDay();
                Alert.alert(
                  language === "tr" ? "Gün Atlandı! 🚀" : "Day Skipped! 🚀",
                  language === "tr" 
                    ? "Sistemde 1 gün ileri atlandı. Günlük limitiniz sıfırlandı ve günlük birikim hedefiniz toplam birikiminize eklendi! 🐖✨"
                    : "1 day skipped in the system. Your daily limit is reset and daily target is added to total savings! 🐖✨"
                );
              }}
              style={({ pressed }) => [
                {
                  flex: 1.5,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  paddingVertical: 12,
                  paddingHorizontal: 12,
                  borderRadius: 14,
                  backgroundColor: isDarkMode ? "rgba(223, 122, 18, 0.12)" : "#FFF3E0",
                  borderWidth: 1.2,
                  borderColor: isDarkMode ? "rgba(223, 122, 18, 0.3)" : "#FFE0B2"
                },
                pressed && styles.pressed
              ]}
            >
              <Feather name="fast-forward" size={16} color="#DF7A12" />
              <Text style={{ fontSize: 12, fontWeight: "800", color: "#DF7A12" }}>
                {language === "tr" ? "🔧 1 Gün Atla" : "🔧 Skip 1 Day"}
              </Text>
            </Pressable>

            <Pressable 
              onPress={() => {
                triggerHaptic();
                resetSimulatedDate();
                Alert.alert(
                  language === "tr" ? "Tarih Sıfırlandı! 🔄" : "Date Reset! 🔄",
                  language === "tr" 
                    ? "Simüle edilen tarih başlangıç gününe sıfırlandı."
                    : "Simulated date was reset to the start day."
                );
              }}
              style={({ pressed }) => [
                {
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  paddingVertical: 12,
                  paddingHorizontal: 12,
                  borderRadius: 14,
                  backgroundColor: isDarkMode ? "rgba(255,255,255,0.06)" : "#F5F5F5",
                  borderWidth: 1.2,
                  borderColor: isDarkMode ? "rgba(255,255,255,0.15)" : "#E0E0E0"
                },
                pressed && styles.pressed
              ]}
            >
              <Feather name="refresh-cw" size={15} color={themeColors.text} />
              <Text style={{ fontSize: 12, fontWeight: "800", color: themeColors.text }}>
                {language === "tr" ? "Sıfırla" : "Reset"}
              </Text>
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
        <View style={[styles.sheet, { backgroundColor: themeColors.surface, borderColor: themeColors.border, minHeight: verticalScale(460), maxHeight: "90%" }]}>
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
                      onChangeText={(txt) => setLocalLimits(prev => ({ ...prev, [cat.key]: formatAmountInput(txt) }))}
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
                onChangeText={(val) => setTargetAmount(formatAmountInput(val))}
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
      <View style={[styles.sheetBackdrop, { justifyContent: "center", alignItems: "center" }]}>
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
        <View style={[styles.sheet, { backgroundColor: themeColors.surface, borderColor: themeColors.border, minHeight: verticalScale(450) }]}>
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
      <View style={[styles.sheetBackdrop, { justifyContent: "center", alignItems: "center" }]}>
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

function formatDetailDate(occurredAt?: string, language?: string) {
  if (!occurredAt) return "";
  const d = new Date(occurredAt);
  if (Number.isNaN(d.getTime())) return "";
  const locale = language === "tr" ? "tr-TR" : "en-US";
  return d.toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function ExpenseDetailModal({
  visible,
  onClose,
  expense,
  onDelete
}: {
  visible: boolean;
  onClose: () => void;
  expense: Expense | null;
  onDelete: (id: string) => void;
}) {
  if (!expense) return null;

  const isDarkMode = useFinanceStore((state) => state.isDarkMode);
  const themeColors = isDarkMode ? darkColors : lightColors;
  const language = useFinanceStore((state) => state.language);
  const updateExpense = useFinanceStore((state) => state.updateExpense);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(expense.label);
  const [editAmount, setEditAmount] = useState(String(expense.amount));

  useEffect(() => {
    if (expense) {
      setEditLabel(expense.label);
      setEditAmount(String(expense.amount));
      setIsEditing(false);
    }
  }, [expense]);

  const iconConfig = getCategoryIconConfig(expense.category);
  const formattedDate = formatDetailDate(expense.occurredAt, language);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.sheetKeyboardView}>
        <Pressable style={styles.sheetBackdrop} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: themeColors.surface, borderColor: themeColors.border, paddingBottom: 36 }]}>
          <View style={styles.sheetHandle} />
          
          {/* Category Icon & Title */}
          <View style={{ alignItems: "center", marginTop: 10, marginBottom: 20 }}>
            <View style={{
              width: 54,
              height: 54,
              borderRadius: 27,
              backgroundColor: iconConfig.bg,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 8
            }}>
              <Feather name={iconConfig.name} size={24} color={iconConfig.color} />
            </View>
            <Text style={{ fontSize: 18, fontWeight: "900", color: themeColors.primary }}>
              {expense.label}
            </Text>
            <Text style={{ fontSize: 12, fontWeight: "700", color: themeColors.textMuted, marginTop: 2 }}>
              {expense.category}{expense.subtitle && expense.subtitle !== expense.category ? ` • ${expense.subtitle}` : ""}
            </Text>
          </View>

          {/* Amount Display / Active Edit Input */}
          {isEditing ? (
            <View style={{
              backgroundColor: isDarkMode ? "rgba(0, 223, 137, 0.08)" : "rgba(75, 155, 88, 0.08)",
              borderRadius: 16,
              padding: 14,
              alignItems: "center",
              marginBottom: 20,
              borderWidth: 1.5,
              borderColor: isDarkMode ? "#00DF89" : "#4B9B58",
              width: "100%"
            }}>
              <Text style={{ fontSize: 11, fontWeight: "800", color: isDarkMode ? "#00DF89" : "#4B9B58", textTransform: "uppercase", marginBottom: 4 }}>
                ✏️ {language === "tr" ? "Yeni Harcama Tutarı (₺)" : "New Expense Amount (₺)"}
              </Text>
              <TextInput
                value={editAmount}
                onChangeText={setEditAmount}
                keyboardType="numeric"
                autoFocus
                style={{
                  fontSize: 28,
                  fontWeight: "900",
                  color: themeColors.text,
                  textAlign: "center",
                  width: "100%",
                  paddingVertical: 4
                }}
              />
            </View>
          ) : (
            <View style={{ 
              backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.02)" : "rgba(13, 50, 40, 0.02)", 
              borderRadius: 16, 
              padding: 16, 
              alignItems: "center",
              marginBottom: 20,
              borderWidth: 1,
              borderColor: themeColors.border
            }}>
              <Text style={{ fontSize: 12, fontWeight: "700", color: themeColors.textMuted, textTransform: "uppercase" }}>
                {language === "tr" ? "Harcama Tutarı" : "Expense Amount"}
              </Text>
              <Text style={{ fontSize: 28, fontWeight: "900", color: themeColors.text, marginTop: 4 }}>
                {formatCurrency(expense.amount)}
              </Text>
            </View>
          )}

          {/* Detail Rows Group */}
          <View style={[styles.formGroup, { backgroundColor: themeColors.surface, borderColor: themeColors.border, marginBottom: 24, paddingVertical: 4 }]}>
            {/* Expense Name Row */}
            <View style={styles.formRow}>
              <Text style={[styles.formLabel, { color: themeColors.textMuted }]}>
                {language === "tr" ? "Harcama Adı" : "Expense Name"}
              </Text>
              {isEditing ? (
                <TextInput
                  value={editLabel}
                  onChangeText={setEditLabel}
                  style={{
                    fontSize: 14,
                    fontWeight: "700",
                    color: themeColors.text,
                    textAlign: "right",
                    flex: 1,
                    backgroundColor: isDarkMode ? "rgba(255,255,255,0.06)" : "#F3F4F6",
                    borderRadius: 8,
                    paddingHorizontal: 10,
                    paddingVertical: 6
                  }}
                />
              ) : (
                <Text style={{ fontSize: 13, fontWeight: "700", color: themeColors.text, textAlign: "right", flex: 1 }}>
                  {expense.label}
                </Text>
              )}
            </View>

            <View style={[styles.formDivider, { backgroundColor: themeColors.border }]} />

            {/* Category Row */}
            <View style={styles.formRow}>
              <Text style={[styles.formLabel, { color: themeColors.textMuted }]}>
                {language === "tr" ? "Kategori" : "Category"}
              </Text>
              <Text style={{ fontSize: 13, fontWeight: "700", color: themeColors.text, textAlign: "right", flex: 1 }}>
                {expense.category}
              </Text>
            </View>

            {expense.subtitle && expense.subtitle !== expense.category ? (
              <>
                <View style={[styles.formDivider, { backgroundColor: themeColors.border }]} />
                {/* Subcategory Row */}
                <View style={styles.formRow}>
                  <Text style={[styles.formLabel, { color: themeColors.textMuted }]}>
                    {language === "tr" ? "Alt Kategori" : "Subcategory"}
                  </Text>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: themeColors.text, textAlign: "right", flex: 1 }}>
                    {expense.subtitle}
                  </Text>
                </View>
              </>
            ) : null}

            <View style={[styles.formDivider, { backgroundColor: themeColors.border }]} />

            {/* Date Row */}
            <View style={styles.formRow}>
              <Text style={[styles.formLabel, { color: themeColors.textMuted }]}>
                {language === "tr" ? "Tarih ve Saat" : "Date and Time"}
              </Text>
              <Text style={{ fontSize: 13, fontWeight: "700", color: themeColors.text, textAlign: "right", flex: 1 }}>
                {formattedDate}
              </Text>
            </View>
            
            <View style={[styles.formDivider, { backgroundColor: themeColors.border }]} />

            {/* Notes Row */}
            <View style={[styles.formRow, { alignItems: "flex-start", paddingVertical: 12 }]}>
              <Text style={[styles.formLabel, { color: themeColors.textMuted, marginTop: 1 }]}>
                {language === "tr" ? "Ek Açıklama" : "Note / Description"}
              </Text>
              <Text style={{ 
                fontSize: 13, 
                fontWeight: "600", 
                color: expense.note?.trim() ? themeColors.text : themeColors.textMuted, 
                textAlign: "right", 
                flex: 1,
                fontStyle: expense.note?.trim() ? "normal" : "italic"
              }}>
                {expense.note?.trim() || (language === "tr" ? "Açıklama girilmemiş" : "No description provided")}
              </Text>
            </View>
          </View>

          {/* Delete & Edit Buttons */}
          <View style={{ gap: 10 }}>
            {isEditing ? (
              <Pressable 
                style={({ pressed }) => [
                  {
                    height: 48,
                    borderRadius: 14,
                    backgroundColor: isDarkMode ? "#00DF89" : "#4B9B58",
                    alignItems: "center",
                    justifyContent: "center"
                  },
                  pressed && styles.pressed
                ]}
                onPress={() => {
                  const newAmt = parseAmount(editAmount);
                  if (newAmt > 0 && editLabel.trim()) {
                    updateExpense(expense.id, {
                      label: editLabel.trim(),
                      amount: newAmt
                    });
                  }
                  setIsEditing(false);
                  onClose();
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: "900", color: "#FFFFFF" }}>
                  {language === "tr" ? "Değişiklikleri Kaydet" : "Save Changes"}
                </Text>
              </Pressable>
            ) : (
              <View style={{ flexDirection: "row", gap: 10 }}>
                <Pressable 
                  style={({ pressed }) => [
                    {
                      flex: 1,
                      height: 48,
                      borderRadius: 14,
                      backgroundColor: "rgba(0, 223, 137, 0.12)",
                      borderWidth: 1.2,
                      borderColor: "rgba(0, 223, 137, 0.3)",
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8
                    },
                    pressed && styles.pressed
                  ]}
                  onPress={() => setIsEditing(true)}
                >
                  <Feather name="edit-3" size={16} color={isDarkMode ? "#00DF89" : "#4B9B58"} />
                  <Text style={{ fontSize: 14, fontWeight: "900", color: isDarkMode ? "#00DF89" : "#4B9B58" }}>
                    {language === "tr" ? "Düzenle" : "Edit"}
                  </Text>
                </Pressable>

                <Pressable 
                  style={({ pressed }) => [
                    {
                      flex: 1,
                      height: 48,
                      borderRadius: 14,
                      backgroundColor: "rgba(211, 47, 47, 0.1)",
                      borderWidth: 1.2,
                      borderColor: "rgba(211, 47, 47, 0.25)",
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8
                    },
                    pressed && styles.pressed
                  ]}
                  onPress={() => {
                    onDelete(expense.id);
                  }}
                >
                  <Feather name="trash-2" size={16} color="#D32F2F" />
                  <Text style={{ fontSize: 14, fontWeight: "900", color: "#D32F2F" }}>
                    {language === "tr" ? "Sil" : "Delete"}
                  </Text>
                </Pressable>
              </View>
            )}

            <Pressable 
              style={({ pressed }) => [
                {
                  height: 46,
                  borderRadius: 14,
                  backgroundColor: "rgba(0,0,0,0.04)",
                  alignItems: "center",
                  justifyContent: "center"
                },
                pressed && styles.pressed
              ]}
              onPress={onClose}
            >
              <Text style={{ fontSize: 14, fontWeight: "800", color: themeColors.text }}>
                {language === "tr" ? "Kapat" : "Close"}
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
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
    fontSize: 23,
    lineHeight: 28,
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
    width: 44,
    height: 44,
    borderRadius: 22,
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
    height: 158,
    borderRadius: 28,
    backgroundColor: colors.primary,
    overflow: "visible",
    paddingHorizontal: 18,
    paddingVertical: 14,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.22,
    shadowRadius: 30,
    elevation: 8
  },
  heroCopy: {
    width: "64%",
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
    marginTop: 0,
    fontSize: 32,
    lineHeight: 36,
    fontWeight: "900",
    color: colors.white
  },
  heroSubtitle: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "800",
    color: "rgba(255,255,255,0.72)"
  },
  savedAmountBlock: {
    marginTop: 1
  },
  savedAmountTitle: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "800",
    color: "rgba(255,255,255,0.68)"
  },
  savedAmountValue: {
    marginTop: 0,
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "900",
    color: colors.white
  },
  heroProgressTrack: {
    marginTop: 4,
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
    marginTop: 2,
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "900",
    color: "rgba(255,255,255,0.78)",
    textAlign: "left"
  },
  mascotSpeechBubbleWrapper: {
    position: "absolute",
    left: -70,
    right: -70,
    top: -44,
    alignItems: "center",
    zIndex: 9999,
    elevation: 10
  },
  mascotSpeechBubble: {
    backgroundColor: "#0D3228",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 9999
  },
  mascotSpeechBubbleText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
    lineHeight: 15
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
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center"
  },
  metric: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: "#ECE5DA",
    marginHorizontal: 2
  },
  metricIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center"
  },
  metricIconOrange: {
    backgroundColor: "transparent"
  },
  metricTitle: {
    marginTop: 2,
    fontSize: 11,
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
    marginTop: 10,
    flexDirection: "row",
    height: 52
  },
  mainAddButton: {
    flex: 1,
    height: "100%",
    borderRadius: 26,
    overflow: "hidden",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 4
  },
  addGradient: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    height: "100%"
  },
  addIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center"
  },
  addText: {
    marginLeft: 12,
    fontSize: 17,
    fontWeight: "800",
    color: colors.white
  },
  mainVoiceButton: {
    flex: 1,
    height: "100%",
    borderRadius: 22,
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
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8
  },
  sectionTitle: {
    flex: 1,
    fontSize: 17,
    lineHeight: 23,
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
    minHeight: verticalScale(210),
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
    backgroundColor: "rgba(17, 22, 20, 0.38)",
    justifyContent: "center",
    alignItems: "center"
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
    marginTop: 14,
    borderRadius: 20,
    backgroundColor: "rgba(13,50,40,0.03)",
    borderWidth: 1,
    borderColor: "rgba(13,50,40,0.05)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 64
  },
  speechBubbleInput: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    color: "#111614",
    padding: 0,
    margin: 0,
    textAlignVertical: "top"
  },
  micControlRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  sheetMicButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4
  },
  sheetMicButtonListening: {
    backgroundColor: "#DF7A12",
    shadowColor: "#DF7A12"
  },
  waveContainer: {
    flex: 1,
    height: 56,
    justifyContent: "center"
  },
  waveWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  waveBar: {
    width: 5,
    height: 20,
    borderRadius: 3,
    backgroundColor: colors.primary
  },
  micHelperText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#747C78"
  },
  formGroup: {
    marginTop: 14,
    borderRadius: 22,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "rgba(13,50,40,0.06)",
    paddingVertical: 2,
    overflow: "hidden"
  },
  formRow: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#747C78"
  },
  formInput: {
    flex: 1,
    textAlign: "right",
    fontSize: 14,
    fontWeight: "700",
    color: "#111614",
    paddingVertical: 10,
    paddingLeft: 16
  },
  formInputAmount: {
    flex: 1,
    textAlign: "right",
    fontSize: 20,
    fontWeight: "900",
    color: "#00DF89",
    paddingVertical: 10,
    paddingLeft: 16
  },
  formDivider: {
    height: 1,
    backgroundColor: "rgba(13,50,40,0.04)",
    marginHorizontal: 16
  },
  sheetActions: {
    marginTop: 18,
    flexDirection: "row",
    gap: 12
  },
  cancelButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 22,
    backgroundColor: "#EFE8DD",
    alignItems: "center",
    justifyContent: "center"
  },
  cancelButtonText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "800",
    color: "#111614"
  },
  saveButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center"
  },
  saveButtonText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "800",
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
    minHeight: verticalScale(130),
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
    paddingTop: 20,
    paddingBottom: 26,
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
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 7,
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
    fontSize: 18,
    fontWeight: "900",
    marginTop: 4,
    lineHeight: 22
  },
  profileCard: {
    marginTop: 16,
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
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

function GoalAchievedModal({
  visible,
  onClose,
  onNewPlan,
  onIncreaseGoal,
  savingsGoal,
  goalSavedAmount,
  language,
  themeColors,
  isDarkMode
}: {
  visible: boolean;
  onClose: () => void;
  onNewPlan: () => void;
  onIncreaseGoal: () => void;
  savingsGoal: any;
  goalSavedAmount: number;
  language: "tr" | "en";
  themeColors: any;
  isDarkMode: boolean;
}) {
  const target = Math.max(savingsGoal.targetAmount || 0, 1);
  const ratio = Math.min(goalSavedAmount / target, 1.0);
  const percent = Math.round(ratio * 100);

  let icon = "🥉🎉";
  let title = language === "tr" ? "Yolun Çeyreği Tamam!" : "First Quarter Reached!";
  let badgeText = language === "tr" ? "%25 BAŞARI ROZETİ" : "25% MILESTONE BADGE";
  let desc = language === "tr" ? "İlk adımı harika attın, birikim alışkanlığın güçleniyor!" : "Great start! Your savings habit is getting stronger!";

  if (percent >= 100) {
    icon = "🏆🎉";
    title = language === "tr" ? "Muazzam Başarı! Hedefe Tam Ulaştın!" : "Outstanding! Goal Fully Reached!";
    badgeText = language === "tr" ? "%100 ŞAMPİYONLUK KUPASI" : "100% CHAMPION TROPHY";
    desc = language === "tr" ? `Tebrikler! ${formatCurrency(goalSavedAmount)} biriktirerek hedefini %100 tamamladın.` : `Congrats! You saved ${formatCurrency(goalSavedAmount)} and fully met your goal.`;
  } else if (percent >= 75) {
    icon = "🥇✨";
    title = language === "tr" ? "Zirveye Çok Az Kaldı!" : "Almost at the Peak!";
    badgeText = language === "tr" ? "%75 İLERLEME ROZETİ" : "75% PROGRESS BADGE";
    desc = language === "tr" ? "Disiplinin meyvesini veriyor, hedefine adım adım yaklaştın!" : "Your discipline pays off, you are step by step to your goal!";
  } else if (percent >= 50) {
    icon = "🥈🔥";
    title = language === "tr" ? "Yolun Yarısı Kat Edildi!" : "Halfway There!";
    badgeText = language === "tr" ? "%50 GELİŞİM ROZETİ" : "50% GROWTH BADGE";
    desc = language === "tr" ? "Hedefinin tam yarısına ulaştın, temposunu koru!" : "You hit half of your target, keep this great pace!";
  } else {
    icon = "🚀💪";
    title = language === "tr" ? "Birikim Yolculuğu Başladı!" : "Savings Journey Started!";
    badgeText = language === "tr" ? "İLERLEME TAKİBİ" : "PROGRESS TRACKING";
    desc = language === "tr" ? `Henüz dönemin başındasın! Şu ana kadar ${formatCurrency(goalSavedAmount)} biriktirdin. Günlük limitlerine uyarak hedefine emin adımlarla ilerleyebilirsin.` : `You are at the start of your period! You saved ${formatCurrency(goalSavedAmount)} so far. Stay within your limits to reach your goal.`;
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "center", alignItems: "center", padding: 20 }}>
        <View style={{ width: "100%", maxWidth: 360, backgroundColor: themeColors.surface, borderRadius: 28, padding: 24, alignItems: "center", borderWidth: 1.5, borderColor: "rgba(0, 229, 143, 0.4)" }}>
          <Text style={{ fontSize: 48, marginBottom: 8 }}>{icon}</Text>
          
          <View style={{ backgroundColor: "rgba(0, 229, 143, 0.12)", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10, marginBottom: 12 }}>
            <Text style={{ fontSize: 10, fontWeight: "900", color: "#00E58F", letterSpacing: 0.5 }}>{badgeText}</Text>
          </View>

          <Text style={{ fontSize: 19, fontWeight: "900", color: themeColors.text, textAlign: "center", marginBottom: 6 }}>
            {title}
          </Text>
          
          <Text style={{ fontSize: 12.5, fontWeight: "600", color: themeColors.textMuted, textAlign: "center", marginBottom: 20, lineHeight: 18 }}>
            {desc}
          </Text>

          <Pressable
            onPress={onIncreaseGoal}
            style={{ width: "100%", paddingVertical: 14, borderRadius: 16, backgroundColor: "#00E58F", alignItems: "center", marginBottom: 10 }}
          >
            <Text style={{ fontSize: 14, fontWeight: "900", color: "#031D14" }}>
              {language === "tr" ? "Birikim Hedefini Yükselt 📈" : "Increase Savings Goal 📈"}
            </Text>
          </Pressable>

          <Pressable
            onPress={onNewPlan}
            style={{ width: "100%", paddingVertical: 14, borderRadius: 16, backgroundColor: isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)", alignItems: "center", borderWidth: 1, borderColor: themeColors.border }}
          >
            <Text style={{ fontSize: 14, fontWeight: "800", color: themeColors.text }}>
              {language === "tr" ? "Yeni 30 Günlük Dönem Başlat 🚀" : "Start New 30-Day Period 🚀"}
            </Text>
          </Pressable>

          <Pressable onPress={onClose} style={{ marginTop: 14 }}>
            <Text style={{ fontSize: 12, fontWeight: "700", color: themeColors.textMuted }}>
              {language === "tr" ? "Kapat" : "Close"}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function LegalModal({
  visible,
  onClose,
  legalTab,
  setLegalTab,
  language,
  themeColors,
  isDarkMode
}: {
  visible: boolean;
  onClose: () => void;
  legalTab: "terms" | "privacy" | "disclaimer";
  setLegalTab: (tab: "terms" | "privacy" | "disclaimer") => void;
  language: "tr" | "en";
  themeColors: any;
  isDarkMode: boolean;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "flex-end" }}>
        <View style={{ width: "100%", height: "82%", backgroundColor: themeColors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Feather name="file-text" size={20} color="#00E58F" />
              <Text style={{ fontSize: 18, fontWeight: "900", color: themeColors.text }}>
                {language === "tr" ? "Hukuki & Gizlilik Metinleri" : "Legal & Privacy Terms"}
              </Text>
            </View>
            <Pressable onPress={onClose} style={{ padding: 4 }}>
              <Feather name="x" size={22} color={themeColors.textMuted} />
            </Pressable>
          </View>

          {/* Tab Selector */}
          <View style={{ flexDirection: "row", backgroundColor: isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", borderRadius: 14, padding: 3, marginBottom: 16 }}>
            <Pressable
              onPress={() => setLegalTab("terms")}
              style={{ flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 12, backgroundColor: legalTab === "terms" ? "#00E58F" : "transparent" }}
            >
              <Text style={{ fontSize: 11, fontWeight: "900", color: legalTab === "terms" ? "#031D14" : themeColors.textMuted }}>
                {language === "tr" ? "Kullanım Koşulları" : "Terms"}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setLegalTab("privacy")}
              style={{ flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 12, backgroundColor: legalTab === "privacy" ? "#00E58F" : "transparent" }}
            >
              <Text style={{ fontSize: 11, fontWeight: "900", color: legalTab === "privacy" ? "#031D14" : themeColors.textMuted }}>
                {language === "tr" ? "Gizlilik" : "Privacy"}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setLegalTab("disclaimer")}
              style={{ flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 12, backgroundColor: legalTab === "disclaimer" ? "#00E58F" : "transparent" }}
            >
              <Text style={{ fontSize: 11, fontWeight: "900", color: legalTab === "disclaimer" ? "#031D14" : themeColors.textMuted }}>
                {language === "tr" ? "Sorumluluk Reddi" : "Disclaimer"}
              </Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
            {legalTab === "terms" && (
              <View style={{ gap: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: "900", color: themeColors.text }}>1. Lisans ve Kullanım Şartları</Text>
                <Text style={{ fontSize: 12, lineHeight: 18, color: themeColors.textMuted, fontWeight: "600" }}>
                  Birikim Yap uygulaması, kişisel finansal planlama ve bütçe takibi amacıyla kullanıcıya sunulmuştur. Uygulama içerisindeki tüm görsel, yazılımsal ve algoritma hakları saklıdır.
                </Text>
                <Text style={{ fontSize: 14, fontWeight: "900", color: themeColors.text, marginTop: 8 }}>2. Kullanıcı Yükümlülükleri</Text>
                <Text style={{ fontSize: 12, lineHeight: 18, color: themeColors.textMuted, fontWeight: "600" }}>
                  Kullanıcı, uygulamaya girdiği verilerin doğruluğundan bizzat sorumludur. Cihaz güvenliği ve yerel verilerin korunması kullanıcının kendi sorumluluğundadır.
                </Text>
              </View>
            )}

            {legalTab === "privacy" && (
              <View style={{ gap: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: "900", color: themeColors.text }}>1. %100 Yerel Veri Gizliliği (KVKK / GDPR)</Text>
                <Text style={{ fontSize: 12, lineHeight: 18, color: themeColors.textMuted, fontWeight: "600" }}>
                  Birikim Yap uygulaması, bütçe, gelir ve harcama verilerinizi hiçbir harici sunucuya veya 3. şahısa AKTARMAZ. Tüm verileriniz yalnızca kendi cihazınızın güvenli yerel hafızasında (AsyncStorage) şifreli biçimde saklanır.
                </Text>
                <Text style={{ fontSize: 14, fontWeight: "900", color: themeColors.text, marginTop: 8 }}>2. Sesli Harcama ve İzinler</Text>
                <Text style={{ fontSize: 12, lineHeight: 18, color: themeColors.textMuted, fontWeight: "600" }}>
                  Sesli harcama özelliği için kullanılan mikrofon izinleri yalnızca anlık harcama kaydı dönüştürme işlemi için cihaz üzerinde işlenir ve hiçbir ses kaydı harici sunucularda depolanmaz.
                </Text>
              </View>
            )}

            {legalTab === "disclaimer" && (
              <View style={{ gap: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: "900", color: themeColors.text }}>1. Finansal Danışmanlık Reddi Beyanı</Text>
                <Text style={{ fontSize: 12, lineHeight: 18, color: themeColors.textMuted, fontWeight: "600" }}>
                  Bu uygulama resmi bir yatırım, finans, vergi veya bankacılık danışmanlığı aracı DEĞİLDİR. Uygulama içerisindeki limitler, grafikler, dengeleme tavsiyeleri ve hesaplamalar yalnızca kişisel takip ve bilgilendirme amaçlı algoritmik simülasyonlardır.
                </Text>
                <Text style={{ fontSize: 14, fontWeight: "900", color: themeColors.text, marginTop: 8 }}>2. Sorumluluk Sınırı</Text>
                <Text style={{ fontSize: 12, lineHeight: 18, color: themeColors.textMuted, fontWeight: "600" }}>
                  Gürkan Aygün / Birikim Yap, kullanıcının finansal kararlarından, harcamalarından veya bütçe sonuçlarından doğabilecek doğrudan ya da dolaylı zararlardan sorumlu tutulamaz.
                </Text>
              </View>
            )}
          </ScrollView>

          <Pressable
            onPress={onClose}
            style={{ width: "100%", paddingVertical: 14, borderRadius: 16, backgroundColor: "#00E58F", alignItems: "center", marginTop: 10 }}
          >
            <Text style={{ fontSize: 14, fontWeight: "900", color: "#031D14" }}>
              {language === "tr" ? "Anladım ve Kabul Ediyorum" : "I Understand & Accept"}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
