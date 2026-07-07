export type DictionaryEntry = {
  keywords: string[];
  enKeywords: string[];
  categoryTr: string;
  categoryEn: string;
  subTr: string;
  subEn: string;
};

export const EXPENSE_DICTIONARY: DictionaryEntry[] = [
  // ==========================================
  // 1. MARKET (SUPERMARKET) - GIDA (FOOD)
  // ==========================================
  {
    keywords: [
      // Sebze & Meyve (Vegetables & Fruits)
      "domates", "biber", "patlıcan", "patlican", "salatalık", "salatalik", "hıyar", "hiyar", 
      "patates", "soğan", "sogan", "sarımsak", "sarimsak", "limon", "elma", "muz", "portakal", 
      "çilek", "cilek", "karpuz", "kavun", "üzüm", "uzum", "armut", "şeftali", "seftali", "erik", 
      "kayısı", "kayisi", "kiraz", "vişne", "visne", "ıspanak", "ispanak", "lahana", "pırasa", "pirasa",
      "marul", "maydanoz", "nane", "dereotu", "roka", "havuç", "havuc", "kabak", "bezelye", "fasulye", 
      "nohut", "mercimek", "pirinç", "pirinc", "bulgur", "makarna", "spagetti", "erişte", "eriste",
      "brokoli", "karnabahar", "enginar", "kereviz", "turp", "mandalina", "greyfurt", "incir",
      "nar", "avokado", "ananas", "hurma", "sebze", "meyve", "yeşillik", "yesillik",
      
      // Fırın & Unlu Mamüller (Bakery & Flour)
      "ekmek", "pide", "simit", "poğaça", "pogaca", "börek", "borek", "çörek", "corek", "gevrek",
      "galeta", "yufka", "lavaş", "lavas", "bazlama", "tost ekmeği", "tost ekmegi", "mısır ekmeği",
      "kadayıf", "kadayif", "güllaç", "gullac", "un", "irmik", "nişasta", "nisasta", "kabartma", "vanilya",

      // Et, Balık, Kümes Hayvanları (Meat, Fish, Poultry)
      "et", "kıyma", "kiyma", "bonfile", "antrikot", "tavuk", "but", "göğüs", "gogus", "kanat",
      "hindi", "balık", "balik", "somon", "levrek", "çipura", "cipura", "hamsi", "istavrit", 
      "mezgit", "sucuk", "sosis", "salam", "pastırma", "pastirma", "kavurma", "kuzu", "dana", 
      "kelle", "paça", "paca", "işkembe", "iskembe", "köfte", "kofte", "sakatat", "ciğer", "ciger",

      // Kahvaltılık & Süt Ürünleri (Dairy & Breakfast)
      "peynir", "kaşar", "kasar", "süt", "sut", "yoğurt", "yogurt", "tereyağı", "tereyag", 
      "kaymak", "zeytin", "yumurta", "reçel", "recel", "bal", "tahin", "pekmez", "helva",
      "fındık ezmesi", "findik ezmesi", "fıstık ezmesi", "fistik ezmesi", "margarin", "krema", 
      "süzme", "suzme", "lor", "tulum", "çökelek", "cokelek", "labne", "kaymak",

      // Temel Gıda & Konserve (Pantry & Canned)
      "yağ", "yag", "zeytinyağı", "zeytinyag", "ayçiçek", "aycicek", "tuz", "şeker", "seker",
      "salça", "salca", "ketçap", "ketcap", "mayonez", "hardal", "sos", "sirke", "turşu", "tursu",
      "konserve", "ton balığı", "ton baligi", "bezelye konservesi", "zeytin", "makarna sosu",

      // İçecekler (Beverages)
      "su", "soda", "maden suyu", "kola", "fanta", "sprite", "gazoz", "meyve suyu", "çay", "cay",
      "kahve", "nescafe", "filtre kahve", "enerji", "şalgam", "salgam", "ayran", "kefir", "limonata",
      "soğuk çay", "soguk cay", "ice tea", "meyve suyu", "sıkma", "sikma",

      // Atıştırmalıklar (Snacks) & Kahvaltılık Sürülebilirler
      "çikolata", "cikolata", "gofret", "cips", "bisküvi", "biskuvi", "kek", "kraker", "jelibon",
      "sakız", "sakiz", "kuruyemiş", "kuruyemis", "fındık", "findik", "fıstık", "fistik", "badem",
      "ceviz", "leblebi", "kaju", "kuru üzüm", "kuru incir", "kuru kayısı", "popcorn", "patlamış",
      "çekirdek", "cekirdek", "jelibon", "bonbon", "gofret", "nutella", "çokokrem", "cokokrem",
      "sana", "teremyağ", "teremyag"
    ],
    enKeywords: [
      "tomato", "pepper", "eggplant", "cucumber", "potato", "onion", "garlic", "lemon", "apple",
      "banana", "orange", "strawberry", "watermelon", "melon", "grape", "pear", "peach", "plum",
      "apricot", "cherry", "spinach", "cabbage", "leek", "lettuce", "parsley", "mint", "dill",
      "arugula", "carrot", "zucchini", "peas", "beans", "chickpeas", "lentils", "rice", "bulgur",
      "pasta", "spaghetti", "noodle", "broccoli", "cauliflower", "artichoke", "celery", "radish",
      "tangerine", "grapefruit", "fig", "pomegranate", "avocado", "pineapple", "date", "vegetables",
      "fruit", "greens", "bread", "pita", "bagel", "pastry", "pie", "flour", "starch", "yeast",
      "meat", "minced", "steak", "chicken", "poultry", "turkey", "fish", "salmon", "bass", "bream",
      "anchovy", "sardine", "sausage", "salami", "ham", "bacon", "lamb", "beef", "meatball",
      "cheese", "cheddar", "milk", "yogurt", "butter", "cream", "olive", "egg", "jam", "honey",
      "peanut", "hazelnut", "spread", "margarine", "oil", "salt", "sugar", "ketchup", "mayonnaise",
      "mustard", "sauce", "vinegar", "pickle", "canned", "tuna", "water", "soda", "coke", "cola",
      "beverage", "juice", "tea", "coffee", "ayran", "kefir", "lemonade", "energy drink",
      "chocolate", "wafer", "chips", "crisps", "biscuit", "cake", "cracker", "candy", "gum",
      "nuts", "peanut", "walnut", "almond", "cashew", "raisin", "popcorn", "seeds"
    ],
    categoryTr: "Market",
    categoryEn: "Supermarket",
    subTr: "Gıda",
    subEn: "Food"
  },

  // ==========================================
  // 2. MARKET (SUPERMARKET) - TEMİZLİK (CLEANING)
  // ==========================================
  {
    keywords: [
      "deterjan", "yumuşatıcı", "yumusatici", "çamaşır suyu", "camasir suyu", "bulaşık tableti",
      "bulasik tableti", "bulaşık deterjanı", "bulasik deterjani", "sabun", "katı sabun", "kati sabun",
      "sıvı sabun", "sivi sabun", "şampuan", "sampuan", "duş jeli", "dus jeli", "peçete", "pecete",
      "kağıt havlu", "kagit havlu", "tuvalet kağıdı", "tuvalet kagidi", "ıslak mendil", "islak mendil",
      "çöp poşeti", "cop poseti", "lavabo aç", "lavabo ac", "tuz ruhu", "kireç çözücü", "kirec cozucu",
      "yüzey temizleyici", "yuzey temizleyici", "cam sil", "camsil", "sünger", "sunger", 
      "bulaşık süngeri", "temizlik bezi", "çamaşır deterjanı", "camasir deterjani", "domestos",
      "prill", "pril", "fairy", "ariel", "alo", "omo", "omoda", "vileda", "mop", "fırça", "firca", "kova", "eldiven",
      "bulaşık teli", "çamaşır sodası", "leke çıkarıcı", "arap sabunu", "porçöz", "porcoz", "cif",
      "vernel", "yumoş", "yumos", "calgon"
    ],
    enKeywords: [
      "detergent", "softener", "bleach", "dishwasher tablet", "dish soap", "soap", "bar soap",
      "liquid soap", "shampoo", "shower gel", "napkin", "paper towel", "toilet paper", "wet wipes",
      "trash bag", "garbage bag", "sink opener", "drain cleaner", "lime scale remover",
      "surface cleaner", "glass cleaner", "sponge", "cleaning cloth", "mop", "brush", "bucket",
      "gloves", "dish scrubber", "stain remover"
    ],
    categoryTr: "Market",
    categoryEn: "Supermarket",
    subTr: "Temizlik ürünü",
    subEn: "Cleaning product"
  },

  // ==========================================
  // 3. MARKET (SUPERMARKET) - KİŞİSEL BAKIM (PERSONAL CARE)
  // ==========================================
  {
    keywords: [
      "diş macunu", "dis macunu", "diş fırçası", "dis fircasi", "deodorant", "parfüm", "parfum",
      "tıraş bıçağı", "tiras bicagi", "tıraş köpüğü", "tiras kopugu", "tıraş jeli", "ped", "orkid",
      "prezervatif", "kondom", "okey", "durex", "kolonya", "krem", "nemlendirici", "güneş kremi",
      "gunes kremi", "pamuk", "kulak çöpü", "kulak copu", "aseton", "oje", "ruj", "rimel", 
      "fondöten", "fondoten", "maskara", "allık", "far", "göz kalemi", "makyaj temizleme",
      "saç kremi", "sac kremi", "saç boyası", "sac boyasi", "jön", "jöle", "jole", "saç spreyi",
      "ağda", "agda", "cımbız", "cimbiz", "epilatör", "losyon", "el kremi", "vücut losyonu",
      "dudak nemlendirici", "lip balm", "gillette", "colgate", "ipana", "nivea", "selpak",
      "solo", "kotex", "prima", "jilet", "sensodyne"
    ],
    enKeywords: [
      "toothpaste", "toothbrush", "deodorant", "perfume", "fragrance", "razor", "shaving cream",
      "shaving gel", "pad", "sanitary napkin", "condom", "preservative", "cologne", "cream",
      "moisturizer", "sunscreen", "cotton pads", "ear swabs", "acetone", "nail polish",
      "lipstick", "mascara", "foundation", "blush", "eyeliner", "makeup remover", "conditioner",
      "hair dye", "hair gel", "hair spray", "wax", "tweezers", "lotion", "hand cream", "body lotion",
      "lip balm"
    ],
    categoryTr: "Market",
    categoryEn: "Supermarket",
    subTr: "Kişisel Bakım",
    subEn: "Personal Care"
  },

  // ==========================================
  // 4. SAĞLIK (HEALTH) - SAĞLIK & MEDİKAL (HEALTH & MEDICAL)
  // ==========================================
  {
    keywords: [
      "ilaç", "ilac", "şurup", "surup", "hap", "tablet", "aspirin", "parol", "ağrı kesici", 
      "agri kesici", "antibiyotik", "vitamin", "eczane", "bandaj", "yara bandı", "yara bandi", 
      "tentürdiyot", "tenturdiyot", "sargı bezi", "sargi bezi", "maske", "dezenfektan", 
      "termometre", "ateş ölçer", "ates olcer", "şırınga", "siringa", "doktor", "hastane", 
      "muayene", "klinik", "dişçi", "disci", "tahlil", "röntgen", "rontgen", "ameliyat", 
      "tedavi", "reçete", "recete", "lens", "gözlük", "gozluk", "optik", "solüsyon", "solusyon",
      "pastil", "öksürük", "oksuruk", "merhem", "pomad", "diyetisyen", "psikolog", "terapi",
      "aşı", "asi", "checkup", "check-up", "sağlık ocağı", "saglik ocagi", "eczacı"
    ],
    enKeywords: [
      "medicine", "pill", "tablet", "syrup", "capsule", "aspirin", "painkiller", "antibiotic",
      "vitamin", "pharmacy", "drugstore", "bandage", "band-aid", "bandage wrap", "mask",
      "disinfectant", "thermometer", "syringe", "doctor", "hospital", "clinic", "checkup",
      "dentist", "medical test", "x-ray", "surgery", "treatment", "prescription", "contact lens",
      "glasses", "optics", "lozenge", "cough", "ointment", "dietitian", "psychologist", "therapy",
      "vaccine"
    ],
    categoryTr: "Sağlık",
    categoryEn: "Health",
    subTr: "Sağlık / Medikal",
    subEn: "Health / Medical"
  },

  // ==========================================
  // 5. ULAŞIM (TRANSIT) - AKARYAKIT & BAKIM (FUEL & CAR)
  // ==========================================
  {
    keywords: [
      "benzin", "mazot", "dizel", "yakıt", "yakit", "lpg", "otogaz", "petrol", "opet", "shell", 
      "bp", "total", "petrol ofisi", "po", "lastik", "araç lastiği", "arac lastigi", "kış lastiği",
      "yaz lastiği", "lastik değişimi", "jant", "akü", "aku", "motor yağı", "motor yagi", "antifriz", 
      "silecek", "yıkama", "yikama", "oto yıkama", "oto yikama", "servis", "tamir", "usta", 
      "balata", "buji", "filtre", "bakım", "bakim", "muayene", "tüvtürk", "tuvturk", "oto parça", 
      "oto aksesuar", "cam suyu", "çekici", "cekici", "egzoz", "amortisör", "motor", "şanzıman"
    ],
    enKeywords: [
      "gas", "gasoline", "diesel", "fuel", "lpg", "fuel station", "tire", "car tire", "winter tire",
      "tire change", "wheel", "rim", "battery", "car battery", "engine oil", "antifreeze",
      "wiper", "car wash", "service", "car service", "repair", "mechanic", "brake pads",
      "spark plug", "filter", "car maintenance", "inspection", "car parts", "towing"
    ],
    categoryTr: "Ulaşım",
    categoryEn: "Transit",
    subTr: "Araç / Benzin",
    subEn: "Car / Fuel"
  },

  // ==========================================
  // 6. ULAŞIM (TRANSIT) - TAKSİ & TOPLU TAŞIMA (TRANSIT & CABS)
  // ==========================================
  {
    keywords: [
      "taksi", "uber", "metro", "otobüs", "otobus", "metrobüs", "metrobus", "tramvay", "marmaray", 
      "akbil", "istanbulkart", "kentkart", "akbil yükleme", "akbil yukleme", "dolmuş", "dolmus", 
      "minibüs", "minibus", "tren", "tcdd", "uçak", "ucak", "bilet", "havalimanı", "havalimani", 
      "otogar", "feribot", "ido", "budo", "havaş", "havas", "havabus", "martı", "marti", "binbin",
      "scooter", "teleferik", "vapur", "gemi", "bilet", "kart yükleme"
    ],
    enKeywords: [
      "taxi", "cab", "uber", "ride", "metro", "subway", "bus", "metrobus", "tram", "transit card",
      "bus ticket", "train", "flight", "plane", "airplane", "airport", "bus station", "ferry",
      "scooter", "cable car", "boat", "ticket top-up"
    ],
    categoryTr: "Ulaşım",
    categoryEn: "Transit",
    subTr: "Taksi / Toplu Taşıma",
    subEn: "Taxi / Transit"
  },

  // ==========================================
  // 7. YEMEK (DINING) - RESTORAN (RESTAURANT)
  // ==========================================
  {
    keywords: [
      "kebap", "pide", "lahmacun", "döner", "doner", "pizza", "burger", "hamburger", "sushi", 
      "makarna", "ızgara", "izgara", "köfte", "kofte", "tavuk döner", "tavuk doner", "iskender", 
      "çorba", "corba", "lokanta", "restoran", "restaurant", "yemek sepeti", "yemeksepeti", 
      "getir yemek", "getiryemek", "trendyol yemek", "kofteci", "durum", "dürüm", "tantuni", 
      "pizzacı", "pizzaci", "sushici", "makarna", "salata", "ramen", "tavukçu", "kanatçı", 
      "midye", "kokoreç", "kokorec", "tost", "kumru", "kumpir", "meyhane", "ızgara"
    ],
    enKeywords: [
      "kebab", "pizza", "burger", "hamburger", "sushi", "pasta", "grilled", "meatball", "soup",
      "diner", "restaurant", "food delivery", "takeout", "wrap", "salad", "ramen", "seafood",
      "mussels", "toast", "sandwich"
    ],
    categoryTr: "Yemek",
    categoryEn: "Dining",
    subTr: "Restoran",
    subEn: "Restaurant"
  },

  // ==========================================
  // 8. YEMEK (DINING) - KAFE / İÇECEK (CAFE / DRINKS)
  // ==========================================
  {
    keywords: [
      "kahve", "çay", "cay", "latte", "espresso", "cappuccino", "americano", "starbucks", 
      "kafe", "cafe", "tatlı", "tatli", "baklava", "waffle", "künefe", "kunefe", "pasta", 
      "dondurma", "kurabiye", "simit sarayı", "kahve dünyası", "kahvedunyası", "kahveci", 
      "makaron", "profiterol", "ekler", "sütlaç", "sutlac", "künefe", "trileçe", "trilece", 
      "cheesecake", "kek", "kruvasan", "limonata", "mocha", "macchiato", "frappe"
    ],
    enKeywords: [
      "coffee", "tea", "latte", "espresso", "cappuccino", "americano", "cafe", "coffeehouse",
      "dessert", "sweet", "baklava", "waffle", "cake", "ice cream", "cookie", "macaron",
      "pudding", "cheesecake", "croissant", "lemonade", "mocha", "macchiato", "frappe"
    ],
    categoryTr: "Yemek",
    categoryEn: "Dining",
    subTr: "Kafe / İçecek",
    subEn: "Cafe / Drinks"
  },

  // ==========================================
  // 9. GİYİM (CLOTHING) - GİYİM & MODA (CLOTHING & FASHION)
  // ==========================================
  {
    keywords: [
      "pantolon", "kot", "jeans", "tişört", "tisort", "gömlek", "gomlek", "ceket", "kaban", 
      "mont", "elbise", "etek", "hırka", "hirka", "kazak", "yelek", "çorap", "corap", 
      "iç çamaşırı", "ic camasiri", "boxer", "sütyen", "sutyen", "ayakkabı", "ayakkabi", 
      "spor ayakkabı", "sneaker", "bot", "çizme", "cizme", "terlik", "sandalet", "çanta", 
      "canta", "cüzdan", "cuzdan", "kemer", "şapka", "sapka", "atkı", "atki", "eldiven", 
      "gözlük", "gozluk", "saat", "takı", "taki", "yüzük", "yuzuk", "kolye", "küpe", 
      "kupe", "bileklik", "moda", "giyim", "zara", "koton", "lcw", "defacto", "hm", "h&m", 
      "nike", "adidas", "puma", "mavi", "boyner", "ipekyol", "vakko", "beymen", "pijama",
      "hırka", "bluz", "şort", "sort", "mayo", "bikini", "takım elbise", "takim elbise"
    ],
    enKeywords: [
      "pants", "trousers", "jeans", "tshirt", "shirt", "jacket", "coat", "dress", "skirt",
      "cardigan", "sweater", "vest", "socks", "underwear", "boxer", "bra", "shoes", "sneakers",
      "boots", "slippers", "sandals", "bag", "handbag", "purse", "wallet", "belt", "hat", "cap",
      "scarf", "gloves", "sunglasses", "watch", "jewelry", "ring", "necklace", "earrings",
      "bracelet", "fashion", "clothing", "pajamas", "blouse", "shorts", "swimwear", "suit"
    ],
    categoryTr: "Giyim",
    categoryEn: "Clothing",
    subTr: "Giyim / Moda",
    subEn: "Giyim / Moda"
  },

  // ==========================================
  // 10. EĞLENCE (ENTERTAINMENT) - EĞLENCE & SOSYAL (LEISURE & SOCIAL)
  // ==========================================
  {
    keywords: [
      "sinema", "film", "tiyatro", "konser", "festival", "etkinlik", "biletix", "passo", 
      "müze", "muze", "sergi", "oyun", "steam", "playstation", "psn", "xbox", "pubg", "netflix", 
      "spotify", "youtube premium", "youtube", "disney", "exxen", "prime video", "amazon prime", 
      "üyelik", "uyelik", "abonelik", "havuz", "plaj", "otel", "tatil", "rezervasyon", "booking", 
      "airbnb", "pub", "bar", "club", "gece kulübü", "gece kulubu", "alkol", "bira", "şarap", 
      "sarap", "rakı", "raki", "viski", "kokteyl", "lunapark", "tiyatro", "sergi", "konser",
      "kahvehane", "nargile", "bowling", "bilardo"
    ],
    enKeywords: [
      "cinema", "movie", "theater", "concert", "festival", "event", "museum", "exhibition",
      "game", "steam", "playstation", "psn", "xbox", "pubg", "netflix", "spotify", "subscription",
      "membership", "pool", "beach", "hotel", "vacation", "booking", "airbnb", "pub", "bar",
      "club", "nightclub", "alcohol", "beer", "wine", "raki", "whiskey", "cocktail", "amusement park",
      "billiards"
    ],
    categoryTr: "Eğlence",
    categoryEn: "Entertainment",
    subTr: "Eğlence / Sosyal",
    subEn: "Entertainment / Social"
  },

  // ==========================================
  // 11. MARKET (SUPERMARKET) - GENEL (GENERAL SHOPPING)
  // ==========================================
  {
    keywords: [
      "market", "alışveriş", "alisveris", "bakkal", "süpermarket", "supermarket", "migros", 
      "bim", "a101", "şok", "sok", "carrefour", "macrocenter", "file market", "şarküteri", 
      "sarkuteri", "manav", "kasap", "pazar", "halk pazarı", "hipermarket", "tekel"
    ],
    enKeywords: [
      "market", "shopping", "grocery", "supermarket", "grocery store", "grocer", "butcher",
      "bazaar", "convenience store", "mart"
    ],
    categoryTr: "Market",
    categoryEn: "Supermarket",
    subTr: "Genel",
    subEn: "General"
  }
];
