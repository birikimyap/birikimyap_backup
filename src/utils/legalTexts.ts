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
  lastUpdated: "31 Temmuz 2026",
  content: {
    tr: `1. KABUL VE TARAFLAR
İşbu Kullanım Koşulları ("Sözleşme"), Birikim Yap mobil uygulamasını ("Uygulama") kullanan tüm gerçek kişiler ("Kullanıcı") ile Uygulama yönetimi ("Birikim Yap") arasında akdedilmiştir. Uygulamayı indirerek, bir hesap oluşturarak veya hizmetleri kullanarak işbu Sözleşme şartlarını eksiksiz kabul etmiş sayılırsınız.

2. HİZMETİN KAPSAMI VE NİTELİĞİ
Birikim Yap; kullanıcıların kişisel gelir, sabit gider, bütçe takibi ve birikim hedeflerini yönetmelerine yardımcı olan sesli ve yapay zeka destekli bir kişisel bütçe simülasyon ve takip aracıdır.

3. YATIRIM TAVSİYESİ VE FİNANSAL DANIŞMANLIK DİSCLAIMER'I
Uygulama içerisinde sunulan hiçbir veri, grafik, AI tavsiyesi veya analiz 6362 sayılı Sermaye Piyasası Kanunu veya ilgili mevzuat kapsamında yatırım tavsiyesi, portföy yöneticiliği veya resmi finansal danışmanlık niteliği taşımaz. Kullanıcı, finansal kararlarını tamamen kendi özgür iradesi ile aldığını kabul eder.

4. KULLANICI SORUMLULUKLARI VE VERİ DOĞRULUĞU
- Kullanıcı, Uygulamaya girdiği gelir, gider ve bütçe verilerinin doğruluk ve güncelliğinden bizzat sorumludur.
- Hesap güvenliği, şifre ve kimlik doğrulama bilgilerinin (Google / Apple kimlikleri) gizliliği ve güvenliği tamamen Kullanıcı'ya aittir. Hesabınız üzerinden gerçekleşen tüm işlemlerden tarafınız sorumludur.

5. YASAKLI KULLANIMLAR
Kullanıcı, Uygulamayı kullanırken aşağıdaki eylemlerde bulunmayacağını kabul ve taahhüt eder:
- Sistemi kötüye kullanmak veya Uygulamanın çalışmasını engelleyici / zorlaştırıcı teknik girişimlerde bulunmak,
- Uygulama üzerinde tersine mühendislik (reverse engineering) yapmak, kaynak kodlarını çözmek, decompile etmek veya kopyalamak,
- Otomatik veri çekme (scraping), bot, spider veya indeksleme yazılımları kullanmak,
- Sahte hesaplar oluşturmak veya başkasının kimlik bilgileriyle yetkisiz erişim sağlamak.

6. FİKRİ MÜLKİYET HAKLARI
Uygulama içerisindeki tüm yazılım kodları, arayüz tasarımları, logo, maskot görselleri, grafikler, veritabanı yapısı ve ticari unvanlar üzerindeki mülkiyet ve telif hakları münhasıran Birikim Yap'a aittir. İzin alınmaksızın çoğaltılamaz ve kopyalanamaz.

7. HİZMETTE DEĞİŞİKLİK VE ASKIYA ALMA HAKKI
Birikim Yap, Uygulamanın özelliklerini, sunulan hizmet kapsamını veya arayüzünü dilediği zaman önceden bildirmeksizin değiştirme, güncelleme, hizmeti geçici olarak durdurma veya askıya alma hakkını saklı tutar.

8. SORUMLULUĞUN SINIRLANDIRILMASI
Birikim Yap;
- Cihaz arızaları, internet kesintileri veya kullanıcı hatasından kaynaklanan veri kayıplarından,
- Kullanıcının Uygulamadaki verilere dayanarak aldığı finansal kararlardan kaynaklanan doğrudan veya dolaylı zararlardan,
- Üçüncü taraf altyapı sağlayıcılarındaki (Apple, Google, Supabase) teknik aksaklıklardan doğan zararlardan sorumlu tutulamaz.

9. UYGULANACAK HUKUK VE YETKİLİ MAHKEME
İşbu Sözleşme'nin uygulanmasından ve yorumlanmasından doğacak her türlü uyuşmazlığın çözümünde Türkiye Cumhuriyeti Hukuku uygulanacaktır. İhtilafların çözümünde İstanbul (Çağlayan) Mahkemeleri ve İcra Daireleri yetkilidir.

10. İLETİŞİM BİLGİLERİ
Kullanım koşulları ile ilgili sorularınız, bildirimleriniz ve hukuki talepleriniz için destek@birikimyap.co e-posta adresi üzerinden bizimle iletişime geçebilirsiniz.`,
    en: `1. ACCEPTANCE & PARTIES
These Terms of Service ("Agreement") are entered into between all individual users ("User") of the Birikim Yap mobile application ("Application") and Birikim Yap management ("Birikim Yap"). By downloading, creating an account, or using the Application, you fully accept these Terms.

2. SCOPE OF SERVICE
Birikim Yap is an AI and voice-assisted personal budgeting and savings tracking tool designed to assist users in managing incomes, fixed expenses, budgets, and savings goals.

3. INVESTMENT ADVICE DISCLAIMER
No data, chart, AI insight, or forecast provided within the Application constitutes investment advice, portfolio management, or financial consultancy under applicable capital market laws. Financial decisions are made solely at the User's own discretion.

4. USER RESPONSIBILITIES & DATA ACCURACY
- Users are solely responsible for the accuracy and completeness of data entered into the Application.
- Account security, password confidentiality, and authentication credentials (Google / Apple Auth) are under the User's sole responsibility.

5. PROHIBITED USES
Users agree not to engage in any of the following:
- System abuse, scraping, bot integration, or automated data extraction,
- Reverse engineering, decompiling, or copying the Application's source code,
- Creating fake accounts or accessing accounts without authorization.

6. INTELLECTUAL PROPERTY
All software code, UI designs, mascot artwork, logos, and algorithms belong exclusively to Birikim Yap.

7. SERVICE MODIFICATION & SUSPENSION
Birikim Yap reserves the right to modify, update, suspend, or discontinue any feature or service at any time without prior notice.

8. LIMITATION OF LIABILITY
Birikim Yap shall not be liable for data loss, indirect damages, device failures, or financial decisions made based on Application data.

9. GOVERNING LAW & JURISDICTION
This Agreement shall be governed by the laws of the Republic of Turkey. Courts and Execution Offices of Istanbul (Çağlayan) shall have jurisdiction.

10. CONTACT INFORMATION
For support and legal inquiries, contact us at support@birikimyap.co.`
  },
};

export const PRIVACY_POLICY: LegalDoc = {
  title: {
    tr: "Gizlilik Politikası ve KVKK",
    en: "Privacy Policy & Data Protection",
  },
  lastUpdated: "31 Temmuz 2026",
  content: {
    tr: `1. VERİ SORUMLUSU
6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") ve ilgili mevzuat uyarınca, kişisel verileriniz Veri Sorumlusu sıfatıyla Birikim Yap tarafından işbu politikada belirtilen kapsamda işlenmektedir.

2. TOPLANAN KİŞİSEL VERİLER
Uygulama kapsamında aşağıdaki veri kategorileri toplanmakta ve işlenmektedir:
- Kimlik ve İletişim Verileri: Ad, soyad, e-posta adresi (Google veya Apple Sign-In aracılığıyla sağlanan bilgiler).
- Finansal Bütçe Verileri: Kullanıcının kendi rızasıyla girdiği gelir tutarları, sabit giderler, değişken harcama kayıtları, bütçe limitleri ve birikim hedefleri.
- Cihaz ve Teknik Veriler: Cihaz işletim sistemi, dil tercihi, para birimi seçimi ve uygulama ayarları.

3. VERİLERİN İŞLENME AMAÇLARI
Toplanan kişisel verileriniz;
- Kişisel bütçe takip ve finansal simülasyon hizmetlerinin sunulması,
- Oturum açma ve kimlik doğrulama süreçlerinin yürütülmesi,
- Cihaz içi ve bulut veri senkronizasyonunun sağlanması,
- Kullanıcı destek taleplerinin yanıtlanması amaçlarıyla işlenmektedir.

4. KİŞİSEL VERİ İŞLEMENİN HUKUKİ DAYANAKLARI
Verileriniz, KVKK'nın 5. maddesinde yer alan "Bir sözleşmenin kurulması veya ifasıyla doğrudan doğruya ilgili olması", "Veri sorumlusunun hukuki yükümlülüğünü yerine getirebilmesi" ve "Kullanıcının açık rızası" hukuki sebeplerine dayanılarak işlenmektedir.

5. ÜÇÜNCÜ TARAF ENTEGRASYONLARI VE ALTYAPI SAĞLAYICILARI
- Google Sign-In & Apple Sign-In: Güvenli kimlik doğrulama için kullanılan OAuth servisleridir.
- Supabase Altyapısı: Kullanıcı profili ve bütçe verilerinin şifrelenmiş olarak bulutta saklanmasını sağlayan veritabanı altyapısıdır.
- Yerel Depolama (AsyncStorage): Çevrimdışı kullanım ve hızlı veri erişimi için cihazınızda tutulan önbellek verileridir.

Kişisel veriler reklam amacıyla üçüncü kişilere satılmaz. Hizmetin sunulabilmesi için gerekli olduğu ölçüde kimlik doğrulama, bulut depolama ve teknik altyapı sağlayıcıları (örneğin Google, Apple ve Supabase) ile sınırlı olarak paylaşılabilir.

6. VERİ GÜVENLİĞİ VE SAKLAMA SÜRESİ
Kişisel verileriniz, yetkisiz erişimlere, kaybolmaya ve kötüye kullanıma karşı endüstri standardı güvenlik önlemleri (SSL/TLS şifreleme, Supabase RLS koruması) ile saklanmaktadır. Verileriniz, hesabınız aktif olduğu sürece veya yasal saklama yükümlülükleri süresince muhafaza edilir.

7. HESAP VE VERİ SİLME HAKKI
- Kullanıcı istediği zaman hesabını ve tüm verilerini silebilir.
- Hesap silme talebi, Uygulama içerisindeki Profil/Ayarlar menüsünden "Hesabı Sil" / "Verileri Sıfırla" seçeneğiyle anında veya destek@birikimyap.co e-posta adresi üzerinden yazılı taleple yapılabilir.
- Silme talebi tamamlandıktan sonra bulut verileri ve yedekler makul süre (en geç 30 gün) içerisinde tamamen ve geri döndürülemez şekilde kaldırılır.

8. KVKK KAPSAMINDA KULLANICININ HAKLARI
KVKK'nın 11. maddesi uyarınca veri sahibi olarak aşağıdaki haklara sahipsiniz:
- Kişisel verilerinizin işlenip işlenmediğini öğrenme ve bilgi talep etme,
- Eksik veya yanlış işlenmiş verilerin düzeltilmesini isteme,
- KVKK şartları çerçevesinde verilerinizin silinmesini veya yok edilmesini isteme,
- İşlenen verilerin kanuna aykırı olması halinde zararın giderilmesini talep etme,
- Otomatik sistemler vasıtasıyla aleyhinize çıkan sonuçlara itiraz etme.

9. POLİTİKA DEĞİŞİKLİKLERİ VE İLETİŞİM
İşbu Gizlilik Politikası zaman zaman güncellenebilir. Güncel metin Uygulama içerisinde yayınlandığı tarihte yürürlüğe girer. Tüm gizlilik talepleriniz ve sorularınız için destek@birikimyap.co adresinden bizimle iletişime geçebilirsiniz.

Son Güncelleme Tarihi: 31 Temmuz 2026`,
    en: `1. DATA CONTROLLER
In accordance with Personal Data Protection Laws (KVKK & GDPR), your personal data is processed by Birikim Yap as the Data Controller.

2. COLLECTED PERSONAL DATA
- Identity & Contact Data: Name, surname, email address (via Google/Apple Auth).
- Financial Budget Data: Incomes, fixed expenses, variable expenses, budget limits, and savings goals added by choice.
- Technical Data: Device OS, language preferences, currency selection, and app settings.

3. PURPOSES OF PROCESSING
Your data is processed to deliver budgeting services, handle authentication, maintain cloud synchronization, and provide customer support.

4. LEGAL GROUNDS FOR PROCESSING
Data processing relies on contractual necessity, legal compliance, and user explicit consent.

5. THIRD-PARTY INTEGRATIONS & PROVIDERS
- Google Sign-In & Apple Sign-In: Used for secure OAuth authentication.
- Supabase Infrastructure: Cloud database used for encrypted user data storage.
- Local Storage (AsyncStorage): Local caching for offline availability.

Personal data is not sold to third parties for advertising. Data may be shared only to the extent necessary to deliver services with authentication, cloud storage, and technical infrastructure providers (such as Google, Apple, and Supabase).

6. DATA SECURITY & RETENTION
Your data is secured with industry-standard encryption (SSL/TLS, RLS protection). Data is retained as long as your account remains active.

7. ACCOUNT & DATA DELETION RIGHTS
- Users may delete their account and data at any time via Profile Settings or by emailing support@birikimyap.co.

8. YOUR RIGHTS UNDER DATA PROTECTION LAWS
You have the right to request information, demand rectification or erasure, object to unlawful processing, and request data portability.

9. AMENDMENTS & CONTACT
This policy may be updated periodically. For privacy inquiries, contact support@birikimyap.co.

Last Updated: July 31, 2026`
  },
};
