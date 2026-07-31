export type Period = "daily" | "weekly" | "monthly";

export type Income = {
  id: string;
  label: string;
  subtitle?: string;
  amount: number;
  period: Period;
};

export type Expense = {
  id: string;
  label: string;
  subtitle?: string;
  amount: number;
  period: Period;
  isFixed: boolean;
  category?: string;
  note?: string;
  occurredAt?: string;
};

export type SavingsGoal = {
  title: string;
  selectedGoal?: string;
  targetAmount: number;
  currentAmount: number;
  monthlyContribution: number;
  dailyTarget: number;
  planStartDate: string;
};

export type GoalItem = {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  icon?: string;
  color?: string;
  createdAt: string;
};

export type SpendingLimits = {
  daily: number;
  weekly: number;
  monthly: number;
};

export type SpendingTotals = SpendingLimits;

export type FinancePlan = {
  monthlyIncome: number;
  totalFixedExpenses: number;
  monthlyRemaining: number;
  monthlySavings: number;
  spendableMonthlyBudget: number;
  limits: SpendingLimits;
  selectedPeriodLimit: number;
  selectedPeriodSpent: number;
  selectedPeriodRemaining: number;
};

export type MonthlyArchiveRecord = {
  id: string;
  monthKey: string;
  monthTitle: string;
  targetSavings: number;
  achievedSavings: number;
  totalSpent: number;
  spendableBudget: number;
  isSuccess: boolean;
};
