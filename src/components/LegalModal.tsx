import React from "react";
import { Modal, View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LegalDoc } from "@/utils/legalTexts";
import { useFinanceStore } from "@/store/financeStore";
import { darkColors, lightColors } from "@/theme/colors";

interface LegalModalProps {
  visible: boolean;
  onClose: () => void;
  doc: LegalDoc | null;
}

export function LegalModal({ visible, onClose, doc }: LegalModalProps) {
  const isDarkMode = useFinanceStore((state) => state.isDarkMode);
  const language = useFinanceStore((state) => state.language);
  const themeColors = isDarkMode ? darkColors : lightColors;

  if (!doc) return null;

  const title = doc.title[language] || doc.title.tr;
  const content = doc.content[language] || doc.content.tr;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.container, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
              <View style={[styles.iconWrap, { backgroundColor: isDarkMode ? "rgba(0,229,143,0.12)" : "#EAF5F0" }]}>
                <Feather name="file-text" size={18} color="#00E58F" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: themeColors.text }]} numberOfLines={1}>{title}</Text>
                <Text style={[styles.subtitle, { color: themeColors.textMuted }]}>
                  {language === "tr" ? `Son Güncelleme: ${doc.lastUpdated}` : `Last Updated: ${doc.lastUpdated}`}
                </Text>
              </View>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={22} color={themeColors.textMuted} />
            </Pressable>
          </View>

          {/* Content */}
          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 16 }}>
            <Text style={[styles.contentText, { color: themeColors.text }]}>
              {content}
            </Text>
          </ScrollView>

          {/* Footer Action */}
          <View style={[styles.footer, { borderTopColor: themeColors.border }]}>
            <Pressable
              onPress={onClose}
              style={[styles.confirmBtn, { backgroundColor: "#00E58F" }]}
            >
              <Text style={styles.confirmBtnText}>
                {language === "tr" ? "Anladım, Kapat" : "Got it, Close"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  container: {
    height: "82%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "900",
  },
  subtitle: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  scroll: {
    flex: 1,
  },
  contentText: {
    fontSize: 13.5,
    lineHeight: 22,
    fontWeight: "500",
  },
  footer: {
    paddingTop: 14,
    borderTopWidth: 1,
  },
  confirmBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#031D14",
  },
});
