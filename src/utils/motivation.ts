export interface MotivationQuote {
  id: string;
  quoteTr: string;
  quoteEn: string;
  author: string;
}

export const DAILY_MOTIVATION_QUOTES: MotivationQuote[] = [
  {
    id: "m1",
    quoteTr: "Küçük damlalar büyük denizleri oluşturur. Bugün biriktirdiğin her kuruş yarının özgürlüğüdür.",
    quoteEn: "Small drops form great oceans. Every penny you save today is tomorrow's freedom.",
    author: "Birikim Yap Koçu"
  },
  {
    id: "m2",
    quoteTr: "Finansal disiplin bir varış noktası değil, her gün yapılan akıllı seçimlerin toplamıdır.",
    quoteEn: "Financial discipline is not a destination, but the sum of smart daily choices.",
    author: "Warren Buffett"
  },
  {
    id: "m3",
    quoteTr: "Gereksiz harcamalardan kaçınmak, yeni bir gelir kapısı açmak kadar değerlidir.",
    quoteEn: "Avoiding unnecessary expenses is as valuable as discovering a new income source.",
    author: "Birikim Yap Koçu"
  },
  {
    id: "m4",
    quoteTr: "En büyük birikim hedefleri, en küçük günlük adımlarla başlar.",
    quoteEn: "The biggest savings goals begin with the smallest daily steps.",
    author: "Birikim Yap Koçu"
  },
  {
    id: "m5",
    quoteTr: "Bütçene sadık kaldığın her gün, gelecekteki hayallerine bir adım daha yaklaşırsın.",
    quoteEn: "Every day you stick to your budget, you get one step closer to your dreams.",
    author: "Birikim Yap Koçu"
  }
];

export function getDailyMotivationQuote(dayOffset: number = 0): MotivationQuote {
  const index = Math.abs(dayOffset + new Date().getDate()) % DAILY_MOTIVATION_QUOTES.length;
  return DAILY_MOTIVATION_QUOTES[index];
}
