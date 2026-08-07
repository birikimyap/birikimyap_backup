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

    const store = useFinanceStore.getState();
    const existingExpenses = store.expenses;
    let addedCount = 0;

    for (const item of pendingExpenses) {
      const parsed = parseTurkishExpense(item.rawInput);
      if (parsed && parsed.amount > 0) {
        // Timestamp saniye cinsindense milisaniyeye çevir
        const rawTimeMs = item.timestamp > 1e11 ? item.timestamp : item.timestamp * 1000;
        const itemDateStr = new Date(rawTimeMs).toISOString();
        
        const alreadyExists = existingExpenses.some(
          (e) => e.id === item.id || (e.amount === parsed.amount && e.note === (parsed.note || item.rawInput) && e.occurredAt === itemDateStr)
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
            addedByName: "Siri 🎙️"
          });
          addedCount++;
        }
      }
    }

    // YALNIZCA STORE'A BAŞARIYLA EKLENDİKTEN SONRA SİRİ KUYRUĞUNU TEMİZLE
    await SiriBridge.clearPendingSiriExpenses();
  } catch (error) {
    console.error("[SiriSync] Hata:", error);
  } finally {
    isSyncing = false;
  }
}
