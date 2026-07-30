import { useState, useEffect } from "react";
import { Feather, FontAwesome } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  Vibration,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, spacing, typography } from "@/theme";
import { useFinanceStore } from "@/store/financeStore";
import { LegalModal } from "@/components/LegalModal";
import { TERMS_OF_SERVICE, PRIVACY_POLICY, LegalDoc } from "@/utils/legalTexts";
import { translations } from "@/utils/translations";
import { signInWithGoogle, getCheckSession, signUpWithEmail, signInWithEmail, checkUserProfileExist, loadUserPlanFromCloud } from "@/utils/supabaseAuth";
import { signInWithApple } from "@/utils/appleAuth";
import { Modal, TextInput } from "react-native";

type LoginButtonProps = {
  title: string;
  kind: "apple" | "google" | "email";
  onPress: () => void;
  isLoading?: boolean;
};

const mascotTR = require("../../pgn/mascot-cutout.png");
const mascotEN = require("../../pgn/mascot-cutout-dollar.png");
const googleMark = require("../../pgn/google-mark.png");

export default function LoginScreen() {
  const language = useFinanceStore((state) => state.language);
  const hasPlan = useFinanceStore((state) => state.incomes.length > 0);
  const mascot = language === "tr" ? mascotTR : mascotEN;
  const setLanguage = useFinanceStore((state) => state.setLanguage);
  const isHapticsEnabled = useFinanceStore((state) => state.isHapticsEnabled);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingApple, setLoadingApple] = useState(false);
  const [isEmailModalVisible, setIsEmailModalVisible] = useState(false);
  const [emailMode, setEmailMode] = useState<"signup" | "signin">("signup");
  const [emailVal, setEmailVal] = useState("");
  const [passwordVal, setPasswordVal] = useState("");
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [legalModalDoc, setLegalModalDoc] = useState<LegalDoc | null>(null);

  const t = (key: keyof typeof translations["tr"]) => translations[language][key] || key;

  const triggerHaptic = () => {
    if (isHapticsEnabled) {
      Vibration.vibrate(10);
    }
  };

  const routeUserAfterAuth = async (user?: any) => {
    if (user?.id) {
      // 1. Veritabanından kullanıcının bulut bütçesini geri yükle (Cloud Sync)
      const isLoadedFromCloud = await loadUserPlanFromCloud(user.id);
      if (isLoadedFromCloud) {
        router.replace("/home-dashboard");
        return;
      }

      // 2. Profil kaydı var mı kontrol et
      const hasProfile = await checkUserProfileExist(user.id);
      if (hasProfile) {
        router.replace("/home-dashboard");
        return;
      }
    }
    // Yepyeni kullanıcı! İlk defa profil ve bütçe kuracak!
    useFinanceStore.getState().resetAllData();
    router.replace("/profile-setup" as any);
  };

  const handleEmailAuth = async () => {
    if (!emailVal.trim() || !passwordVal.trim()) {
      Alert.alert(
        language === "tr" ? "Eksik Bilgi" : "Missing Info",
        language === "tr" ? "Lütfen e-posta adresi ve şifrenizi girin." : "Please enter your email and password."
      );
      return;
    }

    if (passwordVal.length < 6) {
      Alert.alert(
        language === "tr" ? "Geçersiz Şifre" : "Invalid Password",
        language === "tr" ? "Şifreniz en az 6 karakter olmalıdır." : "Password must be at least 6 characters."
      );
      return;
    }

    triggerHaptic();
    setLoadingEmail(true);
    
    let result;
    if (emailMode === "signup") {
      result = await signUpWithEmail(emailVal, passwordVal);
    } else {
      result = await signInWithEmail(emailVal, passwordVal);
    }
    
    setLoadingEmail(false);

    if (result.success) {
      setIsEmailModalVisible(false);
      await routeUserAfterAuth(result.user);
    } else if (result.error) {
      Alert.alert(
        language === "tr" ? "Hata" : "Error",
        typeof result.error === "string" ? result.error : JSON.stringify(result.error)
      );
    }
  };

  // Auto login atlama kaldirildi. Uygulama her acildiginda Giris Sayfasinda kalacak.

  const handleGoogleLogin = async () => {
    triggerHaptic();
    setLoadingGoogle(true);
    const result = await signInWithGoogle();
    setLoadingGoogle(false);

    if (result.success) {
      await routeUserAfterAuth(result.user);
    } else if (result.error) {
      Alert.alert(
        language === "tr" ? "Giriş Hatası" : "Login Error",
        typeof result.error === "string" ? result.error : JSON.stringify(result.error)
      );
    }
  };

  const handleAppleLogin = async () => {
    triggerHaptic();
    setLoadingApple(true);
    const result = await signInWithApple();
    setLoadingApple(false);

    if (result.success) {
      await routeUserAfterAuth(result.user);
    } else {
      const msg = result.error || result.message || "Bilinmeyen bir hata oluştu";
      Alert.alert(
        language === "tr" ? "Apple Giriş Bilgisi" : "Apple Login Info",
        typeof msg === "string" ? msg : JSON.stringify(msg)
      );
    }
  };

  const continueToApp = () => routeUserAfterAuth();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerLangContainer}>
        <View style={styles.langSelectorWrap}>
          <Pressable 
            style={[styles.langBtn, language === "tr" && styles.langBtnActive]} 
            onPress={() => { triggerHaptic(); setLanguage("tr"); }}
          >
            <Text style={[styles.langText, language === "tr" && styles.langTextActive]}>TR</Text>
          </Pressable>
          <Pressable 
            style={[styles.langBtn, language === "en" && styles.langBtnActive]} 
            onPress={() => { triggerHaptic(); setLanguage("en"); }}
          >
            <Text style={[styles.langText, language === "en" && styles.langTextActive]}>EN</Text>
          </Pressable>
        </View>
      </View>
      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
          <View style={styles.hero}>
            <Image source={mascot} style={styles.mascot} resizeMode="contain" />
            <Text style={styles.title}>{t("loginTitle")}</Text>
            <Text style={styles.subtitle}>
              {language === "tr" ? "Paranı daha kolay yönet,\nhedeflerine daha hızlı ulaş." : "Manage your money easily,\nreach your goals faster."}
            </Text>
          </View>

          <View style={styles.actions}>
            <LoginButton 
              title={language === "tr" ? "Apple ile devam et" : "Continue with Apple"} 
              kind="apple" 
              onPress={handleAppleLogin}
              isLoading={loadingApple}
            />
            <LoginButton 
              title={language === "tr" ? "Google ile devam et" : "Continue with Google"} 
              kind="google" 
              onPress={handleGoogleLogin}
              isLoading={loadingGoogle}
            />
            <LoginButton 
              title={language === "tr" ? "E-posta ile devam et" : "Continue with Email"} 
              kind="email" 
              onPress={() => { triggerHaptic(); setEmailMode("signup"); setIsEmailModalVisible(true); }} 
            />
          </View>

          {/* Email Auth Modal */}
          <Modal
            visible={isEmailModalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setIsEmailModalVisible(false)}
          >
            <KeyboardAvoidingView 
              style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }} 
              behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
              <View style={{ backgroundColor: "#FFFFFF", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, borderWidth: 1, borderColor: "rgba(13,50,40,0.1)" }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <Text style={{ fontSize: 22, fontWeight: "900", color: "#0D3228" }}>
                    {emailMode === "signup" 
                      ? (language === "tr" ? "E-posta ile Kayıt Ol" : "Sign Up with Email")
                      : (language === "tr" ? "Hesabına Giriş Yap" : "Sign In to Your Account")}
                  </Text>
                  <Pressable onPress={() => setIsEmailModalVisible(false)}>
                    <Feather name="x" size={24} color="#66736E" />
                  </Pressable>
                </View>

                <Text style={{ fontSize: 13, fontWeight: "500", color: "#66736E", marginBottom: 20 }}>
                  {emailMode === "signup"
                    ? (language === "tr" ? "E-posta ve şifreni belirleyerek saniyeler içinde üye ol." : "Create your account in seconds with your email and password.")
                    : (language === "tr" ? "Kayıtlı e-posta adresin ve şifren ile hesabına bağlan." : "Sign in using your registered email and password.")}
                </Text>

                {/* Email Input */}
                <Text style={{ fontSize: 13, fontWeight: "800", color: "#0C1411", marginBottom: 6 }}>
                  {language === "tr" ? "E-posta Adresi" : "Email Address"}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#F8FAFC", borderWidth: 1.5, borderColor: "#E2E8F0", borderRadius: 14, paddingHorizontal: 14, height: 52, marginBottom: 14 }}>
                  <Feather name="mail" size={18} color="#0D3228" style={{ marginRight: 10 }} />
                  <TextInput
                    style={{ flex: 1, fontSize: 15, fontWeight: "600", color: "#0C1411" }}
                    placeholder="ornek@mail.com"
                    placeholderTextColor="#94A3B8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={emailVal}
                    onChangeText={setEmailVal}
                  />
                </View>

                {/* Password Input */}
                <Text style={{ fontSize: 13, fontWeight: "800", color: "#0C1411", marginBottom: 6 }}>
                  {language === "tr" ? "Şifre (En az 6 karakter)" : "Password (Min 6 chars)"}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#F8FAFC", borderWidth: 1.5, borderColor: "#E2E8F0", borderRadius: 14, paddingHorizontal: 14, height: 52, marginBottom: 22 }}>
                  <Feather name="lock" size={18} color="#0D3228" style={{ marginRight: 10 }} />
                  <TextInput
                    style={{ flex: 1, fontSize: 15, fontWeight: "600", color: "#0C1411" }}
                    placeholder="••••••••"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry
                    value={passwordVal}
                    onChangeText={setPasswordVal}
                  />
                </View>

                {/* Action Button */}
                <Pressable
                  style={{ height: 56, backgroundColor: "#0D3228", borderRadius: 16, alignItems: "center", justifyContent: "center", shadowColor: "#0D3228", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 4 }}
                  onPress={handleEmailAuth}
                  disabled={loadingEmail}
                >
                  <Text style={{ color: "#FFFFFF", fontSize: 17, fontWeight: "800" }}>
                    {loadingEmail 
                      ? (language === "tr" ? "İşleniyor..." : "Processing...") 
                      : emailMode === "signup"
                        ? (language === "tr" ? "Kayıt Ol ve Devam Et" : "Sign Up & Continue")
                        : (language === "tr" ? "Giriş Yap" : "Sign In")}
                  </Text>
                </Pressable>

                {/* Toggle link inside modal */}
                <Pressable 
                  style={{ marginTop: 16, alignItems: "center" }}
                  onPress={() => {
                    triggerHaptic();
                    setEmailMode(emailMode === "signup" ? "signin" : "signup");
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: "700", color: "#0D3228" }}>
                    {emailMode === "signup"
                      ? (language === "tr" ? "Zaten hesabın var mı? Giriş Yap" : "Already have an account? Sign In")
                      : (language === "tr" ? "Hesabın yok mu? Kayıt Ol" : "Don't have an account? Sign Up")}
                  </Text>
                </Pressable>
              </View>
            </KeyboardAvoidingView>
          </Modal>

          <View style={styles.legalBlock}>
            {language === "tr" ? (
              <Text style={styles.legalText}>
                Devam ederek{" "}
                <Text style={styles.legalLink} onPress={() => setLegalModalDoc(TERMS_OF_SERVICE)}>Kullanım Koşulları</Text>
                {" "}ve{" "}
                <Text style={styles.legalLink} onPress={() => setLegalModalDoc(PRIVACY_POLICY)}>Gizlilik Politikası</Text>
                {'\u2019'}nı kabul etmiş olursun.
              </Text>
            ) : (
              <Text style={styles.legalText}>
                By continuing, you agree to our{" "}
                <Text style={styles.legalLink} onPress={() => setLegalModalDoc(TERMS_OF_SERVICE)}>Terms of Service</Text>
                {" "}and{" "}
                <Text style={styles.legalLink} onPress={() => setLegalModalDoc(PRIVACY_POLICY)}>Privacy Policy</Text>.
              </Text>
            )}
          </View>

          <LegalModal
            visible={legalModalDoc !== null}
            doc={legalModalDoc}
            onClose={() => setLegalModalDoc(null)}
          />

          <View style={styles.trustRow}>
            <View style={styles.line} />
            <View style={styles.shieldWrap}>
              <Feather name="shield" size={23} color={colors.primary} />
              <Feather name="check" size={12} color={colors.primary} style={styles.checkIcon} />
            </View>
            <View style={styles.line} />
          </View>

          <Pressable 
            onPress={() => { triggerHaptic(); setEmailMode("signin"); setIsEmailModalVisible(true); }} 
            style={({ pressed }) => [styles.loginPrompt, pressed && styles.pressedText]}
          >
            <Text style={styles.loginMuted}>{language === "tr" ? "Zaten hesabın var mı? " : "Already have an account? "}</Text>
            <Text style={styles.loginLink}>{language === "tr" ? "Giriş yap" : "Log in"}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function LoginButton({ title, kind, onPress, isLoading }: LoginButtonProps) {
  const isEmail = kind === "email";

  return (
    <Pressable
      onPress={onPress}
      disabled={isLoading}
      style={({ pressed }) => [
        styles.button,
        isEmail ? styles.emailButton : styles.whiteButton,
        pressed && styles.buttonPressed,
        isLoading && { opacity: 0.7 }
      ]}
    >
      <View style={styles.iconSlot}>
        {isLoading ? (
          <ActivityIndicator size="small" color={isEmail ? colors.white : colors.primary} />
        ) : (
          <>
            {kind === "apple" ? <FontAwesome name="apple" size={30} color="#050505" /> : null}
            {kind === "google" ? <Image source={googleMark} style={styles.googleMark} resizeMode="contain" /> : null}
            {kind === "email" ? <Feather name="mail" size={29} color={colors.white} /> : null}
          </>
        )}
      </View>
      <Text style={[styles.buttonText, isEmail && styles.emailButtonText]}>{title}</Text>
      <View style={styles.iconSlot} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background
  },
  keyboard: {
    flex: 1
  },
  content: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingTop: 22,
    paddingBottom: 18
  },
  hero: {
    width: "100%",
    alignItems: "center"
  },
  mascot: {
    width: 184,
    height: 190,
    marginBottom: 16
  },
  title: {
    fontSize: 36,
    lineHeight: 42,
    fontWeight: "800",
    color: colors.primary,
    textAlign: "center"
  },
  subtitle: {
    marginTop: 10,
    fontSize: 16,
    lineHeight: 23,
    fontWeight: "500",
    color: colors.textMuted,
    textAlign: "center"
  },
  actions: {
    width: "100%",
    gap: 10,
    marginTop: 34
  },
  button: {
    width: "100%",
    minHeight: 52,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg
  },
  whiteButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "rgba(13,50,40,0.06)",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2
  },
  emailButton: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 3
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }]
  },
  iconSlot: {
    width: 48,
    alignItems: "center"
  },
  googleMark: {
    width: 26,
    height: 26
  },
  buttonText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    color: "#050505",
    fontWeight: "700",
    textAlign: "center"
  },
  emailButtonText: {
    color: colors.white
  },
  legalBlock: {
    marginTop: 28,
    paddingHorizontal: spacing.sm
  },
  legalText: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "600",
    color: colors.textMuted,
    textAlign: "center"
  },
  legalLink: {
    color: colors.primary,
    fontWeight: "700"
  },
  trustRow: {
    width: "100%",
    marginTop: 26,
    flexDirection: "row",
    alignItems: "center",
    gap: 18
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border
  },
  shieldWrap: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center"
  },
  checkIcon: {
    position: "absolute",
    top: 10
  },
  loginPrompt: {
    marginTop: 20,
    minHeight: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center"
  },
  pressedText: {
    opacity: 0.72
  },
  loginMuted: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600",
    color: "#747C78"
  },
  loginLink: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
    color: colors.primary
  },
  headerLangContainer: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 24,
    paddingTop: 10,
    zIndex: 10
  },
  langSelectorWrap: {
    flexDirection: "row",
    backgroundColor: "rgba(13,50,40,0.05)",
    borderRadius: 20,
    padding: 3,
    borderWidth: 1,
    borderColor: "rgba(13,50,40,0.06)"
  },
  langBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center"
  },
  langBtnActive: {
    backgroundColor: colors.primary
  },
  langText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primaryMuted
  },
  langTextActive: {
    color: colors.white
  }
});
