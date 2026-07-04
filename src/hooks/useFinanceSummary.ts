import { useFinanceStore } from "@/store/financeStore";

export function useFinanceSummary() {
  return useFinanceStore((state) => state.plan);
}
