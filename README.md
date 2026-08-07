# 📱 Birikim Yap — Akıllı Harcama & Sesli Bütçe Yönetimi Uygulaması

Bu doküman, **Birikim Yap** uygulamasının mimarisini, dosya yapısını, veritabanı modelini, Apple Watch entegrasyonunu ve Antigravity IDE / ajan kurallarını içeren eksiksiz teknik kılavuzdur.

---

## 📍 1. Dosya Yolları ve Depo Bilgileri

- **Çalışma Dizini (Workspace Root)**: `/Users/gurkanaygun/Desktop/birikim_yap`
- **Canlı Web Sitesi Dizini (Vercel Production)**: `/Users/gurkanaygun/Desktop/website` & `/Users/gurkanaygun/Desktop/birikim_yap/website`
- **Canlı Web URL**: [https://birikimyap.app](https://birikimyap.app)
- **Web Yönetici Paneli**: [https://birikimyap.app/admin.html](https://birikimyap.app/admin.html) (Giriş PIN: `1923` veya `birikim2026!`)
- **GitHub Deposu**: `https://github.com/birikimyap/birikimyap_backup.git` (`main` dalı senkronize)

---

## 🛠️ 2. Teknoloji Yığını & Mimari

- **Mobil Uygulama**: React Native + Expo SDK 51, TypeScript, React Navigation
- **State Yönetimi**: Zustand + AsyncStorage (`user_plan_${userId}` mühürlü yerel depolama)
- **Bulut & Kimlik Doğrulama**: Supabase (Google & Apple Sign-In OAuth, Dual-Backup: `user_data` + `website` tabloları, RLS Row Level Security)
- **Canlı Piyasa Kurları**: Truncgil Finans API (`https://finans.truncgil.com/today.json` — Gram Altın, USD, EUR, GBP)
- **Apple WatchOS Entegrasyonu**: Native Swift + ObjC Bridge (`WatchSyncModule.swift`), SwiftUI `BirikimYapWatch` uygulaması, AppGroup (`group.com.birikimyapsiri.app`) ve `WCSessionDelegate`
- **Siri Kestirmeleri**: iOS Speech Recognition (`"Hey Siri, Ne kadar?"` sesli harcama otomasyonu)

---

## 🧮 3. Çekirdek Finans Matematiği (Math & Limit Invariants)

- **Aylık Gelir (`monthlyIncome`)**: Tüm sabit ve değişken gelirlerin aylık toplamı.
- **Sabit Giderler (`totalFixedExpenses`)**: Kira, faturalar vb. sabit harcamaların aylık toplamı.
- **Aylık Kalan (`monthlyRemaining`)**: `monthlyIncome - totalFixedExpenses` (Min: 0).
- **Harcayabilir Aylık Bütçe (`spendableMonthlyBudget`)**: `monthlyRemaining - monthlySavings`.
- **Dinamik Limitler**:
  - Günlük Limit (`limits.daily`): `spendableMonthlyBudget / 30`
  - Haftalık Limit (`limits.weekly`): `spendableMonthlyBudget / 4.3`
  - Aylık Limit (`limits.monthly`): `spendableMonthlyBudget`
- Tüm sayısal değerler `parseAmount` ve `normalizeAmount` işlevlerinden geçirilmektedir.

---

## ⌚ 4. Apple Watch & Siri Senkronizasyonu

- `src/utils/watchSync.ts` modülü, React Native tarafından gelen limit verilerini `WatchSyncModule.swift` modülüne iletir.
- Swift modülü veriyi `UserDefaults(suiteName: "group.com.birikimyapsiri.app")` ve `WCSession.default.updateApplicationContext` aracılığıyla Apple Watch'a canlı aktarır.

---

## 🤖 5. Antigravity IDE & Ajan Kuralları (`.agents/AGENTS.md`)

1. **Dil Ayarı**: Tüm iletişim ve dokümantasyon Türkçe yürütülür.
2. **Düzen Refaktörü Yasaktır (No Layout Refactoring)**: Ana iskelet, flex/grid düzenleri ve sayfa yapıları bozulmaz.
3. **Sıfır Derleme Hatası (Zero Compilation Errors)**: Değişiklik sonrası `npm run typecheck` 0 hata vermeden turn tamamlanmaz.
4. **Çift Depolama & Bulut Geri Yükleme**: Kullanıcı oturum açtığında cloud planı otomatik yüklenir.
5. **Yedekleme ve Push Onayı**: Git commit, zip yedeği ve GitHub push işlemleri onay alınarak yürütülür.

---

## 🚀 6. TestFlight & Build Sürüm Geçmişi

- **Son Sürüm**: **Build 118**
- **TestFlight Upload Yolu**: `xcrun altool --upload-app -f /tmp/birikimyap_b118_export/BirikimYap.ipa`
- **Son Durum**: `UPLOAD SUCCEEDED` (Delivery UUID: `a9b4a3fa-0bc7-4d32-aa63-e3614cd2b6b7`)
