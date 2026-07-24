import { NativeModules, Platform } from "react-native";
import { useFinanceStore } from "../store/financeStore";
import { parseTurkishExpense } from "./voiceExpense";

const { SiriBridge } = NativeModules;

export async function syncSiriExpenses() {
  if (Platform.OS !== "ios" || !SiriBridge) return;

  try {
    const pendingExpenses: Array<{ id: string; rawInput: string; timestamp: number }> =
      await SiriBridge.getPendingSiriExpenses();

    if (!pendingExpenses || pendingExpenses.length === 0) return;

    const store = useFinanceStore.getState();

    for (const item of pendingExpenses) {
      const parsed = parseTurkishExpense(item.rawInput);
      if (parsed && parsed.amount > 0) {
        store.addExpense({
          id: item.id || `siri_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          label: parsed.note || parsed.category || item.rawInput,
          amount: parsed.amount,
          period: "daily",
          isFixed: false,
          category: parsed.category,
          note: parsed.note || item.rawInput,
          occurredAt: new Date(item.timestamp * 1000).toISOString(),
        });
      }
    }

    await SiriBridge.clearPendingSiriExpenses();
    console.log(`[SiriSync] ${pendingExpenses.length} adet Siri harcaması başarıyla eklendi!`);
  } catch (error) {
    console.error("[SiriSync] Hata:", error);
  }
}
