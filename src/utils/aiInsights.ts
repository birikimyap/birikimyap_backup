export type FinancialInsight = {
  title: string;
  badge: string;
  body: string;
  tips: string[];
  actionLabel?: string;
};

export function getSmartFinancialInsight(
  category: string,
  totalSpent: number,
  remainingBudget: number,
  language: "tr" | "en"
): FinancialInsight {
  const normCat = category.toLowerCase().trim();

  // Market / Supermarket
  if (normCat.includes("market") || normCat.includes("süpermarket") || normCat.includes("supermarket")) {
    return {
      badge: language === "tr" ? "Yapay Zeka Tasarruf Analizi" : "AI Savings Analysis",
      title: language === "tr" ? "Mutfak Bütçesini Optimize Edin" : "Optimize Your Grocery Budget",
      body: language === "tr" 
        ? `Bu dönem market harcamalarınız öne çıktı. Market alışverişleri genellikle kontrolü en kolay esnek harcama kalemlerinden biridir.`
        : `Grocery shopping stood out this period. Groceries are typically one of the easiest flexible categories to balance.`,
      tips: language === "tr" 
        ? [
            "Aç karnına market alışverişine çıkmamaya özen gösterin.",
            "Alışveriş öncesi mutlaka haftalık yemek planı ve net bir liste yapın.",
            "Marketlerin kendi markalı (private label) kaliteli ürünlerini tercih edin."
          ]
        : [
            "Avoid grocery shopping on an empty stomach to reduce impulse buys.",
            "Always create a weekly meal plan and stick to a strict shopping list.",
            "Try high-quality store-brand products for budget-friendly alternatives."
          ],
      actionLabel: language === "tr" ? "Alışveriş Taktikleri" : "Shopping Tactics"
    };
  }

  // Yemek / Dining Out
  if (normCat.includes("yemek") || normCat.includes("restoran") || normCat.includes("dining") || normCat.includes("kafe") || normCat.includes("cafe")) {
    return {
      badge: language === "tr" ? "Restoran ve Sosyal Yaşam" : "Restaurant & Social Spend",
      title: language === "tr" ? "Dışarıda Yemek Harcamaları" : "Dining Out & Takeout Audit",
      body: language === "tr"
        ? `Hazır yemek ve restoran harcamalarınız üst sınırlara yaklaşıyor. Dışarıdan yemek yerine evde yemek hazırlamak bütçenizi rahatlatacaktır.`
        : `Prepared meals and dining expenses are approaching upper limits. Cooking at home is one of the fastest ways to boost disposable income.`,
      tips: language === "tr"
        ? [
            "Hafta sonu toplu yemek hazırlığı (meal prep) yapıp dolaba porsiyonlayın.",
            "İşe veya okula giderken kendi hazırladığınız sandviç veya termosta kahveyi yanınıza alın.",
            "Dışarıda yemek yemeyi özel kutlamalarla sınırlandırıp haftalık kota koyun."
          ]
        : [
            "Try weekly batch-cooking (meal prep) and freeze portions for busy days.",
            "Bring your own lunchbox and a thermos of home-brewed coffee to work.",
            "Treat dining out as a weekend celebration rather than a daily routine."
          ],
      actionLabel: language === "tr" ? "Evde Yemek Tarifleri" : "Home Meal Prep Guide"
    };
  }

  // Ulaşım / Transit / Fuel
  if (normCat.includes("ulaşım") || normCat.includes("ulasim") || normCat.includes("transit") || normCat.includes("benzin") || normCat.includes("yakıt")) {
    return {
      badge: language === "tr" ? "Mobilite & Enerji Tasarrufu" : "Mobility & Energy Savings",
      title: language === "tr" ? "Yol ve Ulaşım Maliyetleri" : "Transportation Cost Optimization",
      body: language === "tr"
        ? `Ulaşım ve yakıt harcamalarınız artış gösterdi. Araç kullanım sıklığını veya taksi alternatiflerini gözden geçirmek tasarruf ettirebilir.`
        : `Travel and fuel expenditures have increased. Reviewing car usage patterns and high-cost cab services can save substantial money.`,
      tips: language === "tr"
        ? [
            "2 kilometrenin altındaki kısa mesafelerde yürümeyi veya bisiklete binmeyi alışkanlık edinin.",
            "Taksi yolculukları yerine raylı sistem veya ekspres toplu taşımayı tercih edin.",
            "İşe gidiş-geliş saatlerinde iş arkadaşlarınızla araç paylaşımı (carpooling) yapın."
          ]
        : [
            "Walk or cycle for short trips under 2 kilometers to save fuel and stay fit.",
            "Choose rapid metro or train systems over expensive ride-hailing options.",
            "Explore carpooling with colleagues for daily office commutes."
          ],
      actionLabel: language === "tr" ? "Rota Alternatifleri" : "Route Options"
    };
  }

  // Giyim / Clothing
  if (normCat.includes("giyim") || normCat.includes("clothing") || normCat.includes("moda") || normCat.includes("kıyafet")) {
    return {
      badge: language === "tr" ? "Bilinçli Tüketici Analizi" : "Smart Consumer Analysis",
      title: language === "tr" ? "Gardırop Harcamalarını Sınırla" : "Streamline Wardrobe Spending",
      body: language === "tr"
        ? `Giyim ve aksesuar alışverişlerinde bu dönem artış var. Hızlı moda döngülerinden kaçınmak bütçenizi korur.`
        : `Clothing and fashion shopping has spiked this period. Steering clear of fast-fashion impulse buys keeps your wallet safe.`,
      tips: language === "tr"
        ? [
            "48 Saat Kuralı: Bir giysiyi beğendiğinizde almadan önce 48 saat bekleyin, istek geçici olabilir.",
            "Kapsül Gardırop: Az sayıda, birbiriyle kolay kombinlenebilen zamansız parçalara yatırım yapın.",
            "Dolabınızdaki mevcut giysileri gözden geçirin; muhtemelen benzeri zaten var."
          ]
        : [
            "Apply the 48-Hour Rule: Wait two days before clicking buy to ensure it's a need.",
            "Invest in a capsule wardrobe consisting of high-quality, mix-and-match basics.",
            "Audit your closet before shopping—you might already have a near-identical piece."
          ],
      actionLabel: language === "tr" ? "Kapsül Gardırop Rehberi" : "Capsule Wardrobe Rules"
    };
  }

  // Eğlence / Entertainment
  if (normCat.includes("eğlence") || normCat.includes("eglence") || normCat.includes("entertainment") || normCat.includes("sosyal") || normCat.includes("abonelik")) {
    return {
      badge: language === "tr" ? "Sosyal Bütçe Yönetimi" : "Leisure Budget Check",
      title: language === "tr" ? "Abonelik ve Sosyal Aktivite Auditi" : "Audit Subscriptions & Leisure Spends",
      body: language === "tr"
        ? `Abonelikler ve eğlence harcamaları bütçenizde geniş yer kaplıyor. Kullanmadığınız platformları temizlemek pratik bir kazançtır.`
        : `Entertainment and digital subscriptions are taking up a notable share of your funds. Auditing inactive memberships is a quick win.`,
      tips: language === "tr"
        ? [
            "Son 30 günde hiç izlemediğiniz dijital yayın platformu (Netflix, Disney vb.) aboneliklerini askıya alın.",
            "Şehirdeki ücretsiz konserleri, açık hava sergilerini ve belediye etkinliklerini takip edin.",
            "Dışarıda pahalı barlara gitmek yerine arkadaşlarınızla masa oyunu geceleri organize edin."
          ]
        : [
            "Cancel or pause streaming subscriptions you haven't opened in the last 30 days.",
            "Keep an eye out for free local outdoor concerts, gallery openings, and community events.",
            "Swap expensive bars for home board-game nights or park picnics with friends."
          ],
      actionLabel: language === "tr" ? "Abonelikleri Yönet" : "Audit Subscriptions"
    };
  }

  // Sağlık / Health
  if (normCat.includes("sağlık") || normCat.includes("saglik") || normCat.includes("health") || normCat.includes("medikal")) {
    return {
      badge: language === "tr" ? "Sağlık ve Refah Yatırımı" : "Health & Wellbeing Care",
      title: language === "tr" ? "Sağlık Harcamaları & Sigorta" : "Navigate Medical Expenditures",
      body: language === "tr"
        ? `Sağlık harcamalarınızda artış var. Sağlık en birincil ihtiyaçtır; önleyici bakım uzun vadede maliyeti düşürür.`
        : `Health-related spends have risen. Wellness is your highest asset; proactive checkups protect both your health and future finances.`,
      tips: language === "tr"
        ? [
            "Yıllık diş hekimi kontrollerinizi ve genel taramaları aksatmayın; erken teşhis bütçe korur.",
            "Tamamlayıcı sağlık sigortanızın teminat limitlerini düzenli inceleyin.",
            "Reçeteli ilaçlarda varsa muadil (generic) seçenekleri eczacınıza sorun."
          ]
        : [
            "Keep up with regular dental cleanings and health checkups to prevent high future costs.",
            "Review your supplemental health insurance policy to maximize in-network benefits.",
            "Always ask your doctor or pharmacist if generic alternatives are available for prescriptions."
          ],
      actionLabel: language === "tr" ? "Sigorta Detayları" : "Insurance Coverage"
    };
  }

  // Fallback / Other
  const isOverBudget = remainingBudget < 0;
  return {
    badge: language === "tr" ? "Akıllı Bütçe Asistanı" : "AI Smart Budget Guide",
    title: isOverBudget 
      ? (language === "tr" ? "Bütçe Limitlerinizi Aştınız" : "Budget Limit Exceeded")
      : (language === "tr" ? "Küçük Harcamaları İzleyin" : "Audit Small Spending Leaks"),
    body: isOverBudget
      ? (language === "tr" 
          ? `Bu dönem bütçeniz eksiye geçti. Endişelenmeyin, kalan günlerde harcamalarınızı yavaşlatarak planı dengeleyebilirsiniz.`
          : `You have crossed your spendable limit for this period. Slow down discretionary spending to bring your plan back on track.`)
      : (language === "tr"
          ? `Harcamalarınız şu an dengeli seyrediyor. 'Latte Faktörü' gibi fark edilmeyen günlük ufak harcamaların toplamına dikkat edin.`
          : `Your spending is currently within target bounds. Keep an eye on minor recurring leaks that add up quietly by month-end.`),
    tips: language === "tr"
      ? [
          "50/30/20 kuralını uygulayın: %50 ihtiyaçlar, %30 istekler, %20 tasarruf.",
          "Harcama yaptığınız anda sesli asistanı kullanarak fişleri anında kaydedin.",
          "Her günün sonunda kalan bütçeyi inceleyip yarının harcama limitini planlayın."
        ]
      : [
          "Adopt the 50/30/20 model: 50% essentials, 30% wants, and 20% savings.",
          "Get into the habit of logging expenses instantly with the voice assistant.",
          "Review your remaining balance each evening to mentally adjust tomorrow's choices."
        ],
    actionLabel: language === "tr" ? "Bütçe Kuralları" : "Budgeting Rules"
  };
}
