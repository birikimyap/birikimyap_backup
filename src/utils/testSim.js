"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const finance_1 = require("./finance");
const voiceExpense_1 = require("./voiceExpense");
const currency_1 = require("./currency");
console.log("==========================================");
console.log("=== BİRİKİM YAP FİNANSAL SIMÜLASYON TESTİ ===");
console.log("==========================================");
// SCENARIO 1: Standart Kullanıcı (100k Gelir, 45k Gider, 25k Birikim)
const incomes1 = [{ id: "1", label: "Maaş", amount: 100000, period: "monthly" }];
const fixedExpenses1 = [{ id: "e1", label: "Kira", amount: 45000, period: "monthly", isFixed: true }];
const savingsGoal1 = { title: "Ev", targetAmount: 500000, savedAmount: 0, monthlyContribution: 25000 };
const plan1 = (0, finance_1.calculateFinancePlan)(incomes1, fixedExpenses1, savingsGoal1, "daily");
console.log("\n[TEST 1] Standart Plan Başlangıcı:");
console.log("  - Aylık Gelir:", (0, currency_1.formatCurrency)(plan1.monthlyIncome));
console.log("  - Sabit Giderler:", (0, currency_1.formatCurrency)(plan1.totalFixedExpenses));
console.log("  - Kalan Serbest Para:", (0, currency_1.formatCurrency)(plan1.monthlyRemaining));
console.log("  - Hedeflenen Birikim:", (0, currency_1.formatCurrency)(plan1.monthlySavings));
console.log("  - Harcama Limiti (Aylık):", (0, currency_1.formatCurrency)(plan1.spendableMonthlyBudget));
console.log("  - Başlangıç Günlük Limiti:", (0, currency_1.formatCurrency)(plan1.limits.daily));
// 1.1: 5. günde 15.000 TL harcandı
const now = new Date();
const expenses1 = [
    ...fixedExpenses1,
    { id: "v1", label: "Alışveriş", amount: 15000, period: "monthly", isFixed: false, occurredAt: now.toISOString() }
];
const dynamicDailyAfter15k = (0, finance_1.getDynamicDailyLimit)(incomes1, expenses1, savingsGoal1, now);
console.log("\n[TEST 1.1] İlk 5 Günde 15.000 TL Harcandığında:");
console.log("  -> Yeniden Dengelenmiş Günlük Limit:", (0, currency_1.formatCurrency)(dynamicDailyAfter15k), "/gün (Fren yapıldı)");
// 1.2: Toplam 35.000 TL harcandı (+5k Aşım)
const expensesOverused = [
    ...fixedExpenses1,
    { id: "v2", label: "Büyük Harcama", amount: 35000, period: "monthly", isFixed: false, occurredAt: now.toISOString() }
];
const dynamicDailyOverused = (0, finance_1.getDynamicDailyLimit)(incomes1, expensesOverused, savingsGoal1, now);
const revisedSavings = (0, finance_1.getRevisedSavingsStatus)(incomes1, expensesOverused, savingsGoal1, now);
console.log("\n[TEST 1.2] 35.000 TL (+5.000 TL Limit Aşımı) Sonrası:");
console.log("  -> Dinamik Günlük Limit:", (0, currency_1.formatCurrency)(dynamicDailyOverused), "(0 TL kilitli olmalı)");
console.log("  -> Birikim Aşıldı mı?:", revisedSavings.isOverused ? "EVET ⚠️" : "HAYIR ✅");
console.log("  -> Bütçe Aşım Miktarı:", (0, currency_1.formatCurrency)(revisedSavings.overuseAmount));
console.log("  -> Gerçekleşen Revize Birikim:", (0, currency_1.formatCurrency)(revisedSavings.revisedSavings), "(25.000 TL yerine 20.000 TL olmalı)");
// SCENARIO 2: Edge Case - Borçlu / İflas Senaryosu (Gelir 20k, Gider 25k)
const incomes2 = [{ id: "1", label: "Maaş", amount: 20000, period: "monthly" }];
const fixedExpenses2 = [{ id: "e1", label: "Kira", amount: 25000, period: "monthly", isFixed: true }];
const plan2 = (0, finance_1.calculateFinancePlan)(incomes2, fixedExpenses2, savingsGoal1, "daily");
console.log("\n[TEST 2] Borçlu / Ekstrem Senaryo (Gelir 20k, Gider 25k):");
console.log("  -> Kalan Serbest Para:", (0, currency_1.formatCurrency)(plan2.monthlyRemaining));
console.log("  -> Harcama Limiti:", (0, currency_1.formatCurrency)(plan2.spendableMonthlyBudget));
console.log("  -> Günlük Limit:", (0, currency_1.formatCurrency)(plan2.limits.daily));
// SCENARIO 3: Voice Expense Parsing Test
console.log("\n[TEST 3] Sesli Harcama Ayrıştırma Testleri:");
const voiceSamples = [
    "Dün benzinliğe 1500 lira verdik",
    "Taksiye 250 tl ödedim",
    "Starbucks kahve 185,50 TL",
    "Marketten domates ekmek aldım 340 lira tuttu"
];
voiceSamples.forEach((sample) => {
    const parsed = (0, voiceExpense_1.parseTurkishExpense)(sample);
    console.log(`  -> "${sample}" => Tutar: ${parsed.amount} TL | Kategori: ${parsed.category} | Etiket: ${parsed.label}`);
});
console.log("\n==========================================");
console.log("=== SIMÜLASYON TESTİ BAŞARIYLA BİTTİ ===");
console.log("==========================================");
