import React from "react";
import { Modal, Pressable, StyleSheet, Text, View, Share } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { formatCurrency } from "@/utils/currency";

interface ShareableReportCardProps {
  visible: boolean;
  onClose: () => void;
  period: "weekly" | "monthly";
  totalSpent: number;
  totalLimit: number;
  totalSaved: number;
  userName: string;
  language: "tr" | "en";
}

export function ShareableReportCard({
  visible,
  onClose,
  period,
  totalSpent,
  totalLimit,
  totalSaved,
  userName,
  language
}: ShareableReportCardProps) {
  const isWeekly = period === "weekly";
  const periodTitle = isWeekly 
    ? (language === "tr" ? "HAFTALIK BİRİKİM KARNEM" : "WEEKLY SAVINGS REPORT") 
    : (language === "tr" ? "AYLIK BİRİKİM KARNEM" : "MONTHLY SAVINGS REPORT");

  const successRate = totalLimit > 0 ? Math.min(Math.round(((totalLimit - totalSpent) / totalLimit) * 100), 100) : 100;
  const isBudgetSuccess = totalSpent <= totalLimit;

  const handleShare = async () => {
    try {
      const shareMessage = language === "tr"
        ? `🚀 Birikim Yap ile bu ${isWeekly ? "hafta" : "ay"} bütçemi %${Math.max(successRate, 0)} korudum ve ${formatCurrency(totalSaved)} biriktirdim! 💰\n\nSen de bütçeni yönet, birikim yap!`
        : `🚀 Kept my budget with %${Math.max(successRate, 0)} efficiency and saved ${formatCurrency(totalSaved)} using Birikim Yap! 💰`;

      await Share.share({
        message: shareMessage,
        title: periodTitle
      });
    } catch (err) {
      console.log("Share error:", err);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <LinearGradient
          colors={["#0B2B22", "#05130E"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          {/* Header Badge */}
          <View style={styles.topBadge}>
            <Text style={styles.topBadgeText}>✨ BİRİKİM YAP PERFORMANCE</Text>
          </View>

          <Text style={styles.titleText}>{periodTitle}</Text>
          <Text style={styles.userText}>👤 {userName || (language === "tr" ? "Kullanıcı" : "User")}</Text>

          {/* Key Stats Box */}
          <View style={styles.statsContainer}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>{language === "tr" ? "Toplam Harcama" : "Total Spent"}</Text>
              <Text style={[styles.statValue, { color: "#FF6B6B" }]}>{formatCurrency(totalSpent)}</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statRow}>
              <Text style={styles.statLabel}>{language === "tr" ? "Korumalı Bütçe" : "Budget Limit"}</Text>
              <Text style={styles.statValue}>{formatCurrency(totalLimit)}</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statRow}>
              <Text style={styles.statLabel}>{language === "tr" ? "Tahmini Birikim" : "Savings"}</Text>
              <Text style={[styles.statValue, { color: "#00E58F" }]}>{formatCurrency(totalSaved)}</Text>
            </View>
          </View>

          {/* Success Status Pill */}
          <View style={[styles.statusPill, { backgroundColor: isBudgetSuccess ? "rgba(0, 229, 143, 0.15)" : "rgba(239, 68, 68, 0.15)", borderColor: isBudgetSuccess ? "#00E58F" : "#EF4444" }]}>
            <Feather name={isBudgetSuccess ? "check-circle" : "alert-circle"} size={16} color={isBudgetSuccess ? "#00E58F" : "#EF4444"} />
            <Text style={[styles.statusText, { color: isBudgetSuccess ? "#00E58F" : "#EF4444" }]}>
              {isBudgetSuccess 
                ? (language === "tr" ? "🏆 Bütçe Başarıyla Korundu!" : "🏆 Budget Kept Successfully!") 
                : (language === "tr" ? "⚠️ Bütçe Sınırı Aşıldı" : "⚠️ Budget Limit Exceeded")}
            </Text>
          </View>

          {/* Share Action Button */}
          <Pressable style={styles.shareBtn} onPress={handleShare}>
            <LinearGradient colors={["#00DF89", "#00A362"]} style={styles.btnGradient}>
              <Feather name="share-2" size={18} color="#031D14" />
              <Text style={styles.shareBtnText}>{language === "tr" ? "KARNEYİ PAYLAŞ 📸" : "SHARE REPORT 📸"}</Text>
            </LinearGradient>
          </Pressable>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20
  },
  card: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: "rgba(0, 229, 143, 0.4)",
    padding: 24,
    alignItems: "center"
  },
  topBadge: {
    backgroundColor: "rgba(0, 229, 143, 0.15)",
    borderColor: "rgba(0, 229, 143, 0.35)",
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12
  },
  topBadgeText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#00E58F",
    letterSpacing: 1
  },
  titleText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 4
  },
  userText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#A7B5AF",
    marginBottom: 18
  },
  statsContainer: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    marginBottom: 16
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6
  },
  statLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#C1D1C9"
  },
  statValue: {
    fontSize: 15,
    fontWeight: "900",
    color: "#FFFFFF"
  },
  statDivider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    marginVertical: 4
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    marginBottom: 20
  },
  statusText: {
    fontSize: 12,
    fontWeight: "900"
  },
  shareBtn: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden"
  },
  btnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14
  },
  shareBtnText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#031D14"
  }
});
