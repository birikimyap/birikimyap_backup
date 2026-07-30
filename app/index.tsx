import { useFinanceStore } from "../src/store/financeStore";
import LoginScreen from "../src/screens/LoginScreen";
import HomeDashboardScreen from "../src/screens/HomeDashboardScreen";

export default function IndexRoute() {
  const hasHydrated = useFinanceStore((state) => state.hasHydrated);
  const incomes = useFinanceStore((state) => state.incomes);
  const expenses = useFinanceStore((state) => state.expenses);
  const savingsGoal = useFinanceStore((state) => state.savingsGoal);
  const hasCompletedOnboarding = useFinanceStore((state) => state.hasCompletedOnboarding);
  const userProfile = useFinanceStore((state) => state.userProfile);

  const hasConfiguredPlan = 
    incomes.some((i) => i.amount > 0) || 
    expenses.some((e) => e.amount > 0) || 
    (savingsGoal.targetAmount > 0 && savingsGoal.monthlyContribution > 0);

  const isUserLoggedInAndConfigured = 
    hasCompletedOnboarding || 
    Boolean(userProfile?.fullName) || 
    hasConfiguredPlan;

  if (hasHydrated && isUserLoggedInAndConfigured) {
    return <HomeDashboardScreen />;
  }

  return <LoginScreen />;
}
