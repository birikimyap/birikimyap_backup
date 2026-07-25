"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseTurkishExpense = parseTurkishExpense;
const financeStore_1 = require("@/store/financeStore");
const currency_1 = require("@/utils/currency");
const expenseDictionary_1 = require("@/utils/expenseDictionary");
function parseTurkishExpense(text) {
    const language = financeStore_1.useFinanceStore.getState().language;
    const normalized = text.toLowerCase().trim();
    const amount = (0, currency_1.parseAmount)(normalized);
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
    for (const item of expenseDictionary_1.EXPENSE_DICTIONARY) {
        const listToCheck = language === "tr" ? item.keywords : item.enKeywords;
        // Check if any word in descriptive text matches keywords cleanly without collision
        const hasMatch = listToCheck.some((kw) => {
            if (kw.length <= 3) {
                return descriptiveWords.some((word) => word === kw ||
                    word === kw + "ler" ||
                    word === kw + "lar" ||
                    word === kw + "im" ||
                    word === kw + "ım" ||
                    word === kw + "in" ||
                    word === kw + "ın" ||
                    word === kw + "i" ||
                    word === kw + "ı");
            }
            const phrase = descriptiveWords.join(" ");
            return phrase.includes(kw) || descriptiveWords.some(word => word.startsWith(kw));
        });
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
function toTitleCase(value) {
    return `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`;
}
