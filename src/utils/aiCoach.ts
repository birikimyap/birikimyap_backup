import { Expense } from "@/models/finance";
import { formatCurrency } from "@/utils/currency";

export interface AICoachInsight {
  id: string;
  type: "warning" | "tip" | "praise";
  titleTr: string;
  titleEn: string;
  descTr: string;
  descEn: string;
  actionableSavingTr?: string;
  actionableSavingEn?: string;
}

export function generateAICoachInsights(
  expenses: Expense[],
  monthlyRemaining: number,
  spendableMonthlyBudget: number,
  streakCount: number,
  language: "tr" | "en" = "tr"
): AICoachInsight[] {
  const insights: AICoachInsight[] = [];

  // 1. High Spending Category Analysis
  const categoryTotals: Record<string, number> = {};
  expenses.forEach((e) => {
    const cat = e.category || "Diğer";
    categoryTotals[cat] = (categoryTotals[cat] || 0) + e.amount;
  });

  const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
  if (sortedCategories.length > 0) {
    const [topCat, topAmount] = sortedCategories[0];
    const potentialSaving = Math.round(topAmount * 0.15);

    insights.push({
      id: "top_cat_insight",
      type: "tip",
      titleTr: `💡 En Yüksek Harcama: ${topCat}`,
      titleEn: `💡 Highest Expense: ${topCat}`,
      descTr: `Bu ay ${topCat} kategorisinde toplam ${formatCurrency(topAmount)} harcandı. Bu alanda %15 kısıntı yapmak ayda ${formatCurrency(potentialSaving)} tasarruf sağlar.`,
      descEn: `You spent ${formatCurrency(topAmount)} on ${topCat} this month. A 15% reduction can save you ${formatCurrency(potentialSaving)} monthly.`,
      actionableSavingTr: `Tahmini Aylık Tasarruf: +${formatCurrency(potentialSaving)}`,
      actionableSavingEn: `Est. Monthly Saving: +${formatCurrency(potentialSaving)}`
    });
  }

  // 2. Streak & Habit Praise
  if (streakCount >= 3) {
    insights.push({
      id: "streak_praise",
      type: "praise",
      titleTr: `🔥 Disiplin Şampiyonu (${streakCount} Gün)`,
      titleEn: `🔥 Streak Champion (${streakCount} Days)`,
      descTr: `${streakCount} gündür bütçenizi kesintisiz takip ediyorsunuz! Harcama farkındalığı birikim yapmanın %80'ini oluşturur.`,
      descEn: `You've tracked your budget for ${streakCount} consecutive days! Expense awareness is 80% of saving.`,
      actionableSavingTr: "Seriyi Koru (+50 XP)",
      actionableSavingEn: "Keep Streak (+50 XP)"
    });
  }

  // 3. Smart Rebalancing & Budget Health
  if (spendableMonthlyBudget > 0) {
    const dailyLimit = Math.round(spendableMonthlyBudget / 30);
    insights.push({
      id: "daily_limit_advice",
      type: "tip",
      titleTr: "⚡ Günlük Bütçe İpucu",
      titleEn: "⚡ Daily Budget Tip",
      descTr: `Günlük harcama limitiniz ${formatCurrency(dailyLimit)}. Küçük harcamaları sesli asistanla anında kaydederek aşımın önüne geçebilirsiniz.`,
      descEn: `Your daily limit is ${formatCurrency(dailyLimit)}. Log micro-expenses instantly using voice assistant to stay on track.`,
      actionableSavingTr: "Sesle Harcama Ekle",
      actionableSavingEn: "Add Voice Expense"
    });
  }

  return insights;
}
