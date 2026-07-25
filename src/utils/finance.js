"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTotalIncome = getTotalIncome;
exports.getTotalFixedExpenses = getTotalFixedExpenses;
exports.getMonthlyRemaining = getMonthlyRemaining;
exports.getSpendableMonthlyBudget = getSpendableMonthlyBudget;
exports.getRemainingDaysInMonth = getRemainingDaysInMonth;
exports.getDailyLimit = getDailyLimit;
exports.getWeeklyLimit = getWeeklyLimit;
exports.getMonthlyLimit = getMonthlyLimit;
exports.buildSpendingLimits = buildSpendingLimits;
exports.getDynamicDailyLimit = getDynamicDailyLimit;
exports.getRevisedSavingsStatus = getRevisedSavingsStatus;
exports.getExpensesTotalForPeriod = getExpensesTotalForPeriod;
exports.getRemainingLimitForPeriod = getRemainingLimitForPeriod;
exports.calculateFinancePlan = calculateFinancePlan;
exports.getExpensesForPeriod = getExpensesForPeriod;
exports.getSimulatedDate = getSimulatedDate;
exports.getZeroSpendingStreak = getZeroSpendingStreak;
function getTotalIncome(incomes) {
    return incomes.reduce((total, income) => total + toMonthlyAmount(toSafeAmount(income.amount), income.period), 0);
}
function getTotalFixedExpenses(expenses) {
    return expenses
        .filter((expense) => expense.isFixed)
        .reduce((total, expense) => total + toMonthlyAmount(toSafeAmount(expense.amount), expense.period), 0);
}
function getMonthlyRemaining(incomes, expenses) {
    return Math.max(getTotalIncome(incomes) - getTotalFixedExpenses(expenses), 0);
}
function getSpendableMonthlyBudget(incomes, expenses, savingsGoal) {
    const monthlyRemaining = getMonthlyRemaining(incomes, expenses);
    const savings = clamp(toSafeAmount(savingsGoal.monthlyContribution), 0, monthlyRemaining);
    return Math.max(monthlyRemaining - savings, 0);
}
function getRemainingDaysInMonth(now) {
    const year = now.getFullYear();
    const month = now.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const currentDay = now.getDate();
    return Math.max(totalDays - currentDay + 1, 1);
}
function getDailyLimit(incomes, expenses, savingsGoal, now = new Date()) {
    const spendableMonthlyBudget = getSpendableMonthlyBudget(incomes, expenses, savingsGoal);
    return Math.round(spendableMonthlyBudget / 30);
}
function getWeeklyLimit(incomes, expenses, savingsGoal) {
    return Math.round(getSpendableMonthlyBudget(incomes, expenses, savingsGoal) / 4.3);
}
function getMonthlyLimit(incomes, expenses, savingsGoal) {
    return Math.round(getSpendableMonthlyBudget(incomes, expenses, savingsGoal));
}
function buildSpendingLimits(incomes, expenses, savingsGoal, now = new Date()) {
    return {
        daily: getDailyLimit(incomes, expenses, savingsGoal, now),
        weekly: getWeeklyLimit(incomes, expenses, savingsGoal),
        monthly: getMonthlyLimit(incomes, expenses, savingsGoal)
    };
}
function getDynamicDailyLimit(incomes, expenses, savingsGoal, now = new Date()) {
    const monthlyLimit = getMonthlyLimit(incomes, expenses, savingsGoal);
    const monthlySpent = getExpensesTotalForPeriod(expenses, "monthly", now);
    const remainingMonthlyBudget = monthlyLimit - monthlySpent;
    const remainingDays = getRemainingDaysInMonth(now);
    if (remainingMonthlyBudget <= 0) {
        return 0;
    }
    return Math.round(remainingMonthlyBudget / remainingDays);
}
function getRevisedSavingsStatus(incomes, expenses, savingsGoal, now = new Date()) {
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
function getExpensesTotalForPeriod(expenses, period, now = new Date()) {
    return expenses
        .filter((expense) => !expense.isFixed && isExpenseInPeriod(expense, period, now))
        .reduce((total, expense) => total + toSafeAmount(expense.amount), 0);
}
function getRemainingLimitForPeriod(incomes, expenses, savingsGoal, period, now = new Date()) {
    const limits = buildSpendingLimits(incomes, expenses, savingsGoal, now);
    const spendingTotal = getExpensesTotalForPeriod(expenses, period, now);
    return limits[period] - spendingTotal;
}
function calculateFinancePlan(incomes, expenses, savingsGoal, selectedPeriod, now = new Date()) {
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
function getExpensesForPeriod(expenses, period, now = new Date()) {
    return expenses.filter((expense) => !expense.isFixed && isExpenseInPeriod(expense, period, now));
}
function getSimulatedDate(offsetDays = 0) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d;
}
function getZeroSpendingStreak(expenses, now = new Date()) {
    let streak = 0;
    const checkDate = new Date(now);
    for (let i = 0; i < 30; i++) {
        const targetDateStr = checkDate.toDateString();
        const dayHasSpending = expenses.some((exp) => !exp.isFixed &&
            exp.occurredAt &&
            new Date(exp.occurredAt).toDateString() === targetDateStr &&
            toSafeAmount(exp.amount) > 0);
        if (dayHasSpending) {
            break;
        }
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
    }
    return streak;
}
function isExpenseInPeriod(expense, period, now) {
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
    const endOfNow = new Date(now);
    endOfNow.setHours(23, 59, 59, 999);
    if (period === "weekly") {
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);
        return occurredAt >= sevenDaysAgo && occurredAt <= endOfNow;
    }
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);
    return occurredAt >= thirtyDaysAgo && occurredAt <= endOfNow;
}
function getWeekStart(date) {
    const weekStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const day = (weekStart.getDay() + 6) % 7;
    weekStart.setDate(weekStart.getDate() - day);
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
}
function toMonthlyAmount(amount, period) {
    if (period === "daily") {
        return amount * 30;
    }
    if (period === "weekly") {
        return amount * 4.3;
    }
    return amount;
}
function toSafeAmount(amount) {
    return Number.isFinite(amount) ? Math.max(amount, 0) : 0;
}
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
