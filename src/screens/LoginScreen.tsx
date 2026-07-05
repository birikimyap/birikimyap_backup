import { Feather, FontAwesome } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, spacing, typography } from "@/theme";

type LoginButtonProps = {
  title: string;
  kind: "apple" | "google" | "email";
  onPress: () => void;
};

const mascot = require("../../pgn/mascot-cutout.png");
const googleMark = require("../../pgn/google-mark.png");

export default function LoginScreen() {
  const continueToApp = () => router.push("/intro");

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
          <View style={styles.hero}>
            <Image source={mascot} style={styles.mascot} resizeMode="contain" />
            <Text style={styles.title}>Birikim Yap</Text>
            <Text style={styles.subtitle}>Paranı daha kolay yönet,{"\n"}hedeflerine daha hızlı ulaş.</Text>
          </View>

          <View style={styles.actions}>
            <LoginButton title="Apple ile devam et" kind="apple" onPress={continueToApp} />
            <LoginButton title="Google ile devam et" kind="google" onPress={continueToApp} />
            <LoginButton title="E-posta ile devam et" kind="email" onPress={continueToApp} />
          </View>

          <View style={styles.legalBlock}>
            <Text style={styles.legalText}>
              Devam ederek <Text style={styles.legalLink}>Kullanım Şartları</Text> ve{"\n"}
              <Text style={styles.legalLink}>Gizlilik Politikası</Text>’nı kabul etmiş olursun.
            </Text>
          </View>

          <View style={styles.trustRow}>
            <View style={styles.line} />
            <View style={styles.shieldWrap}>
              <Feather name="shield" size={23} color={colors.primary} />
              <Feather name="check" size={12} color={colors.primary} style={styles.checkIcon} />
            </View>
            <View style={styles.line} />
          </View>

          <Pressable onPress={continueToApp} style={({ pressed }) => [styles.loginPrompt, pressed && styles.pressedText]}>
            <Text style={styles.loginMuted}>Zaten hesabın var mı? </Text>
            <Text style={styles.loginLink}>Giriş yap</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function LoginButton({ title, kind, onPress }: LoginButtonProps) {
  const isEmail = kind === "email";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        isEmail ? styles.emailButton : styles.whiteButton,
        pressed && styles.buttonPressed
      ]}
    >
      <View style={styles.iconSlot}>
        {kind === "apple" ? <FontAwesome name="apple" size={30} color="#050505" /> : null}
        {kind === "google" ? <Image source={googleMark} style={styles.googleMark} resizeMode="contain" /> : null}
        {kind === "email" ? <Feather name="mail" size={29} color={colors.white} /> : null}
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
  }
});
