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
  
  // Calculate current day of the plan
  const start = new Date(savingsGoal.planStartDate || new Date());
  const dStart = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const dNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffTime = dNow.getTime() - dStart.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const planDay = Math.max(diffDays + 1, 1);

  // Remaining days in the 30-day plan
  const remainingDays = Math.max(30 - (planDay - 1), 1);

  // Variable expenses spent within the plan so far (from planStartDate to now)
  const planExpenses = expenses.filter((exp) => {
    if (exp.isFixed || !exp.occurredAt) return false;
    const expDate = new Date(exp.occurredAt);
    const dExp = new Date(expDate.getFullYear(), expDate.getMonth(), expDate.getDate());
    return dExp.getTime() >= dStart.getTime() && dExp.getTime() <= dNow.getTime();
  });

  const totalSpentInPlan = planExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const spentToday = planExpenses
    .filter((exp) => {
      const expDate = new Date(exp.occurredAt!);
      return expDate.getFullYear() === dNow.getFullYear() && 
             expDate.getMonth() === dNow.getMonth() && 
             expDate.getDate() === dNow.getDate();
    })
    .reduce((sum, exp) => sum + exp.amount, 0);

  const previousDaysSpent = Math.max(totalSpentInPlan - spentToday, 0);

  const dailyLimit = Math.max(spendableMonthlyBudget - previousDaysSpent, 0) / remainingDays;
  const roundedLimit = Math.round(dailyLimit);

  console.log("[getDailyLimit] debug:", {
    now: now.toISOString(),
    planStartDate: start.toISOString(),
    planDay,
    remainingDays,
    spendableMonthlyBudget,
    totalSpentInPlan,
    spentToday,
    previousDaysSpent,
    dailyLimit,
    roundedLimit
  });

  return roundedLimit;
}

export function getWeeklyLimit(incomes: Income[], expenses: Expense[], savingsGoal: SavingsGoal) {
  return Math.round(getSpendableMonthlyBudget(incomes, expenses, savingsGoal) / 4.3);
}

export function getMonthlyLimit(incomes: Income[], expenses: Expense[], savingsGoal: SavingsGoal) {
  return Math.round(getSpendableMonthlyBudget(incomes, expenses, savingsGoal));
}

export function buildSpendingLimits(incomes: Income[], expenses: Expense[], savingsGoal: SavingsGoal, now = new Date()): SpendingLimits {
  return {
    daily: getDailyLimit(incomes, expenses, savingsGoal, now),
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
  const limits = buildSpendingLimits(incomes, expenses, { ...savingsGoal, monthlyContribution: monthlySavings });
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

export function getExpensesForPeriod(expenses: Expense[], period: Period, now = new Date()) {
  return expenses.filter((expense) => !expense.isFixed && isExpenseInPeriod(expense, period, now));
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
