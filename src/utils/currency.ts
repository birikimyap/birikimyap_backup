import { useFinanceStore } from "@/store/financeStore";

export const formatCurrency = (value: number) => {
  const currency = useFinanceStore.getState().currency || "TRY";
  let currencySign = "₺";
  let locale = "tr-TR";
  
  if (currency === "USD") {
    currencySign = "$";
    locale = "en-US";
  } else if (currency === "EUR") {
    currencySign = "€";
    locale = "de-DE";
  }
  
  return `${currencySign}${new Intl.NumberFormat(locale).format(Math.max(value, 0))}`;
};

export function parseAmount(value: string | number) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const raw = value.trim().replace(/\s/g, "");

  if (!raw) {
    return 0;
  }

  const match = raw.match(/\d+(?:[.,]\d+)*/);

  if (!match) {
    return 0;
  }

  const numeric = match[0];
  const lastComma = numeric.lastIndexOf(",");
  const lastDot = numeric.lastIndexOf(".");
  const decimalSeparator = getDecimalSeparator(numeric, lastComma, lastDot);
  const normalized = decimalSeparator
    ? numeric
        .replace(new RegExp(`\\${decimalSeparator === "," ? "." : ","}`, "g"), "")
        .replace(decimalSeparator, ".")
    : numeric.replace(/[.,]/g, "");
  const parsed = Number.parseFloat(normalized);

  return Number.isFinite(parsed) ? parsed : 0;
}

function getDecimalSeparator(value: string, lastComma: number, lastDot: number) {
  if (lastComma === -1 && lastDot === -1) {
    return "";
  }

  if (lastComma !== -1 && lastDot !== -1) {
    return lastComma > lastDot ? "," : ".";
  }

  const separator = lastComma !== -1 ? "," : ".";
  const parts = value.split(separator);
  const lastPart = parts[parts.length - 1];

  if (parts.length > 2 || lastPart.length === 3) {
    return "";
  }

  return separator;
}
