import { useFinanceStore } from "@/store/financeStore";
import { parseAmount } from "@/utils/currency";

export type ParsedVoiceExpense = {
  amount: number;
  category: string;
  subcategory: string;
  label: string;
  note: string;
};

// Word mapping configuration for intelligent TR/EN categorization
const CATEGORY_MAP = [
  // Market - Gıda / Food
  {
    keywords: [
      "makarna", "ekmek", "peynir", "süt", "yoğurt", "sut", "yogurt", "et", "tavuk", "su", 
      "kola", "meyve", "sebze", "yumurta", "çikolata", "cikolata", "cips", "bisküvi", "biskuvi",
      "yağ", "yag", "şeker", "seker", "tuz", "un", "balık", "balik", "domates", "patates",
      "soğan", "sogan", "elma", "muz", "gıda", "gida", "soda", "kola", "fanta", "bira", "alkol"
    ],
    enKeywords: [
      "pasta", "bread", "cheese", "milk", "yogurt", "meat", "chicken", "water", "cola", 
      "fruit", "vegetables", "egg", "chocolate", "chips", "biscuit", "oil", "sugar", "salt", 
      "flour", "fish", "tomato", "potato", "onion", "apple", "banana", "food", "soda", "beer", "alcohol"
    ],
    categoryTr: "Market",
    categoryEn: "Supermarket",
    subTr: "Gıda",
    subEn: "Food"
  },
  // Market - Temizlik / Cleaning
  {
    keywords: [
      "deterjan", "sabun", "şampuan", "sampuan", "peçete", "pecete", "havlu", "çamaşır", "camasir",
      "bulaşık", "bulasik", "tablet", "temizlik", "diş", "dis", "macun", "fırça", "firca"
    ],
    enKeywords: [
      "detergent", "soap", "shampoo", "napkin", "towel", "laundry", "dishwasher", "tablet", 
      "cleaning", "toothpaste", "toothbrush"
    ],
    categoryTr: "Market",
    categoryEn: "Supermarket",
    subTr: "Temizlik ürünü",
    subEn: "Cleaning product"
  },
  // Market - Kişisel Bakım / Personal Care
  {
    keywords: ["parfüm", "parfum", "deodorant", "krem", "makyaj", "bakım", "bakim", "ped", "tıraş", "tiras"],
    enKeywords: ["perfume", "deodorant", "cream", "makeup", "care", "pad", "shave"],
    categoryTr: "Market",
    categoryEn: "Supermarket",
    subTr: "Kişisel Bakım",
    subEn: "Personal Care"
  },
  // Market - Genel / General
  {
    keywords: ["market", "alışveriş", "alisveris", "bakkal", "süpermarket", "supermarket", "migros", "bim", "a101", "şok", "sok", "carrefour"],
    enKeywords: ["market", "shopping", "grocery", "supermarket", "store"],
    categoryTr: "Market",
    categoryEn: "Supermarket",
    subTr: "Genel",
    subEn: "General"
  },
  // Yemek - Kafe / İçecek / Cafe & Drinks
  {
    keywords: ["kahve", "latte", "espresso", "starbucks", "kafe", "cafe", "tatlı", "tatli", "pasta", "dondurma", "çay", "cay"],
    enKeywords: ["coffee", "latte", "espresso", "starbucks", "cafe", "dessert", "cake", "icecream", "tea"],
    categoryTr: "Yemek",
    categoryEn: "Dining",
    subTr: "Kafe / İçecek",
    subEn: "Cafe / Drinks"
  },
  // Yemek - Restoran / Restaurant
  {
    keywords: ["kebap", "pide", "lahmacun", "döner", "doner", "pizza", "burger", "hamburger", "sushi", "lokanta", "restoran", "yemek"],
    enKeywords: ["kebab", "pizza", "burger", "hamburger", "sushi", "diner", "restaurant", "meal", "food"],
    categoryTr: "Yemek",
    categoryEn: "Dining",
    subTr: "Restoran",
    subEn: "Restaurant"
  },
  // Ulaşım - Taksi / Toplu Taşıma / Transit
  {
    keywords: ["taksi", "uber", "metro", "otobüs", "otobus", "metrobüs", "metrobus", "marmaray", "bilet", "akbil", "kentkart", "dolmuş", "dolmus", "minibüs", "minibus"],
    enKeywords: ["taxi", "cab", "uber", "metro", "bus", "transit", "ticket", "card", "minibus"],
    categoryTr: "Ulaşım",
    categoryEn: "Transit",
    subTr: "Taksi / Toplu Taşıma",
    subEn: "Taxi / Transit"
  },
  // Ulaşım - Araç / Benzin / Car & Fuel
  {
    keywords: ["benzin", "yakıt", "yakit", "mazot", "dizel", "otopark", "otoban", "hgs", "köprü", "kopru", "yıkama", "yikama", "servis", "tamir", "lastik"],
    enKeywords: ["fuel", "gas", "diesel", "parking", "highway", "toll", "bridge", "wash", "service", "repair", "tire"],
    categoryTr: "Ulaşım",
    categoryEn: "Transit",
    subTr: "Araç / Benzin",
    subEn: "Car / Fuel"
  },
  // Giyim / Clothing
  {
    keywords: ["kıyafet", "kiyafet", "tişört", "tisort", "pantolon", "ceket", "gömlek", "gomlek", "elbise", "ayakkabı", "ayakkabi", "mont", "kaban", "çorap", "corap", "çanta", "canta", "giyim", "moda", "zara", "koton", "trendyol"],
    enKeywords: ["clothes", "clothing", "tshirt", "pants", "jeans", "jacket", "shirt", "dress", "shoes", "coat", "socks", "bag", "apparel", "fashion"],
    categoryTr: "Giyim",
    categoryEn: "Clothing",
    subTr: "Giyim / Moda",
    subEn: "Giyim / Moda"
  },
  // Eğlence / Entertainment
  {
    keywords: ["sinema", "film", "tiyatro", "konser", "etkinlik", "müze", "muze", "netflix", "spotify", "abonelik", "üyelik", "uyelik"],
    enKeywords: ["cinema", "movie", "theater", "concert", "event", "museum", "netflix", "spotify", "subscription", "membership"],
    categoryTr: "Eğlence",
    categoryEn: "Entertainment",
    subTr: "Eğlence / Sosyal",
    subEn: "Entertainment / Social"
  },
  // Sağlık / Health
  {
    keywords: ["ilaç", "ilac", "eczane", "vitamin", "doktor", "hastane", "muayene", "klinik", "dişçi", "disci", "sağlık", "saglik"],
    enKeywords: ["medicine", "pill", "pharmacy", "vitamin", "doctor", "hospital", "clinic", "dentist", "health"],
    categoryTr: "Sağlık",
    categoryEn: "Health",
    subTr: "Sağlık / Medikal",
    subEn: "Health / Medical"
  }
];

export function parseTurkishExpense(text: string): ParsedVoiceExpense {
  const language = useFinanceStore.getState().language;
  const normalized = text.toLowerCase().trim();
  const amount = parseAmount(normalized);

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

  for (const item of CATEGORY_MAP) {
    const listToCheck = language === "tr" ? item.keywords : item.enKeywords;
    
    // Check if any word in descriptive text matches keywords
    const hasMatch = descriptiveWords.some(word => 
      listToCheck.some(kw => word.includes(kw) || kw.includes(word))
    );

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

function toTitleCase(value: string) {
  return `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`;
}
