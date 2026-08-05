import { Expense, FinancePlan, Income, Period, SavingsGoal, SpendingLimits } from "@/models/finance";

export function getTotalIncome(incomes: Income[]) {
  return incomes.reduce((total, income) => total + toMonthlyAmount(toSafeAmount(income.amount), income.period), 0);
}

export function getTotalFixedExpenses(expenses: Expense[]) {
  return expenses
    .filter((expense) => expense.isFixed)
    .reduce((total, expense) => total + toMonthlyAmount(toSafeAmount(expense.amount), expense.period), 0);
}

export function getMonthlyRemaining(incomes: Income[], expenses: Expense[]) {
  return Math.max(getTotalIncome(incomes) - getTotalFixedExpenses(expenses), 0);
}

export function getSpendableMonthlyBudget(incomes: Income[], expenses: Expense[], savingsGoal: SavingsGoal) {
  const monthlyRemaining = getMonthlyRemaining(incomes, expenses);
  const savings = clamp(toSafeAmount(savingsGoal.monthlyContribution), 0, monthlyRemaining);

  return Math.max(monthlyRemaining - savings, 0);
}

export function getRemainingDaysInMonth(now: Date) {
  const year = now.getFullYear();
  const month = now.getMonth();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const currentDay = now.getDate();
  return Math.max(totalDays - currentDay + 1, 1);
}

export function getDailyLimit(incomes: Income[], expenses: Expense[], savingsGoal: SavingsGoal, now = new Date()) {
  const spendableMonthlyBudget = getSpendableMonthlyBudget(incomes, expenses, savingsGoal);
  return Math.round(spendableMonthlyBudget / 30);
}

export function getWeeklyLimit(incomes: Income[], expenses: Expense[], savingsGoal: SavingsGoal, now = new Date()) {
  const daily = getDailyLimit(incomes, expenses, savingsGoal, now);
  return daily * 7;
}

export function getMonthlyLimit(incomes: Income[], expenses: Expense[], savingsGoal: SavingsGoal) {
  return Math.round(getSpendableMonthlyBudget(incomes, expenses, savingsGoal));
}

export function buildSpendingLimits(incomes: Income[], expenses: Expense[], savingsGoal: SavingsGoal, now = new Date()): SpendingLimits {
  return {
    daily: getDynamicDailyLimit(incomes, expenses, savingsGoal, now),
    weekly: getDynamicWeeklyLimit(incomes, expenses, savingsGoal, now),
    monthly: getMonthlyLimit(incomes, expenses, savingsGoal)
  };
}

export function getDynamicWeeklyLimit(
  incomes: Income[],
  expenses: Expense[],
  savingsGoal: SavingsGoal,
  now = new Date()
) {
  const baseWeekly = getWeeklyLimit(incomes, expenses, savingsGoal, now);
  const monthlyLimit = getMonthlyLimit(incomes, expenses, savingsGoal);

  const start = savingsGoal.planStartDate ? new Date(savingsGoal.planStartDate) : now;
  const dStart = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const dNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const diffTime = Math.max(0, dNow.getTime() - dStart.getTime());
  const currentDayInPlan = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  const currentWeekIndex = Math.floor((currentDayInPlan - 1) / 7); // 0, 1, 2, 3

  if (currentWeekIndex === 0) {
    return baseWeekly;
  }

  const pastWeeksEndDay = currentWeekIndex * 7;
  const pastWeeksEndDate = new Date(dStart.getTime() + pastWeeksEndDay * 24 * 60 * 60 * 1000);
  
  const pastExpensesTotal = expenses
    .filter((e) => !e.isFixed && e.occurredAt && new Date(e.occurredAt) < pastWeeksEndDate)
    .reduce((sum, e) => sum + toSafeAmount(e.amount), 0);

  const remainingWeeks = Math.max(1, 4 - currentWeekIndex);
  const remainingBudgetForCycle = Math.max(0, monthlyLimit - pastExpensesTotal);
  const pacingWeekly = Math.round(remainingBudgetForCycle / remainingWeeks);

  return Math.min(pacingWeekly, baseWeekly);
}

export function getPlanDayNumber(planStartDate?: string, now = new Date()): number {
  const start = planStartDate ? new Date(planStartDate) : now;
  const dStart = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const dNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const diffTime = Math.max(0, dNow.getTime() - dStart.getTime());
  const passedDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  
  return Math.min(30, passedDays);
}

export function isPlanCompleted(planStartDate?: string, now = new Date()): boolean {
  const start = planStartDate ? new Date(planStartDate) : now;
  const dStart = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const dNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const diffTime = Math.max(0, dNow.getTime() - dStart.getTime());
  const passedDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  
  return passedDays >= 30;
}

export function getRemainingDaysInPlan(savingsGoal: SavingsGoal, now = new Date()) {
  const start = savingsGoal.planStartDate ? new Date(savingsGoal.planStartDate) : new Date();
  const dStart = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const dNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const diffTime = Math.max(0, dNow.getTime() - dStart.getTime());
  const passedDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  
  const remaining = 30 - Math.min(30, passedDays);
  return Math.max(remaining, 1);
}

export function getDynamicDailyLimit(
  incomes: Income[],
  expenses: Expense[],
  savingsGoal: SavingsGoal,
  now = new Date()
) {
  const baseDaily = getDailyLimit(incomes, expenses, savingsGoal, now);
  const monthlyLimit = getMonthlyLimit(incomes, expenses, savingsGoal);

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const pastExpensesTotal = expenses
    .filter((e) => !e.isFixed && e.occurredAt && new Date(e.occurredAt) < todayStart)
    .reduce((sum, e) => sum + toSafeAmount(e.amount), 0);

  const start = savingsGoal.planStartDate ? new Date(savingsGoal.planStartDate) : now;
  const dStart = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const diffTime = Math.max(0, todayStart.getTime() - dStart.getTime());
  const pastDaysCount = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  const expectedPastBudget = pastDaysCount * baseDaily;
  const pastOveruse = Math.max(0, pastExpensesTotal - expectedPastBudget);

  if (pastOveruse <= 0) {
    return baseDaily;
  }

  const remainingDays = getRemainingDaysInPlan(savingsGoal, now);
  const remainingBudgetForCycle = Math.max(0, monthlyLimit - pastExpensesTotal);
  const pacingDaily = Math.round(remainingBudgetForCycle / remainingDays);

  return Math.min(pacingDaily, baseDaily);
}

export function getRevisedSavingsStatus(
  incomes: Income[],
  expenses: Expense[],
  savingsGoal: SavingsGoal,
  now = new Date()
) {
  const monthlyIncome = getTotalIncome(incomes);
  const totalFixed = getTotalFixedExpenses(expenses);
  const monthlyRemaining = Math.max(monthlyIncome - totalFixed, 0);
  const targetSavings = clamp(toSafeAmount(savingsGoal.monthlyContribution), 0, monthlyRemaining);
  const spendableBudget = Math.max(monthlyRemaining - targetSavings, 0);

  const monthlySpent = getExpensesTotalForPeriod(expenses, "monthly", now);
  const budgetOveruse = monthlySpent - spendableBudget;

  if (budgetOveruse <= 0) {
    return {
      isOverused: false,
      overuseAmount: 0,
      revisedSavings: targetSavings,
      targetSavings
    };
  }

  const revisedSavings = Math.max(0, targetSavings - budgetOveruse);
  return {
    isOverused: true,
    overuseAmount: budgetOveruse,
    revisedSavings,
    targetSavings
  };
}

export function getExpensesTotalForPeriod(expenses: Expense[], period: Period, now = new Date(), planStartDateStr?: string) {
  return expenses
    .filter((expense) => !expense.isFixed && isExpenseInPeriod(expense, period, now, planStartDateStr))
    .reduce((total, expense) => total + toSafeAmount(expense.amount), 0);
}

export function getRemainingLimitForPeriod(
  incomes: Income[],
  expenses: Expense[],
  savingsGoal: SavingsGoal,
  period: Period,
  now = new Date()
) {
  const limits = buildSpendingLimits(incomes, expenses, savingsGoal, now);
  const spendingTotal = getExpensesTotalForPeriod(expenses, period, now);

  return limits[period] - spendingTotal;
}

export function calculateFinancePlan(
  incomes: Income[],
  expenses: Expense[],
  savingsGoal: SavingsGoal,
  selectedPeriod: Period,
  now = new Date()
): FinancePlan {
  const monthlyIncome = getTotalIncome(incomes);
  const totalFixedExpenses = getTotalFixedExpenses(expenses);
  const monthlyRemaining = Math.max(monthlyIncome - totalFixedExpenses, 0);
  const monthlySavings = clamp(toSafeAmount(savingsGoal.monthlyContribution), 0, monthlyRemaining);
  const spendableMonthlyBudget = Math.max(monthlyRemaining - monthlySavings, 0);
  const limits = buildSpendingLimits(incomes, expenses, { ...savingsGoal, monthlyContribution: monthlySavings }, now);
  const selectedPeriodLimit = limits[selectedPeriod];
  const selectedPeriodSpent = getExpensesTotalForPeriod(expenses, selectedPeriod, now);

  return {
    monthlyIncome,
    totalFixedExpenses,
    monthlyRemaining,
    monthlySavings,
    spendableMonthlyBudget,
    limits,
    selectedPeriodLimit,
    selectedPeriodSpent,
    selectedPeriodRemaining: selectedPeriodLimit - selectedPeriodSpent
  };
}

export function getExpensesForPeriod(expenses: Expense[], period: Period, now = new Date(), planStartDateStr?: string) {
  return expenses.filter((expense) => !expense.isFixed && isExpenseInPeriod(expense, period, now, planStartDateStr));
}

export function getSimulatedDate(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d;
}

export function getZeroSpendingStreak(expenses: Expense[], now = new Date()) {
  let streak = 0;
  const checkDate = new Date(now);
  
  for (let i = 0; i < 30; i++) {
    const targetDateStr = checkDate.toDateString();
    const dayHasSpending = expenses.some((exp) => 
      !exp.isFixed && 
      exp.occurredAt && 
      new Date(exp.occurredAt).toDateString() === targetDateStr &&
      toSafeAmount(exp.amount) > 0
    );
    
    if (dayHasSpending) {
      break;
    }
    
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }
  
  return streak;
}

export function getExpensePlanWeekIndex(expenseDate: Date, planStartDate: Date): number {
  const dExp = new Date(expenseDate.getFullYear(), expenseDate.getMonth(), expenseDate.getDate());
  const dStart = new Date(planStartDate.getFullYear(), planStartDate.getMonth(), planStartDate.getDate());
  const diffTime = Math.max(0, dExp.getTime() - dStart.getTime());
  const dayInPlan = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  const dayInCycle = ((dayInPlan - 1) % 30) + 1;

  if (dayInCycle <= 7) return 1;
  if (dayInCycle <= 14) return 2;
  if (dayInCycle <= 21) return 3;
  return 4;
}

export function isExpenseInPeriod(expense: Expense, period: Period, now = new Date(), planStartDateStr?: string) {
  if (!expense.occurredAt) return false;

  const occurredAt = new Date(expense.occurredAt);
  const startOfNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (period === "daily") {
    const occurredStart = new Date(occurredAt.getFullYear(), occurredAt.getMonth(), occurredAt.getDate());
    return occurredStart.getTime() === startOfNow.getTime();
  }

  const pStart = planStartDateStr ? new Date(planStartDateStr) : now;

  if (period === "weekly") {
    const currentWeekIndex = getExpensePlanWeekIndex(now, pStart);
    const expWeekIndex = getExpensePlanWeekIndex(occurredAt, pStart);
    
    const dExp = new Date(occurredAt.getFullYear(), occurredAt.getMonth(), occurredAt.getDate());
    const dStart = new Date(pStart.getFullYear(), pStart.getMonth(), pStart.getDate());
    const diffDays = Math.floor(Math.max(0, dExp.getTime() - dStart.getTime()) / (1000 * 60 * 60 * 24));
    const nowDiffDays = Math.floor(Math.max(0, startOfNow.getTime() - dStart.getTime()) / (1000 * 60 * 60 * 24));

    const isSameCycle = Math.floor(diffDays / 30) === Math.floor(nowDiffDays / 30);
    return isSameCycle && expWeekIndex === currentWeekIndex;
  }

  const dExp = new Date(occurredAt.getFullYear(), occurredAt.getMonth(), occurredAt.getDate());
  const dStart = new Date(pStart.getFullYear(), pStart.getMonth(), pStart.getDate());
  const diffDays = Math.floor(Math.max(0, dExp.getTime() - dStart.getTime()) / (1000 * 60 * 60 * 24));
  const nowDiffDays = Math.floor(Math.max(0, startOfNow.getTime() - dStart.getTime()) / (1000 * 60 * 60 * 24));

  return Math.floor(diffDays / 30) === Math.floor(nowDiffDays / 30);
}

function getWeekStart(date: Date) {
  const weekStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = (weekStart.getDay() + 6) % 7;
  weekStart.setDate(weekStart.getDate() - day);
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
}

function toMonthlyAmount(amount: number, period: Period) {
  if (period === "daily") {
    return amount * 30;
  }

  if (period === "weekly") {
    return amount * 4.3;
  }

  return amount;
}

export function toSafeAmount(val: any): number {
  if (val === undefined || val === null || isNaN(Number(val))) return 0;
  return Number(val);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
