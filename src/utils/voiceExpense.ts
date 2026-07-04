import { parseAmount } from "@/utils/currency";

export type ParsedVoiceExpense = {
  amount: number;
  category: string;
  note: string;
};

export function parseTurkishExpense(text: string): ParsedVoiceExpense {
  const normalized = text.toLocaleLowerCase("tr-TR").trim();
  const amount = parseAmount(normalized);

  if (normalized.includes("kahve")) {
    return { amount, category: "Kahve", note: "Kahve harcaması" };
  }

  if (normalized.includes("market") || normalized.includes("alışveriş")) {
    return { amount, category: "Market", note: "Market alışverişi" };
  }

  if (normalized.includes("taksi")) {
    return { amount, category: "Ulaşım", note: "Taksi" };
  }

  if (normalized.includes("benzin")) {
    return { amount, category: "Benzin", note: "Benzin" };
  }

  if (normalized.includes("yemek")) {
    return { amount, category: "Yemek", note: "Yemek" };
  }

  const ignoredWords = new Set(["lira", "tl", "₺", "aldım", "harcadım", "harcadim", "harcama", "ödedim", "yedim"]);
  const noteWords = normalized
    .split(/\s+/)
    .filter((word) => word && !ignoredWords.has(word) && !Number.isFinite(Number.parseFloat(word)));
  const fallback = noteWords.length > 0 ? toTitleCase(noteWords.join(" ")) : "Harcama";

  return { amount, category: fallback, note: fallback };
}

function toTitleCase(value: string) {
  return `${value.slice(0, 1).toLocaleUpperCase("tr-TR")}${value.slice(1)}`;
}
