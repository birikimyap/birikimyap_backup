import { useState } from "react";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  Vibration,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

import { colors, spacing, typography } from "@/theme";
import { useFinanceStore } from "@/store/financeStore";
import { translations } from "@/utils/translations";
import { getSupabase } from "@/lib/supabase";
import { saveUserPlanToCloud } from "@/utils/supabaseAuth";

const mascotTR = require("../../pgn/mascot-cutout.png");

export default function ProfileSetupScreen() {
  const language = useFinanceStore((state) => state.language);
  const currency = useFinanceStore((state) => state.currency);
  const setCurrency = useFinanceStore((state) => state.setCurrency);
  const isHapticsEnabled = useFinanceStore((state) => state.isHapticsEnabled);
  
  const [fullName, setFullName] = useState("");

  const triggerHaptic = () => {
    if (isHapticsEnabled) {
      Vibration.vibrate(10);
    }
  };

  const handleContinue = async () => {
    triggerHaptic();
    try {
      const client = getSupabase();
      if (client) {
        const { data: sessionData } = await client.auth.getSession();
        const user = sessionData?.session?.user;
        if (user?.id) {
          const finalName = fullName.trim() || user.email?.split("@")[0] || "Kullanıcı";
          useFinanceStore.getState().setUserProfile({
            id: user.id,
            email: user.email || "",
            fullName: finalName
          });
          await saveUserPlanToCloud();
        }
      }
    } catch (e) {
      console.log("Profile save error:", e);
    }

    router.replace("/intro");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          
          {/* Header & VIP Mascot Badge */}
          <View style={styles.hero}>
            <View style={styles.mascotGlowWrap}>
              <View style={styles.mascotBgCircle} />
              <Image source={mascotTR} style={styles.mascot} resizeMode="contain" />
            </View>
            
            <View style={styles.vipBadge}>
              <Feather name="star" size={14} color="#D97706" />
              <Text style={styles.vipBadgeText}>
                {language === "tr" ? "Kişiselleştirme" : "Personalization"}
              </Text>
            </View>

            <Text style={styles.title}>
              {language === "tr" ? "Profilini Oluştur" : "Create Your Profile"}
            </Text>
            <Text style={styles.subtitle}>
              {language === "tr" 
                ? "Seni daha yakından tanıyalım ve finansal planını sana özel hazırlayalım." 
                : "Let's personalize your budget for a seamless experience."}
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            <View style={styles.accentBorderLine} />
            
            <View style={styles.inputHeaderRow}>
              <Text style={styles.inputLabel}>
                {language === "tr" ? "Adınız ve Soyadınız" : "Full Name"}
              </Text>
              <Text style={styles.inputSubBadge}>
                {language === "tr" ? "Raporlarda Görünür" : "Shown in Reports"}
              </Text>
            </View>

            <View style={styles.inputWrapFocused}>
              <View style={styles.iconCirclePremium}>
                <Feather name="user-check" size={19} color="#0D3228" />
              </View>
              <TextInput
                style={styles.inputPremium}
                placeholder={language === "tr" ? "Adınız Soyadınız" : "Your Full Name"}
                placeholderTextColor="rgba(102, 115, 110, 0.6)"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
            </View>
            <Text style={styles.helperText}>
              {language === "tr" 
                ? "💡 Bütçe raporlarınız ve bildirimleriniz size bu isimle hitap edecektir." 
                : "💡 Your budget reports and notifications will use this name."}
            </Text>

            {/* Currency Selector */}
            <Text style={[styles.inputLabel, { marginTop: 24 }]}>
              {language === "tr" ? "Para Birimi Tercihi" : "Preferred Currency"}
            </Text>
            <View style={styles.currencyRow}>
              {(["TRY", "USD", "EUR"] as const).map((curr) => {
                const isActive = currency === curr;
                return (
                  <Pressable
                    key={curr}
                    style={({ pressed }) => [
                      styles.currBtn,
                      isActive && styles.currBtnActive,
                      pressed && styles.pressed
                    ]}
                    onPress={() => {
                      triggerHaptic();
                      setCurrency(curr);
                    }}
                  >
                    <Text style={[styles.currText, isActive && styles.currTextActive]}>
                      {curr === "TRY" ? "₺ TL" : curr === "USD" ? "$ USD" : "€ EUR"}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Premium Action Button */}
          <Pressable style={({ pressed }) => [styles.buttonWrap, pressed && styles.pressed]} onPress={handleContinue}>
            <LinearGradient
              colors={["#0D3228", "#1A5343"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              <Text style={styles.buttonText}>
                {language === "tr" ? "Devam Et" : "Continue"}
              </Text>
              <View style={styles.btnIconWrap}>
                <Feather name="arrow-right" size={20} color={colors.white} />
              </View>
            </LinearGradient>
          </Pressable>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F6F8F6",
  },
  keyboard: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
    justifyContent: "space-between",
  },
  hero: {
    alignItems: "center",
    marginBottom: 20,
  },
  mascotGlowWrap: {
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  mascotBgCircle: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(13, 50, 40, 0.06)",
  },
  mascot: {
    width: 124,
    height: 124,
  },
  vipBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FDE68A",
    marginBottom: 12,
  },
  vipBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#B45309",
    letterSpacing: 0.3,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "900",
    color: "#0D3228",
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "#66736E",
    textAlign: "center",
    paddingHorizontal: 16,
    lineHeight: 22,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: "rgba(13, 50, 40, 0.08)",
    shadowColor: "#0D1A15",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
    marginBottom: 24,
    overflow: "hidden",
  },
  accentBorderLine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: "#0D3228",
  },
  inputHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0C1411",
  },
  inputSubBadge: {
    fontSize: 11,
    fontWeight: "800",
    color: "#0D3228",
    backgroundColor: "rgba(13, 50, 40, 0.08)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  inputWrapFocused: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(13, 50, 40, 0.03)",
    borderWidth: 2,
    borderColor: "#0D3228",
    borderRadius: 18,
    paddingHorizontal: 14,
    height: 58,
    shadowColor: "#0D3228",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  iconCirclePremium: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(13, 50, 40, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  inputPremium: {
    flex: 1,
    fontSize: 16,
    fontWeight: "800",
    color: "#0C1411",
  },
  helperText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#66736E",
    marginTop: 8,
    lineHeight: 17,
  },
  currencyRow: {
    flexDirection: "row",
    gap: 10,
  },
  currBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },
  currBtnActive: {
    borderColor: "#0D3228",
    backgroundColor: "rgba(13, 50, 40, 0.08)",
  },
  currText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#66736E",
  },
  currTextActive: {
    color: "#0D3228",
    fontWeight: "900",
  },
  buttonWrap: {
    width: "100%",
    borderRadius: 18,
    shadowColor: "#0D3228",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 6,
  },
  gradientButton: {
    height: 56,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    marginRight: 10,
  },
  btnIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
});
