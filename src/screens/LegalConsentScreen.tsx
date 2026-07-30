import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { useFinanceStore } from "@/store/financeStore";
import { LegalModal } from "@/components/LegalModal";
import { TERMS_OF_SERVICE, PRIVACY_POLICY, LegalDoc } from "@/utils/legalTexts";

export default function LegalConsentScreen() {
  const language = useFinanceStore((state) => state.language);

  const [step, setStep] = useState<"terms" | "privacy">("terms");
  const [termsRead, setTermsRead] = useState(false);
  const [privacyRead, setPrivacyRead] = useState(false);
  const [legalModalDoc, setLegalModalDoc] = useState<LegalDoc | null>(null);

  const isTermsStep = step === "terms";
  const canContinue = isTermsStep ? termsRead : privacyRead;

  const handleContinue = () => {
    if (isTermsStep) {
      setStep("privacy");
    } else {
      router.push("/income");
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Progress dots */}
      <View style={styles.progressRow}>
        <View style={[styles.dot, isTermsStep ? styles.dotActive : styles.dotDone]}>
          {!isTermsStep && <Feather name="check" size={12} color="#031D14" />}
        </View>
        <View style={[styles.line, !isTermsStep && styles.lineDone]} />
        <View style={[styles.dot, !isTermsStep ? styles.dotActive : styles.dotPending]} />
      </View>

      {/* Step label */}
      <View style={styles.stepLabel}>
        <Text style={styles.stepNum}>
          {isTermsStep ? "1 / 2" : "2 / 2"}
        </Text>
        <Text style={styles.stepTitle}>
          {isTermsStep
            ? (language === "tr" ? "Kullanım Koşulları" : "Terms of Service")
            : (language === "tr" ? "Gizlilik Politikası" : "Privacy Policy")}
        </Text>
        <Text style={styles.stepSub}>
          {language === "tr"
            ? "Lütfen aşağıdaki metni okuyun ve onaylayın."
            : "Please read and accept the text below."}
        </Text>
      </View>

      {/* Document preview scroll */}
      <ScrollView
        style={styles.docScroll}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.docCard}>
          <Text style={styles.docTitle}>
            {isTermsStep
              ? (language === "tr" ? TERMS_OF_SERVICE.title.tr : TERMS_OF_SERVICE.title.en)
              : (language === "tr" ? PRIVACY_POLICY.title.tr : PRIVACY_POLICY.title.en)}
          </Text>
          <Text style={styles.docDate}>
            {language === "tr" ? `Son Güncelleme: ` : `Last Updated: `}
            {isTermsStep ? TERMS_OF_SERVICE.lastUpdated : PRIVACY_POLICY.lastUpdated}
          </Text>
          <Text style={styles.docBody}>
            {isTermsStep
              ? (language === "tr" ? TERMS_OF_SERVICE.content.tr : TERMS_OF_SERVICE.content.en)
              : (language === "tr" ? PRIVACY_POLICY.content.tr : PRIVACY_POLICY.content.en)}
          </Text>

          {/* Read Full */}
          <Pressable
            style={styles.readFullBtn}
            onPress={() => setLegalModalDoc(isTermsStep ? TERMS_OF_SERVICE : PRIVACY_POLICY)}
          >
            <Feather name="maximize" size={14} color="#00E58F" />
            <Text style={styles.readFullText}>
              {language === "tr" ? "Tam ekran oku" : "Read full screen"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Accept checkbox + Continue */}
      <View style={styles.footer}>
        <Pressable
          style={styles.checkRow}
          onPress={() => isTermsStep ? setTermsRead(!termsRead) : setPrivacyRead(!privacyRead)}
        >
          <View style={[styles.checkbox, canContinue && styles.checkboxChecked]}>
            {canContinue && <Feather name="check" size={14} color="#031D14" />}
          </View>
          <Text style={styles.checkText}>
            {isTermsStep
              ? (language === "tr" ? "Kullanım Koşulları'nı okudum ve kabul ediyorum." : "I have read and accept the Terms of Service.")
              : (language === "tr" ? "Gizlilik Politikası'nı okudum ve kabul ediyorum." : "I have read and accept the Privacy Policy.")}
          </Text>
        </Pressable>

        <Pressable
          onPress={handleContinue}
          disabled={!canContinue}
          style={[styles.ctaWrap, !canContinue && { opacity: 0.35 }]}
        >
          <LinearGradient
            colors={["#00E58F", "#00BF76", "#048052"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cta}
          >
            <Text style={styles.ctaText}>
              {isTermsStep
                ? (language === "tr" ? "Kabul et ve devam et →" : "Accept and continue →")
                : (language === "tr" ? "Kabul et ve başla →" : "Accept and get started →")}
            </Text>
          </LinearGradient>
        </Pressable>
      </View>

      <LegalModal
        visible={legalModalDoc !== null}
        doc={legalModalDoc}
        onClose={() => setLegalModalDoc(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#061810",
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 20,
    paddingHorizontal: 60,
    gap: 0,
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  dotActive: {
    borderColor: "#00E58F",
    backgroundColor: "#00E58F",
  },
  dotDone: {
    borderColor: "#00E58F",
    backgroundColor: "#00E58F",
  },
  dotPending: {
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "transparent",
  },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginHorizontal: 8,
  },
  lineDone: {
    backgroundColor: "#00E58F",
  },
  stepLabel: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 8,
    gap: 4,
  },
  stepNum: {
    fontSize: 11,
    fontWeight: "800",
    color: "#00E58F",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  stepTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  stepSub: {
    fontSize: 13,
    fontWeight: "500",
    color: "rgba(255,255,255,0.55)",
    marginTop: 2,
  },
  docScroll: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: 12,
  },
  docCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 20,
    gap: 12,
  },
  docTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#00E58F",
  },
  docDate: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.4)",
    marginTop: -6,
  },
  docBody: {
    fontSize: 13,
    lineHeight: 21,
    fontWeight: "500",
    color: "rgba(255,255,255,0.75)",
  },
  readFullBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "rgba(0,229,143,0.08)",
    borderWidth: 1,
    borderColor: "rgba(0,229,143,0.2)",
    marginTop: 4,
  },
  readFullText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#00E58F",
  },
  footer: {
    padding: 20,
    paddingBottom: 28,
    gap: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.25)",
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 1,
  },
  checkboxChecked: {
    borderColor: "#00E58F",
    backgroundColor: "#00E58F",
  },
  checkText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "600",
    color: "rgba(255,255,255,0.85)",
  },
  ctaWrap: {
    borderRadius: 16,
    overflow: "hidden",
  },
  cta: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: {
    fontSize: 17,
    fontWeight: "900",
    color: "#031D14",
  },
});
