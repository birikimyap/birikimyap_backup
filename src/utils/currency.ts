import { useFinanceStore } from "@/store/financeStore";
import { ExchangeRates } from "./exchangeRates";

export const convertCurrency = (amount: number, from: string, to: string, rates?: ExchangeRates): number => {
  if (from === to || !amount) return amount;

  const activeRates = rates || {
    TRY: 1,
    USD: 0.025,
    EUR: 0.023,
    GBP: 0.019,
  };

  const fromRate = activeRates[from] || 1;
  const toRate = activeRates[to] || 1;

  // Önce TRY bazına çevir, sonra Hedef birime çevir
  const amountInTRY = amount / fromRate;
  return amountInTRY * toRate;
};

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
  
  const isNegative = value < 0;
  const absValue = Math.abs(value);
  const formatted = new Intl.NumberFormat(locale).format(absValue);
  return isNegative ? `-${currencySign}${formatted}` : `${currencySign}${formatted}`;
};

export function parseAmount(value: string | number): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (!value) return 0;
  const str = String(value).trim();
  if (!str) return 0;

  // Virgül (,) varsa ondalık/küsurat kısmıdır. Örn: "250.000,50" -> 250000.5
  if (str.includes(",")) {
    const parts = str.split(",");
    const intPart = parts[0].replace(/\D/g, "");
    const decPart = parts.slice(1).join("").replace(/\D/g, "");
    
    const combined = `${intPart || "0"}.${decPart || "0"}`;
    const parsed = Number.parseFloat(combined);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  // Virgül yoksa tamamı tam sayıdır. Örn: "250.000" -> 250000
  const cleanInt = str.replace(/\D/g, "");
  if (!cleanInt) return 0;

  const parsed = Number.parseInt(cleanInt, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Kullanıcı miktar alanına (TextInput) veri girerken ve SİLERKEN:
 * - Rakamları canlı olarak binlik ayırıcı nokta (.) ile biçimlendirir (Örn: 250000 -> 250.000).
 * - Silme tuşuna basıldığında rakamlar eksiksiz ve takılmadan silinir (Asla nokta virgüle dönüşmez).
 * - Kullanıcı açıkça virgül (,) koyarsa küsuratı korur (Örn: 250.000,50).
 */
export function formatAmountInput(val: string): string {
  if (!val) return "";

  // Sadece rakamlar, nokta ve virgül
  const raw = val.replace(/[^0-9.,]/g, "");
  if (!raw) return "";

  // Eğer kullanıcı açıkça virgül (,) kullandıysa ondalık/küsurat vardır
  if (raw.includes(",")) {
    const parts = raw.split(",");
    const intRaw = parts[0].replace(/\D/g, "");
    const decRaw = parts.slice(1).join("").replace(/\D/g, "").slice(0, 2);

    let formattedInt = "";
    if (intRaw) {
      formattedInt = intRaw.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    } else {
      formattedInt = "0";
    }

    // Virgülden sonraki karakter sildiyse veya virgülde durduysa (Örn: "250,")
    if (parts.length > 1 && parts[1] === "") {
      return `${formattedInt},`;
    }

    return `${formattedInt},${decRaw}`;
  }

  // Virgül yoksa tamamı tam sayıdır. Rakam dışı her şeyi silip binlik noktalarını sıfırdan koy!
  const intRaw = raw.replace(/\D/g, "");
  if (!intRaw) return "";

  return intRaw.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

