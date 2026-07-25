import { Expense, Income, SavingsGoal } from "@/models/finance";
import { getDynamicDailyLimit, getExpensesTotalForPeriod, getMonthlyLimit } from "./finance";
import { formatCurrency } from "./currency";

export function syncWidgetData(
  incomes: Income[],
  expenses: Expense[],
  savingsGoal: SavingsGoal,
  now = new Date()
) {
  try {
    const monthlyLimit = getMonthlyLimit(incomes, expenses, savingsGoal);
    const monthlySpent = getExpensesTotalForPeriod(expenses, "monthly", now);
    const remainingMonthly = monthlyLimit - monthlySpent;
    const dynamicDaily = getDynamicDailyLimit(incomes, expenses, savingsGoal, now);

    const widgetPayload = {
      dynamicDailyLimit: dynamicDaily,
      formattedDynamicDaily: formatCurrency(dynamicDaily),
      monthlyRemaining: remainingMonthly,
      formattedMonthlyRemaining: formatCurrency(remainingMonthly),
      isBudgetExceeded: remainingMonthly <= 0,
      updatedAt: now.toISOString()
    };

    console.log("[widget-sync] payload updated:", widgetPayload);
    return widgetPayload;
  } catch (err) {
    console.log("[widget-sync] error syncing data:", err);
    return null;
  }
}
