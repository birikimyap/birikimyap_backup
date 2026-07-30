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
  lastUpdated: "30 Temmuz 2026",
  content: {
    tr: `1. KABUL VE TARAFLAR
Bu Kullanım Koşulları, Birikim Yap ("Uygulama") uygulamasını kullanan tüm bireysel kullanıcılar ("Kullanıcı") ile Birikim Yap yönetimi arasında geçerlidir. Uygulamayı indirerek, hesabınızı oluşturarak veya uygulamayı kullanarak işbu koşulları kabul etmiş sayılırsınız.

2. HİZMETİN KAPSAMI
Birikim Yap; kullanıcıların kişisel gelir, gider, bütçe ve birikim hedeflerini takip etmelerine olanak tanıyan sesli ve yapay zeka destekli bir kişisel finans asistanıdır. Uygulama bir yatırım tavsiyesi, banka veya resmi finansal danışmanlık hizmeti sunmaz.

3. KULLANICI SORUMLULUKLARI
- Kullanıcı, uygulamaya girdiği verilerin doğruluk ve gizliliğinden kendisi sorumludur.
- Hesap şifresi ve oturum güvenliği kullanıcının sorumluluğundadır.

4. FİKRİ MÜLKİYET VE HAKLAR
Uygulama tasarımı, kaynak kodları, logo, mascot görsel ögeleri ve algoritmaların tüm mülkiyet hakları Birikim Yap'a aittir.

5. İLETİŞİM
Sorularınız ve destek talepleriniz için destek@birikimyap.co adresi üzerinden bizimle iletişime geçebilirsiniz.`,
    en: `1. ACCEPTANCE & PARTIES
These Terms of Service apply between all individual users ("User") and Birikim Yap management. By downloading, creating an account, or using the app, you agree to these terms.

2. SCOPE OF SERVICE
Birikim Yap is a voice and AI-assisted personal finance management assistant allowing users to track incomes, expenses, budgets, and savings goals. The app does not provide financial investment advice or banking services.

3. USER RESPONSIBILITIES
- Users are solely responsible for the accuracy and confidentiality of the data they input.
- Account credentials and session security are under the user's responsibility.

4. INTELLECTUAL PROPERTY
All app designs, source codes, logos, mascot assets, and algorithms belong to Birikim Yap.

5. CONTACT
For inquiries and support, contact us at support@birikimyap.co.`,
  },
};

export const PRIVACY_POLICY: LegalDoc = {
  title: {
    tr: "Gizlilik Politikası ve KVKK",
    en: "Privacy Policy & Data Protection",
  },
  lastUpdated: "30 Temmuz 2026",
  content: {
    tr: `1. GİRİŞ VE GİZLİLİK TAAHHÜDÜ
Birikim Yap olarak kişisel verilerinizin ve finansal mahreriyetinizin korunmasına azami özen gösteriyoruz. İşbu Gizlilik Politikası, verilerinizin nasıl toplandığını, kullanıldığını ve korunduğunu açıklar.

2. TOPLANAN VERİLER
- Hesap Bilgileri: Ad-soyad, e-posta adresi (Google/Apple Auth).
- Finansal Veriler: Kendi rızanızla eklediğiniz gelir, gider, bütçe ve birikim hedefi kayıtları.
- Cihaz ve Kullanım Verileri: Dil tercihi, para birimi ve uygulama ayarları.

3. VERİLERİN İŞLENMESİ VE SAKLANMASI
Finansal verileriniz hem cihazınızda yerel önbellekte hem de Supabase bulut sunucularında uçtan uca şifreli şemalarla saklanır. Verileriniz asla 3. taraf reklam verenlerle satılmaz veya paylaşılmaz.

4. VERİ SİLME VE HESAP KAPATMA HAKKI
Dilediğiniz zaman profil ayarlarınızdan veya destek@birikimyap.co adresine yazarak tüm bulut ve yerel verilerinizin kalıcı olarak silinmesini talep edebilirsiniz.

5. İLETİŞİM
Gizlilik politikası ile ilgili sorularınız için destek@birikimyap.co adresinden bize ulaşabilirsiniz.`,
    en: `1. INTRODUCTION & COMMITMENT
At Birikim Yap, we prioritize the protection of your personal data and financial privacy. This Privacy Policy outlines how your information is collected, used, and safeguarded.

2. COLLECTED DATA
- Account Info: Full name, email address (Google/Apple Auth).
- Financial Data: Incomes, expenses, budgets, and savings goals added by you.
- Device & Usage Data: Language preference, currency, and app settings.

3. DATA PROCESSING & STORAGE
Your financial data is stored locally on your device and encrypted on Supabase cloud servers. Your data is NEVER sold or shared with third-party advertisers.

4. DATA DELETION RIGHTS
You can request permanent deletion of all your cloud and local data at any time from profile settings or by emailing support@birikimyap.co.

5. CONTACT
For privacy inquiries, reach us at support@birikimyap.co.`,
  },
};
