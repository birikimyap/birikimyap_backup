import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, radius, spacing } from "@/theme";
import { useFinanceStore } from "@/store/financeStore";
import { translations } from "@/utils/translations";

type FeatureItem = {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Feather.glyphMap;
  highlighted?: boolean;
};

const mascotTR = require("../../pgn/mascot-cutout.png");
const mascotEN = require("../../pgn/mascot-cutout-dollar.png");

// Static configuration removed to support dynamic translations

export default function IntroFeatureScreen() {
  const language = useFinanceStore((state) => state.language);
  const mascot = language === "tr" ? mascotTR : mascotEN;
  const t = (key: keyof typeof translations["tr"]) => translations[language][key] || key;

  const features: FeatureItem[] = [
    {
      id: "income-expense",
      title: language === "tr" ? "Gelir ve Giderlerini Ekle" : "Add Income & Expenses",
      description: language === "tr" ? "Aylık gelir ve sabit ödemelerini girerek limitini belirle." : "Determine your limit by entering monthly incomes and fixed payments.",
      icon: "credit-card"
    },
    {
      id: "savings-goal",
      title: language === "tr" ? "Birikim Hedefini Belirle" : "Set Your Savings Goal",
      description: language === "tr" ? "Kendine bir birikim oranı seç ve ilerlemeni anlık gör." : "Choose a savings rate for yourself and see your progress in real-time.",
      icon: "target"
    },
    {
      id: "voice-expense",
      title: language === "tr" ? "Sesli Harcama Ekle" : "Add Voice Expense",
      description: language === "tr" 
        ? "Örneğin: ‘120 lira kahve harcadım’ dediğinde yapay zeka harcamanı otomatik kaydeder." 
        : "For example: When you say 'spent 120 dollars on coffee', AI automatically records it.",
      icon: "mic",
      highlighted: true
    }
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
        <View style={styles.hero}>
          <View style={styles.mascotStage}>
            <View style={styles.softOval} />
            <Text style={[styles.sparkle, styles.sparkleLeft]}>✦</Text>
            <Text style={[styles.sparkle, styles.sparkleRight]}>✦</Text>
            <Image source={mascot} style={styles.mascot} resizeMode="contain" />
          </View>

          <Text style={styles.heading}>
            {language === "tr" ? "Paranı yönetmek artık daha kolay" : "Managing money is now easier"}
          </Text>
          <Text style={styles.subtitle}>
            {language === "tr" 
              ? "Gelirini, giderini ve birikim hedefini gir; sana özel harcama limitini oluşturalım." 
              : "Enter your income, expense and savings goal; let us create your personalized budget limits."}
          </Text>
        </View>

        <View style={styles.features}>
          {features.map((feature) => (
            <FeatureCard key={feature.id} feature={feature} />
          ))}
        </View>

        <Pressable
          onPress={() => router.push("/income")}
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
        >
          <View style={styles.ctaSpacer} />
          <Text style={styles.ctaText}>{language === "tr" ? "Başlayalım" : "Let's Start"}</Text>
          <Feather name="arrow-right" size={24} color={colors.white} style={styles.ctaIcon} />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function FeatureCard({ feature }: { feature: FeatureItem }) {
  const language = useFinanceStore((state) => state.language);
  
  return (
    <View style={[styles.featureRow, feature.highlighted && styles.featureRowHighlighted]}>
      <View style={[styles.iconBox, feature.highlighted && styles.iconBoxHighlighted]}>
        <Feather name={feature.icon} size={22} color={feature.highlighted ? colors.primary : colors.primaryMuted} />
      </View>
      <View style={styles.featureCopy}>
        <View style={styles.titleRow}>
          <Text style={styles.featureTitle}>{feature.title}</Text>
          {feature.highlighted ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{language === "tr" ? "YENİ" : "NEW"}</Text>
            </View>
          ) : null}
        </View>
        <Text style={[styles.featureDesc, feature.highlighted && styles.exampleText]}>
          {feature.description}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background
  },
  content: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24
  },
  hero: {
    width: "100%",
    alignItems: "center",
    marginBottom: 20
  },
  mascotStage: {
    width: 240,
    height: 180,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12
  },
  softOval: {
    position: "absolute",
    bottom: 4,
    width: 190,
    height: 80,
    borderRadius: 100,
    backgroundColor: "rgba(13, 50, 40, 0.08)"
  },
  mascot: {
    width: 170,
    height: 170
  },
  sparkle: {
    position: "absolute",
    color: colors.primaryMuted,
    fontSize: 22,
    fontWeight: "800"
  },
  sparkleLeft: {
    left: 20,
    top: 40
  },
  sparkleRight: {
    right: 24,
    bottom: 30,
    fontSize: 18
  },
  heading: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "800",
    color: colors.primary,
    textAlign: "center",
    paddingHorizontal: 12
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "600",
    color: colors.textMuted,
    textAlign: "center",
    paddingHorizontal: 16
  },
  features: {
    width: "100%",
    gap: 0,
    marginBottom: 16
  },
  featureRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(13, 50, 40, 0.04)",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 1,
    marginBottom: 12
  },
  featureRowHighlighted: {
    borderColor: colors.primarySoft,
    backgroundColor: colors.primarySoft,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 3
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14
  },
  iconBoxHighlighted: {
    backgroundColor: colors.white,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2
  },
  featureCopy: {
    flex: 1
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap"
  },
  badge: {
    borderRadius: 8,
    backgroundColor: colors.accent,
    paddingHorizontal: 6,
    paddingVertical: 2
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "900",
    color: colors.white
  },
  featureTitle: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "800",
    color: colors.primary
  },
  featureDesc: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
    color: colors.textMuted
  },
  exampleText: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600",
    color: colors.primaryMuted
  },
  cta: {
    width: "100%",
    minHeight: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 5
  },
  ctaPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }]
  },
  ctaSpacer: {
    width: 24
  },
  ctaText: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "800",
    color: colors.white,
    textAlign: "center"
  },
  ctaIcon: {
    width: 24
  }
});
