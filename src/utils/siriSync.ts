import { NativeModules, Platform } from "react-native";
import { useFinanceStore } from "../store/financeStore";
import { parseTurkishExpense } from "./voiceExpense";

const { SiriBridge } = NativeModules;
let isSyncing = false;

export async function syncSiriExpenses() {
  if (Platform.OS !== "ios" || !SiriBridge || isSyncing) return;

  try {
    isSyncing = true;
    const pendingExpenses: Array<{ id: string; rawInput: string; timestamp: number }> =
      await SiriBridge.getPendingSiriExpenses();

    if (!pendingExpenses || pendingExpenses.length === 0) {
      isSyncing = false;
      return;
    }

    // ANINDA TEMIZLE KI CIFTE SENKRONIZASYON OLMASIN
    await SiriBridge.clearPendingSiriExpenses();

    const store = useFinanceStore.getState();
    const existingExpenses = store.expenses;

    for (const item of pendingExpenses) {
      const parsed = parseTurkishExpense(item.rawInput);
      if (parsed && parsed.amount > 0) {
        const itemDateStr = new Date(item.timestamp * 1000).toISOString();
        const alreadyExists = existingExpenses.some(
          (e) => e.id === item.id || (e.amount === parsed.amount && e.note === (parsed.note || item.rawInput))
        );

        if (!alreadyExists) {
          store.addExpense({
            id: item.id || `siri_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            label: parsed.note || parsed.category || item.rawInput,
            amount: parsed.amount,
            period: "daily",
            isFixed: false,
            category: parsed.category,
            note: parsed.note || item.rawInput,
            occurredAt: itemDateStr,
          });
        }
      }
    }
  } catch (error) {
    console.error("[SiriSync] Hata:", error);
  } finally {
    isSyncing = false;
  }
}
