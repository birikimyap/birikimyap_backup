import { NativeModules, Platform } from "react-native";
import { formatCurrency } from "@/utils/currency";

const { WatchSyncModule } = NativeModules;

export interface WatchContextData {
  dailyRemaining: number;
  dailyLimit: number;
  lastExpenseLabel?: string;
  lastExpenseAmount?: number;
  formattedRemaining: string;
}

export function syncWatchData(
  dailyRemaining: number,
  dailyLimit: number,
  lastExpenseLabel?: string,
  lastExpenseAmount?: number
): void {
  if (Platform.OS !== "ios") return;

  const formattedRemaining = formatCurrency(dailyRemaining);

  const contextData: WatchContextData = {
    dailyRemaining,
    dailyLimit,
    lastExpenseLabel: lastExpenseLabel || "",
    lastExpenseAmount: lastExpenseAmount || 0,
    formattedRemaining
  };

  if (WatchSyncModule && typeof WatchSyncModule.updateWatchContext === "function") {
    WatchSyncModule.updateWatchContext(contextData);
  }
}
