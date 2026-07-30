import { useState } from "react";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, radius, spacing } from "@/theme";
import { useFinanceStore } from "@/store/financeStore";
import { translations } from "@/utils/translations";

type FeatureTheme = {
  bgLight: string;
  bgDark: string;
  border: string;
  iconBg: string;
  iconColor: string;
  badgeBg: string;
  textColor: string;
};

type FeatureItem = {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Feather.glyphMap;
  badgeLabel?: string;
  theme: FeatureTheme;
  details: {
    subtitle: string;
    graphicType: "income" | "savings" | "voice";
    steps: Array<{ icon: keyof typeof Feather.glyphMap; title: string; desc: string }>;
  };
};

const mascotTR = require("../../pgn/mascot-cutout.png");
const mascotEN = require("../../pgn/mascot-cutout-dollar.png");

export default function IntroFeatureScreen() {
  const language = useFinanceStore((state) => state.language);
  const isDarkMode = useFinanceStore((state) => state.isDarkMode);
  const mascot = language === "tr" ? mascotTR : mascotEN;
  const [selectedFeature, setSelectedFeature] = useState<FeatureItem | null>(null);

  const features: FeatureItem[] = [
    {
      id: "income-expense",
      title: language === "tr" ? "Gelir ve Giderlerini Ekle" : "Add Income & Expenses",
      description: language === "tr" ? "Aylık gelir ve sabit ödemelerini girerek limitini belirle." : "Determine your limit by entering monthly incomes and fixed payments.",
      icon: "credit-card",
      badgeLabel: language === "tr" ? "BÜTÇE" : "BUDGET",
      theme: {
        bgLight: "#EDFDF5",
        bgDark: "#0E2820",
        border: "#00DF89",
        iconBg: "#00DF89",
        iconColor: "#031D14",
        badgeBg: "#00DF89",
        textColor: "#065F46"
      },
      details: {
        subtitle: language === "tr" ? "Aylık bütçeni doğru yönetmenin ilk adımı" : "First step to manage your monthly budget",
        graphicType: "income",
        steps: [
          {
            icon: "trending-up",
            title: language === "tr" ? "1. Gelirlerini Giriş Yap" : "1. Enter Income Sources",
            desc: language === "tr" ? "Maaş, ek gelir veya düzenli nakit girişlerini ekle." : "Add salary, side income or regular cash inflows."
          },
          {
            icon: "shield",
            title: language === "tr" ? "2. Sabit Ödemelerini Ayır" : "2. Set Fixed Expenses",
            desc: language === "tr" ? "Kira, faturalar ve kredi ödemelerin otomatik düşülür." : "Rent, utility bills and loans are automatically deducted."
          },
          {
            icon: "pie-chart",
            title: language === "tr" ? "3. Harcanabilir Limitini Gör" : "3. See Spendable Limit",
            desc: language === "tr" ? "Kalan net tutarla günlük ve haftalık harcama limitin belirlenir." : "Your daily and weekly limits are set from remaining net money."
          }
        ]
      }
    },
    {
      id: "savings-goal",
      title: language === "tr" ? "Birikim Hedefini Belirle" : "Set Your Savings Goal",
      description: language === "tr" ? "Kendine bir birikim oranı seç ve ilerlemeni anlık gör." : "Choose a savings rate for yourself and see your progress in real-time.",
      icon: "target",
      badgeLabel: language === "tr" ? "HEDEF" : "GOAL",
      theme: {
        bgLight: "#F5F0FF",
        bgDark: "#1E1233",
        border: "#9333EA",
        iconBg: "#9333EA",
        iconColor: "#FFFFFF",
        badgeBg: "#9333EA",
        textColor: "#6B21A8"
      },
      details: {
        subtitle: language === "tr" ? "Hayallerine ulaşmak için akıllı finans rehberi" : "Smart financial guide to reach your dreams",
        graphicType: "savings",
        steps: [
          {
            icon: "percent",
            title: language === "tr" ? "1. Gerçekçi Bir Oran Seç" : "1. Choose a Realistic Rate",
            desc: language === "tr" ? "Gelirinin %10, %20 veya %30'unu birikime ayır." : "Set aside 10%, 20% or 30% of your income for savings."
          },
          {
            icon: "lock",
            title: language === "tr" ? "2. Birikim Tutarın Korunur" : "2. Savings Goal Secured",
            desc: language === "tr" ? "Hedef tutarın harcama limitlerinden ayrılır ve dokunulmaz." : "Your goal amount is set aside from spending limits."
          },
          {
            icon: "award",
            title: language === "tr" ? "3. Canlı İlerleme Takibi" : "3. Live Progress Tracking",
            desc: language === "tr" ? "Ana sayfadaki zümrüt çubukla hedefine ne kadar yaklaştığını izle." : "Watch your progress toward your goal on the home dashboard."
          }
        ]
      }
    },
    {
      id: "voice-expense",
      title: language === "tr" ? "Siri ile Sesli Harcama Ekle" : "Add Voice Expense with Siri",
      description: language === "tr" 
        ? "‘Hey Siri, Birikim Yap’ demen yeterli! Siri ‘Ne, ne kadar?’ diye sorduğunda harcamanı söyle." 
        : "Just say 'Hey Siri, Birikim Yap'! When Siri asks 'What & How much?', simply tell your expense.",
      icon: "mic",
      badgeLabel: language === "tr" ? "SIRI & YAPAY ZEKA" : "SIRI & AI",
      theme: {
        bgLight: "#FFF7ED",
        bgDark: "#2A1A0A",
        border: "#F59E0B",
        iconBg: "#F59E0B",
        iconColor: "#FFFFFF",
        badgeBg: "#F59E0B",
        textColor: "#92400E"
      },
      details: {
        subtitle: language === "tr" ? "Tuş kilitliyken bile Siri ile anında harcama ekle" : "Add expenses via Siri even when phone is locked",
        graphicType: "voice",
        steps: [
          {
            icon: "volume-2",
            title: language === "tr" ? "1. Siri'ye Seslen" : "1. Call Siri",
            desc: language === "tr" ? "‘Hey Siri, Birikim Yap’ demen yeterlidir." : "Just say 'Hey Siri, Birikim Yap'."
          },
          {
            icon: "help-circle",
            title: language === "tr" ? "2. Siri Sorar: 'Ne, ne kadar?'" : "2. Siri Asks: 'What & How much?'",
            desc: language === "tr" ? "Siri anında devreye girip harcama detayını sesli sorar." : "Siri prompts you for your expense details."
          },
          {
            icon: "check-circle",
            title: language === "tr" ? "3. Cevap Ver: 'Market 350'" : "3. Reply: 'Grocery 350'",
            desc: language === "tr" ? "Sözlü cevabın yapay zeka ile ayrıştırılıp bütçene otomatik işlenir!" : "AI parses your voice response and adds it to your budget!"
          }
        ]
      }
    }
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: isDarkMode ? "#070E0B" : "#F6FAF7" }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
        <View style={styles.hero}>
          <View style={styles.mascotStage}>
            {/* Glowing Backdrop Light */}
            <LinearGradient
              colors={isDarkMode ? ["rgba(0, 223, 137, 0.22)", "rgba(0, 223, 137, 0.0)"] : ["rgba(0, 223, 137, 0.16)", "rgba(0, 223, 137, 0.0)"]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.glowingHalo}
            />
            <Text style={[styles.sparkle, styles.sparkleLeft]}>✦</Text>
            <Text style={[styles.sparkle, styles.sparkleRight]}>✦</Text>
            <Image source={mascot} style={styles.mascot} resizeMode="contain" />
          </View>

          <Text style={[styles.heading, { color: isDarkMode ? "#FFFFFF" : "#0D3228" }]}>
            {language === "tr" ? "Paranı yönetmek artık daha kolay" : "Managing money is now easier"}
          </Text>
          <Text style={[styles.subtitle, { color: isDarkMode ? "rgba(255,255,255,0.7)" : "#5C6661" }]}>
            {language === "tr" 
              ? "Gelirini, giderini ve birikim hedefini gir; sana özel harcama limitini oluşturalım." 
              : "Enter your income, expense and savings goal; let us create your personalized budget limits."}
          </Text>
        </View>

        <View style={styles.features}>
          {features.map((feature) => (
            <FeatureCard 
              key={feature.id} 
              feature={feature} 
              onPress={() => setSelectedFeature(feature)} 
            />
          ))}
        </View>

        <Pressable
          onPress={() => router.push("/legal-consent")}
          style={({ pressed }) => [styles.ctaWrapper, pressed && styles.ctaPressed]}
        >
          <LinearGradient
            colors={["#00E58F", "#00BF76", "#048052"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ctaGradient}
          >
            <View style={styles.ctaSpacer} />
            <Text style={styles.ctaText}>{language === "tr" ? "Başlayalım" : "Let's Start"}</Text>
            <Feather name="arrow-right" size={24} color="#031D14" style={styles.ctaIcon} />
          </LinearGradient>
        </Pressable>
      </ScrollView>

      {/* Feature Detail Modal */}
      {selectedFeature && (
        <FeatureDetailModal 
          feature={selectedFeature} 
          onClose={() => setSelectedFeature(null)} 
        />
      )}
    </SafeAreaView>
  );
}

function FeatureCard({ feature, onPress }: { feature: FeatureItem; onPress: () => void }) {
  const isDarkMode = useFinanceStore((state) => state.isDarkMode);
  
  return (
    <Pressable 
      onPress={onPress}
      style={({ pressed }) => [
        styles.featureRow, 
        {
          backgroundColor: isDarkMode ? feature.theme.bgDark : feature.theme.bgLight,
          borderColor: feature.theme.border,
          borderWidth: 1.2,
          borderLeftWidth: 3.5,
          borderLeftColor: feature.theme.border,
          shadowColor: feature.theme.border,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: isDarkMode ? 0.2 : 0.1,
          shadowRadius: 12,
          elevation: 4
        },
        pressed && { opacity: 0.84, transform: [{ scale: 0.98 }] }
      ]}
    >
      <View style={[styles.iconBox, { backgroundColor: feature.theme.iconBg, shadowColor: feature.theme.iconBg, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6 }]}>
        <Feather name={feature.icon} size={22} color={feature.theme.iconColor} />
      </View>

      <View style={styles.featureCopy}>
        <View style={styles.titleRow}>
          <Text style={[styles.featureTitle, { color: isDarkMode ? "#FFFFFF" : "#0D3228", fontWeight: "800" }]}>
            {feature.title}
          </Text>
          {feature.badgeLabel ? (
            <View style={[styles.badge, { backgroundColor: feature.theme.badgeBg }]}>
              <Text style={[styles.badgeText, { color: feature.id === "income-expense" ? "#031D14" : "#FFFFFF" }]}>{feature.badgeLabel}</Text>
            </View>
          ) : null}
        </View>
        <Text 
          numberOfLines={2} 
          style={[styles.featureDesc, { color: isDarkMode ? "rgba(255,255,255,0.7)" : "#5C6661", fontWeight: "500" }]}
        >
          {feature.description}
        </Text>
      </View>

      <View style={{ justifyContent: "center", paddingLeft: 8 }}>
        <View style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: isDarkMode ? "rgba(255,255,255,0.12)" : "rgba(13,50,40,0.06)",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <Feather name="chevron-right" size={18} color={feature.theme.border} />
        </View>
      </View>
    </Pressable>
  );
}

function FeatureDetailModal({ feature, onClose }: { feature: FeatureItem; onClose: () => void }) {
  const isDarkMode = useFinanceStore((state) => state.isDarkMode);
  const language = useFinanceStore((state) => state.language);

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View style={{
          backgroundColor: isDarkMode ? "#12231C" : "#FFFFFF",
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          padding: 24,
          maxHeight: "88%",
          borderWidth: 1.5,
          borderColor: isDarkMode ? "rgba(0, 223, 137, 0.3)" : "rgba(13, 50, 40, 0.12)",
          shadowColor: "#00DF89",
          shadowOffset: { width: 0, height: -10 },
          shadowOpacity: 0.2,
          shadowRadius: 24,
          elevation: 10
        }}>
          {/* Modal Header */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
              <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(0,223,137,0.18)", alignItems: "center", justifyContent: "center" }}>
                <Feather name={feature.icon} size={22} color="#00DF89" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: "900", color: isDarkMode ? "#FFFFFF" : "#0D3228" }}>{feature.title}</Text>
                <Text style={{ fontSize: 12, fontWeight: "600", color: isDarkMode ? "rgba(255,255,255,0.6)" : "#66706B" }}>{feature.details.subtitle}</Text>
              </View>
            </View>
            <Pressable onPress={onClose} style={{ padding: 6, borderRadius: 16, backgroundColor: isDarkMode ? "rgba(255,255,255,0.08)" : "#F0F0F0" }}>
              <Feather name="x" size={20} color={isDarkMode ? "#FFFFFF" : "#0D3228"} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Visual Graphic Illustration Card */}
            <View style={{ borderRadius: 20, overflow: "hidden", marginBottom: 20 }}>
              <LinearGradient
                colors={
                  feature.details.graphicType === "income" 
                    ? ["#0E2A20", "#17483B"] 
                    : feature.details.graphicType === "savings"
                    ? ["#2E1B4E", "#4C2882"]
                    : ["#0B3026", "#00DF89"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ padding: 20, alignItems: "center", justifyContent: "center", minHeight: 140 }}
              >
                {feature.details.graphicType === "income" && (
                  <View style={{ width: "100%", alignItems: "center" }}>
                    <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
                      <View style={{ backgroundColor: "rgba(255,255,255,0.15)", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Feather name="trending-up" size={16} color="#00DF89" />
                        <Text style={{ color: "#FFFFFF", fontWeight: "800", fontSize: 13 }}>Maaş + Ek Gelir</Text>
                      </View>
                      <View style={{ backgroundColor: "rgba(255,255,255,0.15)", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Feather name="shield" size={16} color="#DF7A12" />
                        <Text style={{ color: "#FFFFFF", fontWeight: "800", fontSize: 13 }}>Kira & Faturalar</Text>
                      </View>
                    </View>
                    <View style={{ backgroundColor: "rgba(0,223,137,0.25)", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16, borderWidth: 1, borderColor: "#00DF89" }}>
                      <Text style={{ color: "#00DF89", fontWeight: "900", fontSize: 15 }}>= Net Kullanılabilir Bütçe ✨</Text>
                    </View>
                  </View>
                )}

                {feature.details.graphicType === "savings" && (
                  <View style={{ width: "100%", alignItems: "center" }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <Feather name="award" size={24} color="#FDE68A" />
                      <Text style={{ color: "#FFFFFF", fontWeight: "900", fontSize: 17 }}>%20 Akıllı Birikim</Text>
                    </View>
                    <View style={{ width: "100%", height: 10, borderRadius: 5, backgroundColor: "rgba(255,255,255,0.2)", overflow: "hidden" }}>
                      <View style={{ width: "65%", height: "100%", backgroundColor: "#FDE68A", borderRadius: 5 }} />
                    </View>
                    <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: "700", marginTop: 8 }}>
                      {language === "tr" ? "🎯 Bütçenden ₺5.000 Birikime Ayrıldı" : "🎯 $5,000 Saved from Budget"}
                    </Text>
                  </View>
                )}

                {feature.details.graphicType === "voice" && (
                  <View style={{ width: "100%", alignItems: "center" }}>
                    <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.25)", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
                      <Feather name="mic" size={24} color="#FFFFFF" />
                    </View>
                    <View style={{ backgroundColor: "rgba(255,255,255,0.18)", paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, marginBottom: 6 }}>
                      <Text style={{ color: "#FFFFFF", fontWeight: "900", fontSize: 13 }}>🗣️ “Hey Siri, Birikim Yap”</Text>
                    </View>
                    <View style={{ backgroundColor: "#00DF89", paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, marginBottom: 6 }}>
                      <Text style={{ color: "#040907", fontWeight: "900", fontSize: 13 }}>🎙️ Siri: “Ne, ne kadar?”</Text>
                    </View>
                    <View style={{ backgroundColor: "#FFFFFF", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 }}>
                      <Text style={{ color: "#074737", fontWeight: "900", fontSize: 12 }}>💬 Siz: “Market 350” ➔ Otomatik Kayıt! 🐷</Text>
                    </View>
                  </View>
                )}
              </LinearGradient>
            </View>

            {/* Step-by-Step Guide Items */}
            <Text style={{ fontSize: 15, fontWeight: "900", color: isDarkMode ? "#FFFFFF" : "#0D3228", marginBottom: 12 }}>
              {language === "tr" ? "Nasıl Çalışır?" : "How It Works?"}
            </Text>

            {feature.details.steps.map((step, idx) => (
              <View 
                key={idx} 
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  gap: 12,
                  marginBottom: 14,
                  padding: 12,
                  borderRadius: 16,
                  backgroundColor: isDarkMode ? "rgba(255,255,255,0.03)" : "#FAFAF9",
                  borderWidth: 1,
                  borderLeftWidth: 3.5,
                  borderLeftColor: "#00DF89",
                  borderColor: isDarkMode ? "rgba(255,255,255,0.06)" : "#E7E5E4"
                }}
              >
                <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(0,223,137,0.14)", alignItems: "center", justifyContent: "center", marginTop: 2 }}>
                  <Feather name={step.icon} size={16} color="#00DF89" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: "800", color: isDarkMode ? "#FFFFFF" : "#0D3228", marginBottom: 2 }}>
                    {step.title}
                  </Text>
                  <Text style={{ fontSize: 12.5, fontWeight: "600", color: isDarkMode ? "rgba(255,255,255,0.65)" : "#5C6661", lineHeight: 18 }}>
                    {step.desc}
                  </Text>
                </View>
              </View>
            ))}

            {/* Action Close Button */}
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                {
                  marginTop: 8,
                  marginBottom: 12,
                  height: 52,
                  borderRadius: 18,
                  overflow: "hidden",
                  shadowColor: "#00E58F",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.35,
                  shadowRadius: 10,
                  elevation: 5
                },
                pressed && { opacity: 0.9 }
              ]}
            >
              <LinearGradient
                colors={["#00E58F", "#00BF76", "#048052"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
              >
                <Text style={{ fontSize: 16, fontWeight: "900", color: "#031D14" }}>
                  {language === "tr" ? "Anladım, Harika! 👍" : "Got It, Great! 👍"}
                </Text>
              </LinearGradient>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1
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
    marginBottom: 12,
    position: "relative"
  },
  glowingHalo: {
    position: "absolute",
    bottom: 2,
    width: 180,
    height: 60,
    borderRadius: 90
  },
  mascot: {
    width: 170,
    height: 170
  },
  sparkle: {
    position: "absolute",
    color: "#00DF89",
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
    fontWeight: "900",
    textAlign: "center",
    paddingHorizontal: 12
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "600",
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
    height: 114,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    borderRadius: 22,
    marginBottom: 10
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14
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
    paddingHorizontal: 6,
    paddingVertical: 2
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "900"
  },
  featureTitle: {
    fontSize: 16,
    lineHeight: 20
  },
  featureDesc: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18
  },
  ctaWrapper: {
    width: "100%",
    minHeight: 56,
    borderRadius: 28,
    overflow: "hidden",
    shadowColor: "#00E58F",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.38,
    shadowRadius: 14,
    elevation: 7
  },
  ctaGradient: {
    width: "100%",
    minHeight: 56,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  ctaPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }]
  },
  ctaSpacer: {
    width: 24
  },
  ctaText: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "900",
    color: "#031D14",
    textAlign: "center"
  },
  ctaIcon: {
    width: 24
  }
});
