import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { Expense, FinancePlan, Income, Period, SavingsGoal } from "@/models/finance";
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

type FinanceState = {
  hasHydrated: boolean;
  incomes: Income[];
  expenses: Expense[];
  savingsGoal: SavingsGoal;
  selectedPeriod: Period;
  plan: FinancePlan;
  setIncomes: (incomes: Income[]) => void;
  setExpenses: (expenses: Expense[]) => void;
  setFixedExpenses: (expenses: Expense[]) => void;
  addExpense: (expense: Expense) => void;
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
  language: "tr" | "en";
  setLanguage: (lang: "tr" | "en") => void;
  currency: "TRY" | "USD" | "EUR";
  setCurrency: (currency: "TRY" | "USD" | "EUR") => void;
  categoryLimits: Record<string, number>;
  setCategoryLimit: (categoryKey: string, amount: number) => void;
  simulatedDateOffsetDays: number;
  skipDay: () => void;
  resetSimulatedDate: () => void;
  getZeroSpendingStreak: () => number;
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
      setCurrency: (newCurrency) => {
        const prevCurrency = get().currency;
        if (prevCurrency === newCurrency) return;

        const convert = (val: number) => {
          const EXCHANGE_RATES = {
            TRY: 1,
            USD: 33.0,
            EUR: 36.0
          };
          const valueInTry = val * EXCHANGE_RATES[prevCurrency];
          const rawConverted = valueInTry / EXCHANGE_RATES[newCurrency];
          return Math.round(rawConverted * 100) / 100;
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
        const { expenses, savingsGoal, selectedPeriod } = get();

        const dailyTarget = savingsGoal.dailyTarget || (savingsGoal.monthlyContribution / 30) || 0;
        const nextSaved = Math.min((savingsGoal.currentAmount || 0) + dailyTarget, savingsGoal.targetAmount || Infinity);

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
      getZeroSpendingStreak: () => getZeroSpendingStreak(get().expenses, getSimulatedDate(get().simulatedDateOffsetDays))
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
