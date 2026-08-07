import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { Expense, FamilyGroup, FinancePlan, GoalItem, Income, Period, SavingsGoal } from "@/models/finance";
import {
  calculateFinancePlan,
  getDailyLimit as calculateDailyLimit,
  getExpensesTotalForPeriod as calculateExpensesTotalForPeriod,
  getMonthlyLimit as calculateMonthlyLimit,
  getMonthlyRemaining as calculateMonthlyRemaining,
  getRemainingLimitForPeriod as calculateRemainingLimitForPeriod,
  getSpendableMonthlyBudget as calculateSpendableMonthlyBudget,
  getTotalFixedExpenses as calculateTotalFixedExpenses,
  getTotalIncome as calculateTotalIncome,
  getWeeklyLimit as calculateWeeklyLimit,
  getSimulatedDate,
  getZeroSpendingStreak
} from "@/utils/finance";
import { parseAmount } from "@/utils/currency";
import { getLiveExchangeRates } from "@/utils/exchangeRates";

type FinanceState = {
  hasHydrated: boolean;
  incomes: Income[];
  expenses: Expense[];
  savingsGoal: SavingsGoal;
  goals: GoalItem[];
  selectedPeriod: Period;
  plan: FinancePlan;
  setIncomes: (incomes: Income[]) => void;
  setExpenses: (expenses: Expense[]) => void;
  setFixedExpenses: (expenses: Expense[]) => void;
  addExpense: (expense: Expense) => void;
  updateExpense: (id: string, updatedData: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  addGoal: (goal: Omit<GoalItem, "id" | "createdAt">) => void;
  updateGoal: (id: string, goal: Partial<GoalItem>) => void;
  deleteGoal: (id: string) => void;
  addAmountToGoal: (id: string, amount: number) => void;
  setSavingsGoal: (savingsGoal: SavingsGoal) => void;
  setMonthlySavings: (amount: number) => void;
  setSelectedPeriod: (period: Period) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
  refreshPlan: () => void;
  getTotalIncome: () => number;
  getTotalFixedExpenses: () => number;
  getMonthlyRemaining: () => number;
  getSpendableMonthlyBudget: () => number;
  getDailyLimit: () => number;
  getWeeklyLimit: () => number;
  getMonthlyLimit: () => number;
  getExpensesTotalForPeriod: (period: Period) => number;
  getRemainingLimitForPeriod: (period: Period) => number;
  isDarkMode: boolean;
  setIsDarkMode: (enabled: boolean) => void;
  isHapticsEnabled: boolean;
  setIsHapticsEnabled: (enabled: boolean) => void;
  isSmartNotificationsEnabled: boolean;
  setIsSmartNotificationsEnabled: (enabled: boolean) => void;
  isLiveActivityEnabled: boolean;
  setIsLiveActivityEnabled: (enabled: boolean) => void;
  language: "tr" | "en";
  setLanguage: (lang: "tr" | "en") => void;
  currency: "TRY" | "USD" | "EUR";
  setCurrency: (currency: "TRY" | "USD" | "EUR") => void;
  exchangeRates: Record<string, number>;
  lastRatesUpdated: string;
  fetchExchangeRates: () => Promise<void>;
  categoryLimits: Record<string, number>;
  setCategoryLimit: (categoryKey: string, amount: number) => void;
  simulatedDateOffsetDays: number;
  skipDay: () => void;
  resetSimulatedDate: () => void;
  getZeroSpendingStreak: () => number;
  monthlyArchives: Array<{
    id: string;
    monthKey: string;
    monthTitle: string;
    targetSavings: number;
    achievedSavings: number;
    totalSpent: number;
    spendableBudget: number;
    isSuccess: boolean;
  }>;
  addMonthlyArchiveRecord: (record: {
    id: string;
    monthKey: string;
    monthTitle: string;
    targetSavings: number;
    achievedSavings: number;
    totalSpent: number;
    spendableBudget: number;
    isSuccess: boolean;
  }) => void;
  userProfile: { id: string; email: string; fullName: string } | null;
  setUserProfile: (profile: { id: string; email: string; fullName: string } | null) => void;
  hasCompletedOnboarding: boolean;
  setHasCompletedOnboarding: (completed: boolean) => void;
  streakCount: number;
  lastLoggedDate: string;
  unlockedBadges: string[];
  xpPoints: number;
  familyGroup: FamilyGroup | null;
  pendingInviteCode: string | null;
  generateInviteCode: () => string;
  createFamilyGroup: (ownerName?: string) => FamilyGroup;
  joinFamilyGroup: (inviteCode: string, partnerName?: string) => { success: boolean; error?: string };
  leaveFamilyGroup: () => void;
  updateStreakAndCheckBadges: (addedExpenseAmount?: number) => { newBadgeId?: string; streakIncreased?: boolean; newStreakCount?: number; xpGained?: number } | null;
  resetAllData: () => void;
};

const initialIncomes: Income[] = [
  { id: "salary", label: "Maaş", amount: 0, period: "monthly" },
  { id: "freelance", label: "Freelance", amount: 0, period: "monthly" },
  { id: "extra", label: "Ek gelir", amount: 0, period: "monthly" }
];

const initialFixedExpenses: Expense[] = [
  { id: "rent", label: "Kira", amount: 0, period: "monthly", isFixed: true },
  { id: "bills", label: "Faturalar", amount: 0, period: "monthly", isFixed: true },
  { id: "transport", label: "Ulaşım", amount: 0, period: "monthly", isFixed: true }
];

const initialGoal: SavingsGoal = {
  title: "Acil durum",
  selectedGoal: "Acil durum",
  targetAmount: 0,
  currentAmount: 0,
  monthlyContribution: 0,
  dailyTarget: 0,
  planStartDate: new Date().toISOString()
};

export const initialGoals: GoalItem[] = [
  {
    id: "goal_1",
    title: "Yurt Dışı Gezi ✈️",
    targetAmount: 25000,
    currentAmount: 18500,
    targetDate: "Mayıs 2025",
    icon: "plane",
    color: "#4B9B58",
    createdAt: new Date().toISOString()
  },
  {
    id: "goal_2",
    title: "Tatil ☀️",
    targetAmount: 15000,
    currentAmount: 7200,
    targetDate: "Ağustos 2025",
    icon: "sun",
    color: "#F59E0B",
    createdAt: new Date().toISOString()
  },
  {
    id: "goal_3",
    title: "Ev Peşinatı 🏠",
    targetAmount: 200000,
    currentAmount: 85000,
    targetDate: "Aralık 2026",
    icon: "home",
    color: "#10B981",
    createdAt: new Date().toISOString()
  },
  {
    id: "goal_4",
    title: "Yeni Laptop 💻",
    targetAmount: 30000,
    currentAmount: 12300,
    targetDate: "Kasım 2025",
    icon: "laptop",
    color: "#8B5CF6",
    createdAt: new Date().toISOString()
  }
];

const initialPeriod: Period = "daily";
const initialPlan = calculateFinancePlan(initialIncomes, initialFixedExpenses, initialGoal, initialPeriod);

function normalizeAmount(amount: unknown) {
  if (typeof amount === "number") {
    return Number.isFinite(amount) ? Math.max(amount, 0) : 0;
  }

  if (typeof amount === "string") {
    return Math.max(parseAmount(amount), 0);
  }

  return 0;
}

function normalizeIncome(income: Income): Income {
  return {
    ...income,
    amount: normalizeAmount(income.amount)
  };
}

function normalizeExpense(expense: Expense): Expense {
  return {
    ...expense,
    amount: normalizeAmount(expense.amount)
  };
}

function normalizeSavingsGoal(savingsGoal: SavingsGoal, monthlyRemaining: number): SavingsGoal {
  const monthlyContribution = Math.min(normalizeAmount(savingsGoal.monthlyContribution), monthlyRemaining);
  
  // Safely retrieve existing planStartDate from current state if available to prevent overwrite
  let existingStartDate: string | undefined;
  try {
    existingStartDate = useFinanceStore.getState()?.savingsGoal?.planStartDate;
  } catch (e) {
    // State might not be initialized yet
  }
  const planStartDate = savingsGoal.planStartDate || existingStartDate || new Date().toISOString();

  return {
    ...initialGoal,
    ...savingsGoal,
    targetAmount: normalizeAmount(savingsGoal.targetAmount),
    currentAmount: normalizeAmount(savingsGoal.currentAmount),
    monthlyContribution,
    dailyTarget: monthlyContribution / 30,
    planStartDate
  };
}

function createPlan(incomes: Income[], expenses: Expense[], savingsGoal: SavingsGoal, selectedPeriod: Period, now = new Date()) {
  const monthlyRemaining = calculateMonthlyRemaining(incomes, expenses);
  const normalizedSavingsGoal = normalizeSavingsGoal(savingsGoal, monthlyRemaining);

  return {
    savingsGoal: normalizedSavingsGoal,
    plan: calculateFinancePlan(incomes, expenses, normalizedSavingsGoal, selectedPeriod, now)
  };
}

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set, get) => ({
      hasHydrated: false,
      userProfile: null,
      setUserProfile: (userProfile) => set({ userProfile }),
      hasCompletedOnboarding: false,
      setHasCompletedOnboarding: (hasCompletedOnboarding) => set({ hasCompletedOnboarding }),
      simulatedDateOffsetDays: 0,
      incomes: initialIncomes,
      expenses: initialFixedExpenses,
      savingsGoal: initialGoal,
      selectedPeriod: initialPeriod,
      plan: initialPlan,
      isDarkMode: false,
      setIsDarkMode: (isDarkMode) => set({ isDarkMode }),
      isHapticsEnabled: true,
      setIsHapticsEnabled: (isHapticsEnabled) => set({ isHapticsEnabled }),
      isSmartNotificationsEnabled: true,
      setIsSmartNotificationsEnabled: (isSmartNotificationsEnabled) => set({ isSmartNotificationsEnabled }),
      isLiveActivityEnabled: true,
      setIsLiveActivityEnabled: (isLiveActivityEnabled) => set({ isLiveActivityEnabled }),
      streakCount: 1,
      lastLoggedDate: new Date().toISOString().split("T")[0],
      unlockedBadges: ["first_expense"],
      xpPoints: 100,
      familyGroup: null,
      pendingInviteCode: null,
      generateInviteCode: () => {
        const state = get();
        if (state.pendingInviteCode) return state.pendingInviteCode;
        const code = `BRK-${Math.floor(1000 + Math.random() * 9000)}`;
        set({ pendingInviteCode: code });
        return code;
      },
      createFamilyGroup: (ownerName) => {
        const state = get();
        const code = state.pendingInviteCode || `BRK-${Math.floor(1000 + Math.random() * 9000)}`;
        const group: FamilyGroup = {
          id: `fam_${Date.now()}`,
          name: `${ownerName || state.userProfile?.fullName || "Aileniz"}'in Aile Bütçesi 👥`,
          inviteCode: code,
          isOwner: true,
          ownerName: ownerName || state.userProfile?.fullName || "Siz",
          createdAt: new Date().toISOString()
        };
        set({ familyGroup: group, pendingInviteCode: null });
        return group;
      },
      joinFamilyGroup: (inviteCode, partnerName) => {
        const cleanCode = inviteCode.trim().toUpperCase();
        if (!cleanCode || cleanCode.length < 4) {
          return { success: false, error: "Geçersiz veya eksik aile kodu." };
        }
        const state = get();
        const group: FamilyGroup = {
          id: `fam_joined_${Date.now()}`,
          name: `Ortak Aile Bütçesi 👥`,
          inviteCode: cleanCode,
          isOwner: false,
          ownerName: "Eşiniz",
          partnerName: partnerName || state.userProfile?.fullName || "Siz",
          createdAt: new Date().toISOString()
        };
        set({ familyGroup: group, pendingInviteCode: null });
        return { success: true };
      },
      leaveFamilyGroup: () => set({ familyGroup: null, pendingInviteCode: null }),
      updateStreakAndCheckBadges: (addedExpenseAmount) => {
        const state = get();
        const todayStr = new Date().toISOString().split("T")[0];
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];

        let newStreak = state.streakCount || 1;
        let streakIncreased = false;

        if (state.lastLoggedDate !== todayStr) {
          if (state.lastLoggedDate === yesterdayStr) {
            newStreak += 1;
          } else {
            newStreak = 1;
          }
          streakIncreased = true;
        }

        let newBadges = [...(state.unlockedBadges || ["first_expense"])];
        let newlyUnlockedBadgeId: string | undefined = undefined;
        let xpGained = 50;

        if (!newBadges.includes("first_expense") && state.expenses.length > 0) {
          newBadges.push("first_expense");
          newlyUnlockedBadgeId = "first_expense";
          xpGained += 50;
        }

        if (newStreak >= 7 && !newBadges.includes("streak_7")) {
          newBadges.push("streak_7");
          newlyUnlockedBadgeId = "streak_7";
          xpGained += 150;
        }

        if (newStreak >= 30 && !newBadges.includes("streak_30")) {
          newBadges.push("streak_30");
          newlyUnlockedBadgeId = "streak_30";
          xpGained += 500;
        }

        set({
          streakCount: newStreak,
          lastLoggedDate: todayStr,
          unlockedBadges: newBadges,
          xpPoints: (state.xpPoints || 100) + xpGained
        });

        if (streakIncreased || newlyUnlockedBadgeId) {
          return {
            newBadgeId: newlyUnlockedBadgeId,
            streakIncreased,
            newStreakCount: newStreak,
            xpGained
          };
        }
        return null;
      },
      monthlyArchives: [],
      addMonthlyArchiveRecord: (record) => {
        set((state) => {
          const exists = state.monthlyArchives.some((item) => item.monthKey === record.monthKey);
          if (exists) {
            return {
              monthlyArchives: state.monthlyArchives.map((item) => item.monthKey === record.monthKey ? record : item)
            };
          }
          return {
            monthlyArchives: [record, ...state.monthlyArchives]
          };
        });
      },
      goals: initialGoals,
      addGoal: (goalData) => {
        const newGoal: GoalItem = {
          ...goalData,
          id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          createdAt: new Date().toISOString()
        };
        set((state) => ({
          goals: [newGoal, ...(state.goals || [])]
        }));
      },
      updateGoal: (id, updatedData) => {
        set((state) => ({
          goals: (state.goals || []).map((g) => (g.id === id ? { ...g, ...updatedData } : g))
        }));
      },
      deleteGoal: (id) => {
        set((state) => ({
          goals: (state.goals || []).filter((g) => g.id !== id)
        }));
      },
      addAmountToGoal: (id, amount) => {
        set((state) => ({
          goals: (state.goals || []).map((g) => {
            if (g.id === id) {
              const newCurrent = Math.max((g.currentAmount || 0) + amount, 0);
              return { ...g, currentAmount: newCurrent };
            }
            return g;
          })
        }));
      },
      language: "tr",
      categoryLimits: {},
      setCategoryLimit: (categoryKey, amount) => {
        set((state) => ({
          categoryLimits: {
            ...state.categoryLimits,
            [categoryKey]: Math.max(amount, 0)
          }
        }));
      },
      setLanguage: (language) => {
        set({ language });
        get().setCurrency(language === "tr" ? "TRY" : "USD");
      },
      currency: "TRY",
      exchangeRates: { TRY: 1, USD: 0.025, EUR: 0.023, GBP: 0.019 },
      lastRatesUpdated: "İşleniyor...",
      fetchExchangeRates: async () => {
        const result = await getLiveExchangeRates();
        set({
          exchangeRates: result.rates,
          lastRatesUpdated: result.lastUpdated,
        });
      },
      setCurrency: (newCurrency) => {
        const prevCurrency = get().currency;
        if (prevCurrency === newCurrency) return;

        const convert = (val: number) => {
          const liveRates = get().exchangeRates || { TRY: 1, USD: 0.025, EUR: 0.023 };
          const fromRate = liveRates[prevCurrency] || 1;
          const toRate = liveRates[newCurrency] || 1;
          
          const amountInTRY = val / fromRate;
          const converted = amountInTRY * toRate;
          return Math.round(converted * 100) / 100;
        };

        const incomes = get().incomes.map((income) => ({
          ...income,
          amount: convert(income.amount)
        }));

        const expenses = get().expenses.map((expense) => ({
          ...expense,
          amount: convert(expense.amount)
        }));

        const oldGoal = get().savingsGoal;
        const savingsGoal = {
          ...oldGoal,
          targetAmount: convert(oldGoal.targetAmount),
          currentAmount: convert(oldGoal.currentAmount),
          monthlyContribution: convert(oldGoal.monthlyContribution),
          dailyTarget: convert(oldGoal.dailyTarget)
        };

        const oldCategoryLimits = get().categoryLimits || {};
        const categoryLimits: Record<string, number> = {};
        Object.entries(oldCategoryLimits).forEach(([key, val]) => {
          categoryLimits[key] = convert(val);
        });

        const { selectedPeriod } = get();
        const next = createPlan(incomes, expenses, savingsGoal, selectedPeriod, getSimulatedDate(get().simulatedDateOffsetDays));

        set({
          currency: newCurrency,
          incomes,
          expenses,
          savingsGoal: next.savingsGoal,
          plan: next.plan,
          categoryLimits
        });
      },
      setIncomes: (incomes) => {
        const normalizedIncomes = incomes.map(normalizeIncome);
        const { expenses, savingsGoal, selectedPeriod } = get();
        const next = createPlan(normalizedIncomes, expenses, savingsGoal, selectedPeriod, getSimulatedDate(get().simulatedDateOffsetDays));

        console.log("[finance-store] setIncomes", {
          incomes: normalizedIncomes,
          totalIncome: calculateTotalIncome(normalizedIncomes),
          fixedExpenses: expenses.filter((expense) => expense.isFixed),
          totalFixedExpenses: calculateTotalFixedExpenses(expenses),
          monthlyRemaining: next.plan.monthlyRemaining
        });

        set({
          incomes: normalizedIncomes,
          savingsGoal: next.savingsGoal,
          plan: next.plan
        });
      },
      setExpenses: (expenses) => {
        const normalizedExpenses = expenses.map(normalizeExpense);
        const { incomes, savingsGoal, selectedPeriod } = get();
        const next = createPlan(incomes, normalizedExpenses, savingsGoal, selectedPeriod, getSimulatedDate(get().simulatedDateOffsetDays));

        set({
          expenses: normalizedExpenses,
          savingsGoal: next.savingsGoal,
          plan: next.plan
        });
      },
      setFixedExpenses: (fixedExpenses) => {
        const normalizedFixedExpenses = fixedExpenses.map((expense) => normalizeExpense({ ...expense, isFixed: true }));
        const variableExpenses = get().expenses.filter((expense) => !expense.isFixed);
        const expenses = [...normalizedFixedExpenses, ...variableExpenses];
        const { incomes, savingsGoal, selectedPeriod } = get();
        const next = createPlan(incomes, expenses, savingsGoal, selectedPeriod, getSimulatedDate(get().simulatedDateOffsetDays));

        console.log("[finance-store] setFixedExpenses", {
          incomes,
          totalIncome: calculateTotalIncome(incomes),
          fixedExpenses: normalizedFixedExpenses,
          totalFixedExpenses: calculateTotalFixedExpenses(normalizedFixedExpenses),
          monthlyRemaining: next.plan.monthlyRemaining
        });

        set({
          expenses,
          savingsGoal: next.savingsGoal,
          plan: next.plan
        });
      },
      addExpense: (expense) => {
        const simulatedExpense = {
          ...expense,
          occurredAt: getSimulatedDate(get().simulatedDateOffsetDays).toISOString()
        };
        const expenses = [normalizeExpense(simulatedExpense), ...get().expenses];
        const { incomes, savingsGoal, selectedPeriod } = get();
        const next = createPlan(incomes, expenses, savingsGoal, selectedPeriod, getSimulatedDate(get().simulatedDateOffsetDays));

        set({
          expenses,
          savingsGoal: next.savingsGoal,
          plan: next.plan
        });
      },
      deleteExpense: (id: string) => {
        const expenses = get().expenses.filter((e) => e.id !== id);
        const { incomes, savingsGoal, selectedPeriod } = get();
        const next = createPlan(incomes, expenses, savingsGoal, selectedPeriod, getSimulatedDate(get().simulatedDateOffsetDays));

        set({
          expenses,
          savingsGoal: next.savingsGoal,
          plan: next.plan
        });
      },
      updateExpense: (id: string, updatedData: Partial<Expense>) => {
        const expenses = get().expenses.map((e) => {
          if (e.id === id) {
            return normalizeExpense({ ...e, ...updatedData });
          }
          return e;
        });
        const { incomes, savingsGoal, selectedPeriod } = get();
        const next = createPlan(incomes, expenses, savingsGoal, selectedPeriod, getSimulatedDate(get().simulatedDateOffsetDays));

        set({
          expenses,
          savingsGoal: next.savingsGoal,
          plan: next.plan
        });
      },
      setSavingsGoal: (savingsGoal) => {
        const { incomes, expenses, selectedPeriod } = get();
        const next = createPlan(incomes, expenses, savingsGoal, selectedPeriod, getSimulatedDate(get().simulatedDateOffsetDays));

        set({
          savingsGoal: next.savingsGoal,
          plan: next.plan
        });
      },
      setMonthlySavings: (amount) => {
        const { savingsGoal } = get();
        get().setSavingsGoal({ ...savingsGoal, monthlyContribution: normalizeAmount(amount) });
      },
      setSelectedPeriod: (selectedPeriod) => {
        const { incomes, expenses, savingsGoal } = get();
        const next = createPlan(incomes, expenses, savingsGoal, selectedPeriod, getSimulatedDate(get().simulatedDateOffsetDays));

        set({
          selectedPeriod,
          savingsGoal: next.savingsGoal,
          plan: next.plan
        });
      },
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      refreshPlan: () => {
        const incomes = get().incomes.map(normalizeIncome);
        const expenses = get().expenses.map(normalizeExpense);
        const { savingsGoal, selectedPeriod } = get();
        const next = createPlan(incomes, expenses, savingsGoal, selectedPeriod, getSimulatedDate(get().simulatedDateOffsetDays));

        set({
          incomes,
          expenses,
          savingsGoal: next.savingsGoal,
          plan: next.plan
        });
      },
      getTotalIncome: () => calculateTotalIncome(get().incomes),
      getTotalFixedExpenses: () => calculateTotalFixedExpenses(get().expenses),
      getMonthlyRemaining: () => calculateMonthlyRemaining(get().incomes, get().expenses),
      getSpendableMonthlyBudget: () => calculateSpendableMonthlyBudget(get().incomes, get().expenses, get().savingsGoal),
      getDailyLimit: () => calculateDailyLimit(get().incomes, get().expenses, get().savingsGoal, getSimulatedDate(get().simulatedDateOffsetDays)),
      getWeeklyLimit: () => calculateWeeklyLimit(get().incomes, get().expenses, get().savingsGoal),
      getMonthlyLimit: () => calculateMonthlyLimit(get().incomes, get().expenses, get().savingsGoal),
      getExpensesTotalForPeriod: (period) => calculateExpensesTotalForPeriod(get().expenses, period, getSimulatedDate(get().simulatedDateOffsetDays)),
      getRemainingLimitForPeriod: (period) =>
        calculateRemainingLimitForPeriod(get().incomes, get().expenses, get().savingsGoal, period, getSimulatedDate(get().simulatedDateOffsetDays)),
      skipDay: () => {
        const nextOffset = (get().simulatedDateOffsetDays || 0) + 1;
        const { expenses, savingsGoal, selectedPeriod, plan } = get();

        const currentSimulatedDate = getSimulatedDate(get().simulatedDateOffsetDays || 0);
        const dailyLimit = Math.round(plan.spendableMonthlyBudget / 30);

        const currentSimulatedDateStr = currentSimulatedDate.toDateString();
        const spentOnCompletedDay = expenses
          .filter((exp) => {
            if (exp.isFixed || !exp.occurredAt) return false;
            return new Date(exp.occurredAt).toDateString() === currentSimulatedDateStr;
          })
          .reduce((sum, exp) => sum + exp.amount, 0);

        const dailyTarget = savingsGoal.dailyTarget || (savingsGoal.monthlyContribution / 30) || 0;
        const netDailySavings = dailyTarget + (dailyLimit - spentOnCompletedDay);
        const nextSaved = Math.max((savingsGoal.currentAmount || 0) + netDailySavings, 0);

        const shiftedGoal = { 
          ...savingsGoal, 
          currentAmount: Math.round(nextSaved * 100) / 100
        };

        const simulatedDate = getSimulatedDate(nextOffset);
        const next = createPlan(get().incomes, expenses, shiftedGoal, selectedPeriod, simulatedDate);

        set({
          simulatedDateOffsetDays: nextOffset,
          savingsGoal: next.savingsGoal,
          plan: next.plan
        });
      },
      resetSimulatedDate: () => {
        const { expenses, savingsGoal, selectedPeriod } = get();
        const next = createPlan(get().incomes, expenses, savingsGoal, selectedPeriod, getSimulatedDate(0));
        set({
          simulatedDateOffsetDays: 0,
          plan: next.plan
        });
      },
      getZeroSpendingStreak: () => getZeroSpendingStreak(get().expenses, getSimulatedDate(get().simulatedDateOffsetDays)),
      resetAllData: () => {
        const cleanGoal: SavingsGoal = {
          title: "Acil durum",
          selectedGoal: "Acil durum",
          targetAmount: 0,
          currentAmount: 0,
          monthlyContribution: 0,
          dailyTarget: 0,
          planStartDate: new Date().toISOString()
        };
        const cleanIncomes: Income[] = [
          { id: "salary", label: "Maaş", amount: 0, period: "monthly" },
          { id: "freelance", label: "Freelance", amount: 0, period: "monthly" },
          { id: "extra", label: "Ek gelir", amount: 0, period: "monthly" }
        ];
        const cleanFixed: Expense[] = [
          { id: "rent", label: "Kira", amount: 0, period: "monthly", isFixed: true },
          { id: "bills", label: "Faturalar", amount: 0, period: "monthly", isFixed: true },
          { id: "transport", label: "Ulaşım", amount: 0, period: "monthly", isFixed: true }
        ];
        const cleanPlan = calculateFinancePlan(cleanIncomes, cleanFixed, cleanGoal, "daily");
        set({
          userProfile: null,
          hasCompletedOnboarding: false,
          incomes: cleanIncomes,
          expenses: cleanFixed,
          savingsGoal: cleanGoal,
          goals: initialGoals,
          selectedPeriod: "daily",
          plan: cleanPlan,
          simulatedDateOffsetDays: 0,
          monthlyArchives: [],
          familyGroup: null
        });
      }
    }),
    {
      name: "birikim-yap-finance-storage",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          if (state.savingsGoal && !state.savingsGoal.planStartDate) {
            state.savingsGoal.planStartDate = new Date().toISOString();
          }
          state.setHasHydrated(true);
        }
      }
    }
  )
);

// Auto-Sync Listener for Hybrid Storage (Cloud Dual-Backup + Disk)
let autoSyncTimer: ReturnType<typeof setTimeout> | null = null;

useFinanceStore.subscribe((state, prevState) => {
  // Do not sync if onboarding is not completed or userProfile is null
  if (!state.hasCompletedOnboarding || !state.userProfile?.id) {
    return;
  }

  // Check if financial data actually changed
  const dataChanged =
    state.incomes !== prevState.incomes ||
    state.expenses !== prevState.expenses ||
    state.savingsGoal !== prevState.savingsGoal ||
    state.monthlyArchives !== prevState.monthlyArchives ||
    state.categoryLimits !== prevState.categoryLimits ||
    state.selectedPeriod !== prevState.selectedPeriod;

  if (dataChanged) {
    if (autoSyncTimer) clearTimeout(autoSyncTimer);
    autoSyncTimer = setTimeout(async () => {
      try {
        const { saveUserPlanToCloud } = await import("@/utils/supabaseAuth");
        const res = await saveUserPlanToCloud();
        console.log("[AutoSync] Dynamic store state auto-synced to Cloud:", res);
      } catch (err) {
        console.log("[AutoSync] Error during background save:", err);
      }
    }, 400);
  }
});
