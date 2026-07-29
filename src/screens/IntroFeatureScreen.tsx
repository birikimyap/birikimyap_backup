import { useState, useRef } from "react";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  Animated,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Vibration
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useFinanceStore } from "@/store/financeStore";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const mascotTR = require("../../pgn/mascot-cutout.png");
const mascotEN = require("../../pgn/mascot-cutout-dollar.png");

export default function IntroFeatureScreen() {
  const language = useFinanceStore((state) => state.language);
  const isDarkMode = useFinanceStore((state) => state.isDarkMode);
  const isHapticsEnabled = useFinanceStore((state) => state.isHapticsEnabled);
  const mascot = language === "tr" ? mascotTR : mascotEN;

  const [activeIndex, setActiveIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  const triggerHaptic = () => {
    if (isHapticsEnabled) {
      Vibration.vibrate(12);
    }
  };

  const slides = [
    {
      id: "two-pocket",
      badge: language === "tr" ? "ÇİFT CEP TEKNOLOJİSİ" : "TWO-POCKET MODEL",
      title: language === "tr" ? "Birikimine Dokunmayan Akıllı Bütçe" : "Smart Budget Protecting Your Savings",
      subtitle: language === "tr" 
        ? "Gelir ve sabit giderlerini hesaplar, birikim hedefini ayrı cepte güvenceye alır. Kalan paranı günlük limit olarak harcamana sunar!"
        : "Calculates income and fixed expenses, secures savings in a separate pocket, and sets your daily spendable budget!",
      icon: "shield",
      color: "#00E58F",
      gradient: isDarkMode ? ["#09261C", "#0D382A"] : ["#E6FDF4", "#D1FBEA"],
      type: "pockets"
    },
    {
      id: "rebalancing",
      badge: language === "tr" ? "AKILLI DENGELEME" : "SMART REBALANCING",
      title: language === "tr" ? "Fazla Harcadığında Limitini Otomatik Kısar" : "Auto-Adjusts When You Overspend",
      subtitle: language === "tr"
        ? "Bir gün bütçeni aşarsan panik yok! Sistem seni cezalandırmaz, kalan bütçeni kalan günlere yeniden dağıtır ve birikimini korur."
        : "If you spend more today, no panic! The system rebalances your remaining budget over future days to protect your savings.",
      icon: "sliders",
      color: "#3B82F6",
      gradient: isDarkMode ? ["#0F2038", "#173054"] : ["#EFF6FF", "#DBEAFE"],
      type: "rebalance"
    },
    {
      id: "apple-watch",
      badge: language === "tr" ? "APPLE WATCH & SIRI" : "APPLE WATCH & SIRI",
      title: language === "tr" ? "Bileğinden Tek Cümleyle Harcama Ekle" : "Add Expense From Your Wrist",
      subtitle: language === "tr"
        ? "Telefonunu cebinden çıkarmadan Apple Watch ve Siri'ye komut ver. Harcaman saniyeler içinde otomatik bütçene işlensin!"
        : "Use Siri on your Apple Watch to log expenses instantly without touching your phone!",
      icon: "watch",
      color: "#8B5CF6",
      gradient: isDarkMode ? ["#1E1338", "#2B1A52"] : ["#F5F3FF", "#EDE9FE"],
      type: "watch"
    },
    {
      id: "privacy",
      badge: language === "tr" ? "%100 GİZLİLİK & GÜVENLİK" : "100% LOCAL PRIVACY",
      title: language === "tr" ? "Verilerin Sadece Senin Telefonunda" : "Your Data Stays On Your Device",
      subtitle: language === "tr"
        ? "Hiçbir sunucuya veri aktarılmaz. Maaşın, hedeflerin ve harcamaların tamamen kendi cihazının şifreli hafızasında saklanır."
        : "No data is sent to external servers. Your salary, goals and transactions stay encrypted on your device only.",
      icon: "lock",
      color: "#F59E0B",
      gradient: isDarkMode ? ["#2B1E0A", "#422F11"] : ["#FEF3C7", "#FDE68A"],
      type: "privacy"
    }
  ];

  const handleNext = () => {
    triggerHaptic();
    if (activeIndex < slides.length - 1) {
      const nextIndex = activeIndex + 1;
      setActiveIndex(nextIndex);
      scrollViewRef.current?.scrollTo({ x: nextIndex * SCREEN_WIDTH, animated: true });
    } else {
      router.replace("/plan-ready");
    }
  };

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / SCREEN_WIDTH);
    if (index !== activeIndex && index >= 0 && index < slides.length) {
      setActiveIndex(index);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: isDarkMode ? "#0B1512" : "#F8FAFC" }]}>
      <View style={styles.container}>
        {/* Header Branding */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <Image source={mascot} style={styles.mascotLogo} resizeMode="contain" />
            <Text style={[styles.brandTitle, { color: isDarkMode ? "#F8FAFC" : "#0F172A" }]}>
              Birikim Yap
            </Text>
          </View>
          <Pressable 
            onPress={() => {
              triggerHaptic();
              router.replace("/plan-ready");
            }} 
            style={styles.skipButton}
          >
            <Text style={[styles.skipText, { color: isDarkMode ? "#94A3B8" : "#64748B" }]}>
              {language === "tr" ? "Geç" : "Skip"}
            </Text>
          </Pressable>
        </View>

        {/* 4-Step Progress Line */}
        <View style={styles.progressContainer}>
          {slides.map((_, index) => {
            const isActive = index === activeIndex;
            const isCompleted = index < activeIndex;
            return (
              <View 
                key={index}
                style={[
                  styles.progressSegment,
                  {
                    backgroundColor: isCompleted || isActive 
                      ? slides[activeIndex].color 
                      : (isDarkMode ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)"),
                    flex: isActive ? 2 : 1
                  }
                ]}
              />
            );
          })}
        </View>

        {/* Slides ScrollView */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
            useNativeDriver: false,
            listener: handleScroll
          })}
          scrollEventThrottle={16}
          style={styles.scrollView}
        >
          {slides.map((slide) => (
            <View key={slide.id} style={styles.slideCard}>
              <LinearGradient
                colors={slide.gradient as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  styles.cardGradient,
                  { borderColor: slide.color + "40", borderWidth: 1.5 }
                ]}
              >
                {/* Top Badge */}
                <View style={[styles.badgeWrap, { backgroundColor: slide.color + "20", borderColor: slide.color + "50" }]}>
                  <Text style={[styles.badgeText, { color: slide.color }]}>{slide.badge}</Text>
                </View>

                {/* Graphic Demonstration */}
                <View style={styles.graphicContainer}>
                  {slide.type === "pockets" && (
                    <View style={styles.pocketsVisual}>
                      <View style={[styles.pocketBox, { backgroundColor: isDarkMode ? "rgba(0,229,143,0.15)" : "#E6FDF4", borderColor: "#00E58F" }]}>
                        <Feather name="shopping-bag" size={26} color="#00E58F" />
                        <Text style={[styles.pocketTitle, { color: isDarkMode ? "#F8FAFC" : "#0F172A" }]}>
                          {language === "tr" ? "Harcama Cebi" : "Spend Pocket"}
                        </Text>
                        <Text style={{ fontSize: 13, fontWeight: "900", color: "#00E58F" }}>₺1.000 /gün</Text>
                      </View>

                      <View style={[styles.pocketBox, { backgroundColor: isDarkMode ? "rgba(59,130,246,0.15)" : "#EFF6FF", borderColor: "#3B82F6" }]}>
                        <Feather name="shield" size={26} color="#3B82F6" />
                        <Text style={[styles.pocketTitle, { color: isDarkMode ? "#F8FAFC" : "#0F172A" }]}>
                          {language === "tr" ? "Birikim Cebi" : "Savings Pocket"}
                        </Text>
                        <Text style={{ fontSize: 13, fontWeight: "900", color: "#3B82F6" }}>₺30.000 Güvende</Text>
                      </View>
                    </View>
                  )}

                  {slide.type === "rebalance" && (
                    <View style={styles.rebalanceVisual}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 }}>
                        <Feather name="sliders" size={28} color="#3B82F6" />
                        <Text style={{ fontSize: 14, fontWeight: "900", color: isDarkMode ? "#F8FAFC" : "#0F172A" }}>
                          {language === "tr" ? "Otomatik Dengeleme" : "Auto Rebalancing"}
                        </Text>
                      </View>
                      <View style={{ width: "100%", height: 8, borderRadius: 4, backgroundColor: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)", overflow: "hidden" }}>
                        <View style={{ width: "65%", height: "100%", backgroundColor: "#3B82F6", borderRadius: 4 }} />
                      </View>
                      <Text style={{ fontSize: 11, fontWeight: "700", color: "#3B82F6", marginTop: 8 }}>
                        {language === "tr" ? "Aşım Sonrası Yeniden Hesaplandı: Günlük ₺929" : "Recalculated After Overuse: Daily ₺929"}
                      </Text>
                    </View>
                  )}

                  {slide.type === "watch" && (
                    <View style={styles.watchVisual}>
                      <View style={styles.watchBezel}>
                        <View style={styles.watchScreen}>
                          <View style={styles.micCircle}>
                            <Feather name="mic" size={20} color="#00E58F" />
                          </View>
                          <View style={styles.waveLines}>
                            <View style={[styles.waveBar, { height: 12 }]} />
                            <View style={[styles.waveBar, { height: 22 }]} />
                            <View style={[styles.waveBar, { height: 16 }]} />
                            <View style={[styles.waveBar, { height: 26 }]} />
                            <View style={[styles.waveBar, { height: 14 }]} />
                          </View>
                        </View>
                      </View>
                      <View style={{ flex: 1, justifyContent: "center" }}>
                        <Text style={{ fontSize: 10, fontWeight: "800", color: "#8B5CF6", letterSpacing: 0.5, marginBottom: 2 }}>
                          SIRI SESLİ KOMUT
                        </Text>
                        <Text style={{ fontSize: 13, fontWeight: "900", color: isDarkMode ? "#F8FAFC" : "#0F172A", lineHeight: 17 }}>
                          “Hey Siri, Birikim Yap 350 TL Market”
                        </Text>
                      </View>
                    </View>
                  )}

                  {slide.type === "privacy" && (
                    <View style={styles.privacyVisual}>
                      <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: "rgba(245,158,11,0.15)", alignItems: "center", justifyContent: "center" }}>
                        <Feather name="lock" size={26} color="#F59E0B" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: "900", color: isDarkMode ? "#F8FAFC" : "#0F172A" }}>
                          {language === "tr" ? "%100 Yerel Veri (KVKK / GDPR)" : "100% Local Data (GDPR)"}
                        </Text>
                        <Text style={{ fontSize: 11, fontWeight: "600", color: isDarkMode ? "#94A3B8" : "#64748B", marginTop: 2 }}>
                          {language === "tr" ? "Verilerin cihaz haricine asla çıkmaz." : "Your data never leaves your device."}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>

                {/* Text Content */}
                <Text style={[styles.cardTitle, { color: isDarkMode ? "#F8FAFC" : "#0F172A" }]}>
                  {slide.title}
                </Text>
                
                <Text style={[styles.cardSubtitle, { color: isDarkMode ? "#94A3B8" : "#475569" }]}>
                  {slide.subtitle}
                </Text>
              </LinearGradient>
            </View>
          ))}
        </ScrollView>

        {/* Bottom CTA Button */}
        <View style={styles.footer}>
          <Pressable
            onPress={handleNext}
            style={({ pressed }) => [
              styles.actionButton,
              { backgroundColor: slides[activeIndex].color },
              pressed && styles.pressed
            ]}
          >
            <Text style={styles.actionButtonText}>
              {activeIndex === slides.length - 1
                ? (language === "tr" ? "Planıma Başla 🚀" : "Start My Plan 🚀")
                : (language === "tr" ? "Devam Et" : "Continue")}
            </Text>
            <Feather name="arrow-right" size={18} color="#031D14" />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    justifyContent: "space-between"
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  mascotLogo: {
    width: 34,
    height: 34
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: "900"
  },
  skipButton: {
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  skipText: {
    fontSize: 13,
    fontWeight: "700"
  },
  progressContainer: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 20
  },
  progressSegment: {
    height: 5,
    borderRadius: 2.5
  },
  scrollView: {
    flex: 1
  },
  slideCard: {
    width: SCREEN_WIDTH - 40,
    height: "100%",
    justifyContent: "center"
  },
  cardGradient: {
    borderRadius: 28,
    padding: 24,
    height: "92%",
    justifyContent: "space-between"
  },
  badgeWrap: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5
  },
  graphicContainer: {
    marginVertical: 14,
    justifyContent: "center"
  },
  pocketsVisual: {
    gap: 10
  },
  pocketBox: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  pocketTitle: {
    fontSize: 13,
    fontWeight: "800",
    flex: 1,
    marginLeft: 10
  },
  rebalanceVisual: {
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.2)"
  },
  watchVisual: {
    backgroundColor: "rgba(139,92,246,0.1)",
    padding: 14,
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: "rgba(139,92,246,0.3)",
    flexDirection: "row",
    alignItems: "center",
    gap: 14
  },
  watchBezel: {
    width: 64,
    height: 74,
    borderRadius: 18,
    backgroundColor: "#1E1E24",
    borderWidth: 2,
    borderColor: "#3A3A42",
    alignItems: "center",
    justifyContent: "center",
    padding: 4
  },
  watchScreen: {
    width: "100%",
    height: "100%",
    backgroundColor: "#0B0B0E",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 4
  },
  micCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(0,229,143,0.15)",
    alignItems: "center",
    justifyContent: "center"
  },
  waveLines: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2
  },
  waveBar: {
    width: 2.5,
    backgroundColor: "#00E58F",
    borderRadius: 1.5
  },
  privacyVisual: {
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.2)",
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 28
  },
  cardSubtitle: {
    fontSize: 13.5,
    fontWeight: "600",
    lineHeight: 20
  },
  footer: {
    marginTop: 10
  },
  actionButton: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#031D14"
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }]
  }
});
