import { NativeModules, Platform } from "react-native";
import { formatCurrency } from "@/utils/currency";

const { LiveActivityModule } = NativeModules;

export interface LiveActivityData {
  dailyRemaining: number;
  dailyLimit: number;
  spentRatio: number;
  statusText: string;
}

export function syncLiveActivityData(dailyRemaining: number, dailyLimit: number): void {
  if (Platform.OS !== "ios") return;

  try {
    const { useFinanceStore } = require("@/store/financeStore");
    const isEnabled = useFinanceStore.getState().isLiveActivityEnabled;
    if (isEnabled === false) return;
  } catch (e) {
    // Ignore store import errors if any
  }

  const spentRatio = dailyLimit > 0 ? Math.min(1.0, Math.max(0, (dailyLimit - dailyRemaining) / dailyLimit)) : 0;
  const isExceeded = dailyRemaining < 0;
  
  const statusText = isExceeded
    ? `🚨 ${formatCurrency(Math.abs(dailyRemaining))} Aşıldı!`
    : `🟢 Kalan: ${formatCurrency(dailyRemaining)}`;

  const activityData: LiveActivityData = {
    dailyRemaining,
    dailyLimit,
    spentRatio,
    statusText
  };

  if (LiveActivityModule && typeof LiveActivityModule.updateLiveActivity === "function") {
    LiveActivityModule.updateLiveActivity(activityData);
  }
}
