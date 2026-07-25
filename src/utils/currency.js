"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatCurrency = void 0;
exports.parseAmount = parseAmount;
exports.formatAmountInput = formatAmountInput;
const financeStore_1 = require("@/store/financeStore");
const formatCurrency = (value) => {
    const currency = financeStore_1.useFinanceStore.getState().currency || "TRY";
    let currencySign = "₺";
    let locale = "tr-TR";
    if (currency === "USD") {
        currencySign = "$";
        locale = "en-US";
    }
    else if (currency === "EUR") {
        currencySign = "€";
        locale = "de-DE";
    }
    const isNegative = value < 0;
    const absValue = Math.abs(value);
    const formatted = new Intl.NumberFormat(locale).format(absValue);
    return isNegative ? `-${currencySign}${formatted}` : `${currencySign}${formatted}`;
};
exports.formatCurrency = formatCurrency;
function parseAmount(value) {
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
/**
 * Kullanıcı miktar alanına (TextInput) veri girerken:
 * - Rakamları canlı olarak binlik ayırıcı ile biçimlendirir (Örn: 250000 -> 250.000).
 * - Küsurat (virgül) eklendiğinde küsuratı korur (Örn: 250.000,50).
 */
function formatAmountInput(val) {
    if (!val)
        return "";
    // Sadece rakamlar, nokta ve virgüle izin ver
    const raw = val.replace(/[^0-9.,]/g, "");
    if (!raw)
        return "";
    // Eğer metinde virgül (,) varsa ondalık kısmı ayrıştır
    if (raw.includes(",")) {
        const parts = raw.split(",");
        const integerRaw = parts[0].replace(/\D/g, "");
        const decimalRaw = parts.slice(1).join("").replace(/\D/g, "").slice(0, 2);
        let formattedInteger = "0";
        if (integerRaw) {
            formattedInteger = integerRaw.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        }
        return `${formattedInteger},${decimalRaw}`;
    }
    // Eğer metinde sadece nokta (.) varsa ve noktadan sonra tam 1 veya 2 basamak varsa (küsurat gibi)
    // ama birden fazla nokta yoksa ondalık virgülüne çevir
    const dotParts = raw.split(".");
    if (dotParts.length === 2 && dotParts[1].length > 0 && dotParts[1].length < 3) {
        const integerRaw = dotParts[0].replace(/\D/g, "");
        const decimalRaw = dotParts[1].replace(/\D/g, "").slice(0, 2);
        let formattedInteger = "0";
        if (integerRaw) {
            formattedInteger = integerRaw.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        }
        return `${formattedInteger},${decimalRaw}`;
    }
    // Sadece tam sayı (tüm binlik noktaları temizle ve sıfırdan canlı binlik noktaları koy)
    const integerRaw = raw.replace(/\D/g, "");
    if (!integerRaw)
        return "";
    return integerRaw.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
function getDecimalSeparator(value, lastComma, lastDot) {
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
