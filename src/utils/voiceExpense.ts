import { useFinanceStore } from "@/store/financeStore";
import { parseAmount } from "@/utils/currency";
import { EXPENSE_DICTIONARY } from "@/utils/expenseDictionary";

export type ParsedVoiceExpense = {
  amount: number;
  category: string;
  subcategory: string;
  label: string;
  note: string;
};

export function parseTurkishExpense(text: string): ParsedVoiceExpense {
  const language = useFinanceStore.getState().language;
  const normalized = text.toLowerCase().trim();
  const amount = parseAmount(normalized);

  const ignoredWords = new Set([
    "lira", "tl", "₺", "aldım", "harcadım", "harcadim", "harcama", "ödedim", "yedim",
    "dollar", "usd", "euro", "eur", "spent", "paid", "bought", "got"
  ]);

  // Strip numbers and ignored noise words to isolate descriptive words
  const descriptiveWords = normalized
    .split(/\s+/)
    .filter((word) => word && !ignoredWords.has(word) && !Number.isFinite(Number.parseFloat(word)) && Number.isNaN(Number(word)));

  if (descriptiveWords.length === 0) {
    const defaultLabel = language === "tr" ? "Genel Harcama" : "General Expense";
    const defaultCat = language === "tr" ? "Diğer" : "Other";
    const defaultSub = language === "tr" ? "Genel" : "General";
    return {
      amount,
      category: defaultCat,
      subcategory: defaultSub,
      label: defaultLabel,
      note: defaultLabel
    };
  }

  // Find smart match in categories
  let category = language === "tr" ? "Diğer" : "Other";
  let subcategory = language === "tr" ? "Genel" : "General";
  let matched = false;

  for (const item of EXPENSE_DICTIONARY) {
    const listToCheck = language === "tr" ? item.keywords : item.enKeywords;
    
    // Check if any word in descriptive text matches keywords
    const hasMatch = descriptiveWords.some(word => 
      listToCheck.some(kw => word.includes(kw) || kw.includes(word))
    );

    if (hasMatch) {
      category = language === "tr" ? item.categoryTr : item.categoryEn;
      subcategory = language === "tr" ? item.subTr : item.subEn;
      matched = true;
      break;
    }
  }

  // Label is the titlecase of descriptive words (e.g. "Makarna" or "Deterjan")
  const rawLabel = descriptiveWords.join(" ");
  const label = toTitleCase(rawLabel);

  // If the word itself was just the category name (e.g. user said "market 1000"),
  // align subcategory and product detail to general
  if (label.toLowerCase() === category.toLowerCase() || (language === "tr" && label.toLowerCase() === "süpermarket")) {
    subcategory = language === "tr" ? "Genel" : "General";
  }

  return {
    amount,
    category,
    subcategory,
    label,
    note: `${category} › ${subcategory}`
  };
}

function toTitleCase(value: string) {
  return `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`;
}
