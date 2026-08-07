export interface LegalDoc {
  title: { tr: string; en: string };
  lastUpdated: string;
  content: { tr: string; en: string };
}

export const TERMS_OF_SERVICE: LegalDoc = {
  title: {
    tr: "Kullanım Koşulları",
    en: "Terms of Service",
  },
  lastUpdated: "6 Ağustos 2026",
  content: {
    tr: `1. KABUL VE TARAFLAR
İşbu Kullanım Koşulları ("Sözleşme"), Birikim Yap mobil uygulamasını ("Uygulama") kullanan tüm gerçek kişiler ("Kullanıcı") ile Uygulama geliştiricisi ve yönetimi ("Birikim Yap") arasında akdedilmiştir. Uygulamayı indirerek, bir hesap oluşturarak veya hizmetleri kullanarak işbu Sözleşme şartlarını eksiksiz kabul etmiş sayılırsınız.

2. VERİ SORUMLUSU VE İLETİŞİM
Uygulama geliştiricisi Veri Sorumlusu sıfatını taşımaktadır. Her türlü yasal bildirim, sözleşme talebi veya soru için resmi destek e-posta adresimiz: destek@birikimyap.co.

3. HİZMETİN KAPSAMI VE NİTELİĞİ
Birikim Yap; kullanıcıların kişisel gelir, sabit gider, bütçe takibi ve birikim hedeflerini yönetmelerine yardımcı olan sesli, yapay zeka destekli ve çift/aile paylaşımlı bir bütçe simülasyon ve takip aracıdır.

4. BANKACILIK VE FİNANSAL VERİ GÜVENCESİ
- Birikim Yap hiçbir banka veya finans kuruluşu hesabına bağlanmaz.
- İnternet bankacılığı şifresi, kredi kartı numarası, CVV veya kart şifresi talep etmez ve saklamaz.
- Finans kuruluşlarından otomatik veri veya bakiye çekmez. Tüm veriler kullanıcının kendi beyanı ile işlenir.

5. YAPAY ZEKA VE AKILLI ANALİZ DİSCLAIMER'I
- Uygulama içerisinde sunulan AI önerileri, akıllı analizler, bütçe tahminleri veya motivasyon mesajları tamamen otomatik kurallar ve algoritmalar vasıtasıyla bilgilendirme amacıyla üretilir.
- Sunulan içerikler 6362 sayılı Sermaye Piyasası Kanunu veya ilgili mevzuat kapsamında yatırım tavsiyesi, portföy yöneticiliği veya resmi finansal danışmanlık niteliği taşımaz.
- Öneriler kesin doğruluk garantisi içermez; kullanıcı finansal kararlarını tamamen kendi özgür iradesi ile aldığını kabul eder.

6. SIRI VE SESLİ GİRDİ ENTEGRASYONU
- Siri ve sesli harcama girdileri, Apple iOS sistem servisleri aracılığıyla anlık konuşmadan metne dönüştürme (speech-to-text) yöntemiyle işlenir.
- Birikim Yap ses kayıtlarını kesinlikle saklamaz veya sunucularına yüklemez. Yalnızca harcama tutarı ve kategorisini içeren metin verileri işlenir.

7. ÇİFT VE AİLE HESABI PAYLAŞIMI
Kullanıcı QR Kodu veya Davet Kodu ile bir Çift / Aile Bütçesine bağlandığında, eklediği harcama kayıtlarının (tutar, kategori, tarih ve ekleyen kişi adı) ortak bütçe üyeleri tarafından görüntülenebileceğini kabul eder.

8. KULLANICI SORUMLULUKLARI VE YASAKLI KULLANIMLAR
- Kullanıcı girdiği verilerin doğruluk ve güncelliğinden bizzat sorumludur.
- Uygulamayı kötüye kullanmak, tersine mühendislik (reverse engineering) yapmak, otomatik bot/scraping kullanmak veya sahte hesaplar oluşturmak yasaktır. İhlal durumunda hesap askıya alınabilir veya sonlandırılabilir.

9. FİKRİ MÜLKİYET VE HİZMET GÜNCELLEMELERİ
- Uygulama içerisindeki yazılım kodları, arayüz tasarımları, maskot görselleri ve logolar üzerindeki tüm telif hakları Birikim Yap'a aittir.
- Birikim Yap, hizmet kapsamını, sunulan özellikleri veya abonelik/premium üyelik koşullarını önceden bildirmeksizin güncelleme veya kesintiye uğratma hakkını saklı tutar.

10. UYGULANACAK HUKUK VE YETKİLİ MAHKEME
İşbu Sözleşme Türkiye Cumhuriyeti Hukukuna tabidir. İhtilafların çözümünde İstanbul (Çağlayan) Mahkemeleri ve İcra Daireleri yetkilidir.`,
    en: `1. ACCEPTANCE & PARTIES
These Terms of Service ("Agreement") are entered into between all individual users ("User") of the Birikim Yap mobile application ("Application") and Birikim Yap development ("Birikim Yap"). By using the Application, you accept these terms in full.

2. DATA CONTROLLER & CONTACT
Official support and legal contact email: support@birikimyap.co.

3. SCOPE OF SERVICE
Birikim Yap is a voice, AI-assisted, and family-shared personal budget tracking and savings simulation tool.

4. BANKING & FINANCIAL SECURITY GUARANTEE
- Birikim Yap DOES NOT connect to bank accounts or financial institutions.
- It DOES NOT request or store credit card details, PINs, or online banking credentials.
- It DOES NOT automatically fetch bank balances. All data is user-provided.

5. AI & SMART ANALYSIS DISCLAIMER
- AI suggestions, budget forecasts, and smart insights are automatically generated for informational purposes only.
- Nothing in the app constitutes official investment advice or financial consultancy. Financial decisions are made solely at the User's discretion.

6. SIRI & VOICE INTEGRATION
- Siri commands are processed via Apple iOS Speech Recognition services.
- Birikim Yap NEVER stores or uploads audio recordings. Only parsed text expense data is processed.

7. COUPLE & FAMILY BUDGET SHARING
When joining a shared Family Budget via QR or Join Code, users agree that expense entries (amount, category, date, and adder name) will be shared with other members of that group.

8. USER RESPONSIBILITIES & PROHIBITED USES
Reverse engineering, scraping, bot usage, or system abuse is strictly prohibited and may result in immediate account suspension.

9. INTELLECTUAL PROPERTY & SERVICE CHANGES
All UI designs, code, logos, and mascot artwork belong exclusively to Birikim Yap. Terms and features may be updated periodically.

10. GOVERNING LAW
Governed by the laws of the Republic of Turkey. Jurisdiction: Istanbul (Çağlayan) Courts.`
  },
};

export const PRIVACY_POLICY: LegalDoc = {
  title: {
    tr: "Gizlilik Politikası ve KVKK / GDPR",
    en: "Privacy Policy & KVKK / GDPR",
  },
  lastUpdated: "6 Ağustos 2026",
  content: {
    tr: `1. VERİ SORUMLUSU
6698 sayılı KVKK ve Genel Veri Koruma Yönetmeliği (GDPR) uyarınca, kişisel verileriniz Veri Sorumlusu sıfatıyla Birikim Yap (destek@birikimyap.co) tarafından işlenmektedir.

2. TOPLANAN VERİLER VE İŞLEME AMAÇLARI
- Kimlik ve İletişim Verileri: Ad, soyad, e-posta adresi (Google ve Apple Sign-In OAuth servisleri üzerinden).
- Bütçe Verileri: Beyan edilen gelir, sabit gider, değişken harcamalar, birikim hedefleri ve çift/aile eşleşme kodları.
- Teknik Veriler: Cihaz OS, dil, para birimi ve uygulama tercihleri (koyu mod, haptik vb.).

3. ÜÇÜNCÜ TARAF ENTEGRASYONLARI
- Google & Apple Sign-In: Güvenli OAuth kimlik doğrulama.
- Supabase Altyapısı: Şifrelenmiş bulut veritabanı ve yedekleme (RLS Row Level Security koruması altında).
- Yerel Depolama (AsyncStorage): Çevrimdışı kullanım için cihaz içi önbellek.
Kişisel verileriniz reklam şirketlerine satılmaz veya pazarlama amacıyla paylaşılmaz.

4. VERİ GÜVENLİĞİ VE SAKLAMA SÜRELERİ
- Tüm veri aktarımları SSL/TLS şifreleme ve makul idari/teknik tedbirler ile korunur.
- Verileriniz hesabınız aktif kaldığı sürece saklanır. Hesap silindiğinde bulut yedekleri en geç 30 gün içinde kalıcı ve geri döndürülemez şekilde imha edilir.

5. VERİ TAŞINABİLİRLİĞİ VE HESAP SİLME HAKKI
- Kullanıcılar dilediği zaman Profil sayfasından "Hesabımı Sil" seçeneğiyle tüm verilerini anında temizleyebilir veya kişisel verilerinin bir kopyasını dışa aktarmayı talep edebilir.
- Çıkış yapılması durumunda çevrimdışı yedeklerinizin korunması için bulut senkronizasyonu teyit edilir.

6. YAŞ SINIRI
Uygulama kendi adına yasal sözleşme yapabilecek yaştaki kullanıcılar içindir. Reşit olmayanların ebeveyn gözetiminde kullanması tavsiye edilir.

7. İLETİŞİM
Tüm KVKK/GDPR talepleriniz için: destek@birikimyap.co.

Son Güncelleme Tarihi: 6 Ağustos 2026`,
    en: `1. DATA CONTROLLER
Processed by Birikim Yap (support@birikimyap.co) under KVKK & GDPR guidelines.

2. COLLECTED DATA & PURPOSES
Identity data (Google/Apple Auth), user-entered budget amounts, and app settings for budget tracking purposes.

3. THIRD-PARTY INTEGRATIONS
Google & Apple Sign-In for OAuth, Supabase for RLS-encrypted cloud storage, AsyncStorage for offline cache. Data is NEVER sold to ad networks.

4. DATA SECURITY & RETENTION
Secured via SSL/TLS and RLS policies. Deleted account data is irreversibly wiped within 30 days.

5. DATA PORTABILITY & RIGHT TO ERASURE
Users can delete their account at any time via Profile Settings or request a copy of their data by emailing support@birikimyap.co.

6. AGE LIMIT
Intended for users capable of forming legally binding contracts. Minors should use under parental guidance.

7. CONTACT
Privacy inquiries: support@birikimyap.co.

Last Updated: August 6, 2026`
  },
};
