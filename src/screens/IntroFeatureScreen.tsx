import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, radius, spacing } from "@/theme";

type FeatureItem = {
  id: string;
  title: string;
  icon: keyof typeof Feather.glyphMap;
  highlighted?: boolean;
};

const mascot = require("../../pgn/mascot-transparent.png");

const features: FeatureItem[] = [
  {
    id: "income-expense",
    title: "Gelir ve giderlerini ekle",
    icon: "credit-card"
  },
  {
    id: "savings-goal",
    title: "Birikim hedefini belirle",
    icon: "target"
  },
  {
    id: "voice-expense",
    title: "Sesli harcama ekle",
    icon: "mic",
    highlighted: true
  }
];

export default function IntroFeatureScreen() {
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

          <Text style={styles.heading}>Paranı yönetmek artık daha kolay</Text>
          <Text style={styles.subtitle}>
            Gelirini, giderini ve birikim hedefini gir; sana özel harcama limitini oluşturalım.
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
          <Text style={styles.ctaText}>Başlayalım</Text>
          <Feather name="arrow-right" size={26} color={colors.white} style={styles.ctaIcon} />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function FeatureCard({ feature }: { feature: FeatureItem }) {
  return (
    <View style={[styles.featureRow, feature.highlighted && styles.featureRowHighlighted]}>
      <View style={[styles.iconBox, feature.highlighted && styles.iconBoxHighlighted]}>
        <Feather name={feature.icon} size={feature.highlighted ? 30 : 28} color={colors.primary} />
      </View>
      <View style={styles.featureCopy}>
        {feature.highlighted ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>YENİ</Text>
          </View>
        ) : null}
        <Text style={styles.featureTitle}>{feature.title}</Text>
        {feature.highlighted ? (
          <Text style={styles.exampleText}>
            Örneğin: ‘120 lira kahve harcadım’ dediğinde otomatik kaydedilir.
          </Text>
        ) : null}
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
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingTop: 20,
    paddingBottom: 18
  },
  hero: {
    width: "100%",
    alignItems: "center"
  },
  mascotStage: {
    width: 250,
    height: 190,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8
  },
  softOval: {
    position: "absolute",
    bottom: 8,
    width: 206,
    height: 94,
    borderRadius: 120,
    backgroundColor: "#EAF0DF"
  },
  mascot: {
    width: 184,
    height: 188
  },
  sparkle: {
    position: "absolute",
    color: colors.primaryMuted,
    fontSize: 24,
    fontWeight: "800"
  },
  sparkleLeft: {
    left: 24,
    top: 46
  },
  sparkleRight: {
    right: 28,
    bottom: 38,
    fontSize: 19
  },
  heading: {
    fontSize: 30,
    lineHeight: 37,
    fontWeight: "900",
    color: colors.primary,
    textAlign: "center"
  },
  subtitle: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 23,
    fontWeight: "600",
    color: "#747C78",
    textAlign: "center"
  },
  features: {
    width: "100%",
    marginTop: 28,
    gap: 14
  },
  featureRow: {
    width: "100%",
    minHeight: 68,
    borderRadius: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 16
  },
  featureRowHighlighted: {
    minHeight: 92,
    backgroundColor: "rgba(255, 252, 246, 0.76)",
    paddingVertical: spacing.sm,
    paddingRight: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 3
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "#EBEDE1",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 2
  },
  iconBoxHighlighted: {
    backgroundColor: colors.primarySoft
  },
  featureCopy: {
    flex: 1
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 4
  },
  badgeText: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "900",
    color: colors.primary
  },
  featureTitle: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: "900",
    color: colors.primary
  },
  exampleText: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
    color: "#747C78"
  },
  cta: {
    width: "100%",
    minHeight: 62,
    borderRadius: 31,
    backgroundColor: colors.primary,
    marginTop: 28,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 7
  },
  ctaPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }]
  },
  ctaSpacer: {
    width: 26
  },
  ctaText: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "900",
    color: colors.white,
    textAlign: "center"
  },
  ctaIcon: {
    width: 26
  }
});
