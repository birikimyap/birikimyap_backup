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

export function getDailyLimit(incomes: Income[], expenses: Expense[], savingsGoal: SavingsGoal) {
  return Math.round(getSpendableMonthlyBudget(incomes, expenses, savingsGoal) / 30);
}

export function getWeeklyLimit(incomes: Income[], expenses: Expense[], savingsGoal: SavingsGoal) {
  return Math.round(getSpendableMonthlyBudget(incomes, expenses, savingsGoal) / 4.3);
}

export function getMonthlyLimit(incomes: Income[], expenses: Expense[], savingsGoal: SavingsGoal) {
  return Math.round(getSpendableMonthlyBudget(incomes, expenses, savingsGoal));
}

export function buildSpendingLimits(incomes: Income[], expenses: Expense[], savingsGoal: SavingsGoal): SpendingLimits {
  return {
    daily: getDailyLimit(incomes, expenses, savingsGoal),
    weekly: getWeeklyLimit(incomes, expenses, savingsGoal),
    monthly: getMonthlyLimit(incomes, expenses, savingsGoal)
  };
}

export function getExpensesTotalForPeriod(expenses: Expense[], period: Period, now = new Date()) {
  return expenses
    .filter((expense) => !expense.isFixed && isExpenseInPeriod(expense, period, now))
    .reduce((total, expense) => total + toSafeAmount(expense.amount), 0);
}

export function getRemainingLimitForPeriod(
  incomes: Income[],
  expenses: Expense[],
  savingsGoal: SavingsGoal,
  period: Period,
  now = new Date()
) {
  const limits = buildSpendingLimits(incomes, expenses, savingsGoal);
  const spendingTotal = getExpensesTotalForPeriod(expenses, period, now);

  return limits[period] - spendingTotal;
}

export function calculateFinancePlan(
  incomes: Income[],
  expenses: Expense[],
  savingsGoal: SavingsGoal,
  selectedPeriod: Period
): FinancePlan {
  const monthlyIncome = getTotalIncome(incomes);
  const totalFixedExpenses = getTotalFixedExpenses(expenses);
  const monthlyRemaining = Math.max(monthlyIncome - totalFixedExpenses, 0);
  const monthlySavings = clamp(toSafeAmount(savingsGoal.monthlyContribution), 0, monthlyRemaining);
  const spendableMonthlyBudget = Math.max(monthlyRemaining - monthlySavings, 0);
  const limits = buildSpendingLimits(incomes, expenses, { ...savingsGoal, monthlyContribution: monthlySavings });
  const selectedPeriodLimit = limits[selectedPeriod];
  const selectedPeriodSpent = getExpensesTotalForPeriod(expenses, selectedPeriod);

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

export function getExpensesForPeriod(expenses: Expense[], period: Period, now = new Date()) {
  return expenses.filter((expense) => !expense.isFixed && isExpenseInPeriod(expense, period, now));
}

function isExpenseInPeriod(expense: Expense, period: Period, now: Date) {
  if (!expense.occurredAt) {
    return false;
  }

  const occurredAt = new Date(expense.occurredAt);

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

function toMonthlyAmount(amount: number, period: Period) {
  if (period === "daily") {
    return amount * 30;
  }

  if (period === "weekly") {
    return amount * 4.3;
  }

  return amount;
}

function toSafeAmount(amount: number) {
  return Number.isFinite(amount) ? Math.max(amount, 0) : 0;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
