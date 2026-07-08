# Rules

- Whenever the user says "bana anahtarı ver" (or variations like "anahtarı ver"), the agent MUST immediately output the following PowerShell command block to navigate to the project directory, reveal the folder, and start the Expo server:
  ```powershell
  cd C:\projeler\birikim_yap ; explorer . ; npx expo start
  ```

- **Mevcut Tasarımı ve Sayfa Yapısını Koruma Kuralları (No Layout Refactoring):**
  * Uygulamanın ana iskeletini, sayfa yapısını, flex/grid düzenini veya genel görsel şablonlarını bozacak hiçbir refaktör/düzenleme işlemi YAPILMAYACAKTIR.
  * Harcama Ekleme (VoiceExpenseSheet) gibi form ve modal ekranlarındaki tasarımsal iyileştirmelerde:
    * Sayfa veya modal yapısına yeni iskeletsel elemanlar (hızlı seçim satırları, ekstra listeler, özel badge satırları vb.) EKLENMEYECEKTİR.
    * Müdahaleler her zaman mevcut bileşen iskeletini koruyarak sadece görsel iyileştirmeyle (canlı renkler, yüksek kontrast, sol kenar çizgisi vurguları, ikonlar ve degrade butonlar) sınırlı tutulacaktır.
  * Tasarımsal değişiklikler yalnızca kullanıcı talep ettiğinde, mevcut düzenin sınırları korunarak yapılmalıdır.

- **Paranoyak Hata ve Regresyon Tarama Kuralları:**
  * Herhangi bir dosya üzerinde düzenleme yapıldıktan sonra mutlaka terminal üzerinden `npm run typecheck` komutu çalıştırılarak derleme hataları taranacaktır. 0 hata (zero compilation errors) elde edilmeden turn sonlandırılmayacaktır.
  * Dosyalar üzerindeki değişiklikler olabildiğince izole ve atomik tutulmalıdır; bir alanı düzeltirken yan alanları bozmamak için bağımlılıklar (dependencies) dikkatle okunmalıdır.

- **Çekirdek Finans Matematiğinin Korunması (Math & Limit Invariants):**
  * `src/utils/finance.ts` ve `src/store/financeStore.ts` içindeki temel limit/bütçe matematik modelleri korunmalıdır:
    * `monthlyIncome`: Tüm gelirlerin aylık bazda toplamıdır.
    * `totalFixedExpenses`: Tüm sabit giderlerin aylık bazda toplamıdır.
    * `monthlyRemaining`: `monthlyIncome - totalFixedExpenses` farkıdır (0'dan küçük olamaz).
    * `spendableMonthlyBudget`: `monthlyRemaining - monthlySavings` farkıdır.
    * Limit hesaplamalarında; günlük limit `spendableMonthlyBudget / 30`, haftalık limit `spendableMonthlyBudget / 4.3`, aylık limit ise doğrudan `spendableMonthlyBudget` olarak hesaplanır.
  * Tüm gelir/gider miktarlarının sayısal değerleri, veritabanına kaydedilmeden ve matematiksel işleme sokulmadan önce `parseAmount` ve `normalizeAmount` işlevlerinden geçirilerek güvenli `number` tipine dönüştürülmelidir.

- **Analiz Sekmesi Dönem ve Grafik Kuralları (Bugün/Haftalık/Aylık):**
  * Analiz sekmesindeki dönem seçici `daily` (Bugün), `weekly` (Haftalık) ve `monthly` (Aylık) olmak üzere üç durumu desteklemelidir.
  * Bugün (`daily`) görünümünde dikey bar grafiği gün içindeki harcamaları 4 zaman dilimine bölmelidir:
    * Gece (00:00 - 06:00)
    * Sabah (06:00 - 12:00)
    * Öğle (12:00 - 18:00)
    * Akşam (18:00 - 24:00)
  * Bugün görünümündeki harcama ve kalan limit karşılaştırmaları her zaman kullanıcının `limits.daily` değeri üzerinden yapılmalıdır.
  * Kategorisel analiz kırılımı (`analysisCategoryData`), seçilen analiz dönemine (Bugün/Haftalık/Aylık) göre filtrelenen harcamaları baz almalıdır.

- **Yerel Depolama (Storage Rehydration) Güvenliği:**
  * Zustand store'da yapılan değişiklikler yerel depolamada (`AsyncStorage`) kayıtlı eski şemalarla çakışmamalıdır.
  * Store rehydrated olduğunda, planın tutarlılığını garanti etmek için `state.refreshPlan()` işlevi çağrılarak hesaplamaların güncelliği doğrulanmalıdır.
  * Gerekli durumlarda geliştiricinin test verilerini sıfırlayabilmesi için giriş sayfasındaki test aracı sıfırlama butonu muhafaza edilecektir.
