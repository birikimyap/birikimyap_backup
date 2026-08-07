import { Feather } from "@expo/vector-icons";

export interface BadgeItem {
  id: string;
  titleTr: string;
  titleEn: string;
  descTr: string;
  descEn: string;
  icon: keyof typeof Feather.glyphMap;
  color: string;
  xpReward: number;
}

export const SYSTEM_BADGES: BadgeItem[] = [
  {
    id: "first_expense",
    titleTr: "İlk Adım",
    titleEn: "First Step",
    descTr: "İlk harcama kaydınızı başarıyla eklediniz.",
    descEn: "Logged your very first expense.",
    icon: "zap",
    color: "#00E58F",
    xpReward: 50
  },
  {
    id: "streak_7",
    titleTr: "Haftalık Disiplin",
    titleEn: "7-Day Streak",
    descTr: "Tam 7 gün kesintisiz bütçe takibi yaptınız.",
    descEn: "Completed a 7-day active spending tracking streak.",
    icon: "trending-up",
    color: "#F59E0B",
    xpReward: 150
  },
  {
    id: "streak_30",
    titleTr: "Efsanevi Seri",
    titleEn: "30-Day Master",
    descTr: "30 gün boyunca bütçenizi disiplinle yönettiniz.",
    descEn: "Maintained a 30-day streak of disciplined budgeting.",
    icon: "award",
    color: "#8B5CF6",
    xpReward: 500
  },
  {
    id: "savings_10k",
    titleTr: "Altın Kasa",
    titleEn: "Gold Vault",
    descTr: "Toplam ₺10.000 birikim barajını aştınız.",
    descEn: "Reached a total milestone of ₺10,000 saved.",
    icon: "shield",
    color: "#10B981",
    xpReward: 300
  },
  {
    id: "goal_completed",
    titleTr: "Hayal Gerçek Oldu",
    titleEn: "Dream Achieved",
    descTr: "Birikim hedeflerinizden birini %100 tamamladınız.",
    descEn: "Successfully completed one of your savings goals.",
    icon: "star",
    color: "#EC4899",
    xpReward: 400
  },
  {
    id: "zero_spend_day",
    titleTr: "Sıfır Harcama Şampiyonu",
    titleEn: "Zero Spend Champ",
    descTr: "Günü hiç gereksiz harcama yapmadan tamamladınız.",
    descEn: "Closed a day with zero unnecessary expenses.",
    icon: "check-circle",
    color: "#3B82F6",
    xpReward: 100
  }
];
