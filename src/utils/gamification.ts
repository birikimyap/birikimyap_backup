export interface UserLevelInfo {
  level: number;
  titleTr: string;
  titleEn: string;
  currentXp: number;
  nextLevelXp: number;
  progressRatio: number;
}

export interface QuestItem {
  id: string;
  titleTr: string;
  titleEn: string;
  xpReward: number;
  isCompleted: boolean;
  type: "daily" | "weekly";
}

export function getUserLevelInfo(xpPoints: number = 100): UserLevelInfo {
  const levels = [
    { level: 1, titleTr: "Çaylak Birikimci", titleEn: "Rookie Saver", xpNeeded: 0 },
    { level: 2, titleTr: "Tasarruf Çırağı", titleEn: "Savings Apprentice", xpNeeded: 200 },
    { level: 3, titleTr: "Bütçe Uzmanı", titleEn: "Budget Master", xpNeeded: 500 },
    { level: 4, titleTr: "Altın Kasa Şampiyonu", titleEn: "Vault Champion", xpNeeded: 1000 },
    { level: 5, titleTr: "Finans Gurusu", titleEn: "Financial Guru", xpNeeded: 2000 }
  ];

  let currentLevel = levels[0];
  let nextLevel = levels[1];

  for (let i = levels.length - 1; i >= 0; i--) {
    if (xpPoints >= levels[i].xpNeeded) {
      currentLevel = levels[i];
      nextLevel = levels[i + 1] || levels[i];
      break;
    }
  }

  const xpInCurrentLevel = xpPoints - currentLevel.xpNeeded;
  const levelRange = Math.max(nextLevel.xpNeeded - currentLevel.xpNeeded, 1);
  const progressRatio = Math.min(Math.max(xpInCurrentLevel / levelRange, 0), 1.0);

  return {
    level: currentLevel.level,
    titleTr: currentLevel.titleTr,
    titleEn: currentLevel.titleEn,
    currentXp: xpPoints,
    nextLevelXp: nextLevel.xpNeeded,
    progressRatio
  };
}

export function getSystemQuests(
  expenseCountToday: number,
  streakCount: number,
  isGoalActive: boolean
): QuestItem[] {
  return [
    {
      id: "q_daily_log",
      titleTr: "Günün ilk harcamasını veya kaydını gir",
      titleEn: "Log your first expense or zero-spend of the day",
      xpReward: 30,
      isCompleted: expenseCountToday > 0,
      type: "daily"
    },
    {
      id: "q_streak_3",
      titleTr: "3 gün üst üste seri yakala",
      titleEn: "Maintain a 3-day active streak",
      xpReward: 50,
      isCompleted: streakCount >= 3,
      type: "daily"
    },
    {
      id: "q_active_goal",
      titleTr: "Birikim hedefine katkıda bulun",
      titleEn: "Add savings contribution to your goal",
      xpReward: 100,
      isCompleted: isGoalActive,
      type: "weekly"
    }
  ];
}
