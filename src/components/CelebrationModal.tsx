import React from "react";
import { Modal, Pressable, StyleSheet, Text, View, Animated } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SYSTEM_BADGES } from "@/utils/badges";

interface CelebrationModalProps {
  visible: boolean;
  onClose: () => void;
  type: "streak" | "badge" | "goal";
  title?: string;
  subtitle?: string;
  badgeId?: string;
  streakCount?: number;
  xpEarned?: number;
}

export function CelebrationModal({
  visible,
  onClose,
  type,
  title,
  subtitle,
  badgeId,
  streakCount,
  xpEarned = 50
}: CelebrationModalProps) {
  const badgeInfo = SYSTEM_BADGES.find((b) => b.id === badgeId);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        
        <LinearGradient
          colors={["#0D3228", "#091712"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          {/* Glowing Top Badge / Icon */}
          <View style={styles.iconCircle}>
            {type === "streak" ? (
              <Text style={{ fontSize: 36 }}>🔥</Text>
            ) : type === "badge" ? (
              <Feather name={badgeInfo?.icon || "award"} size={36} color={badgeInfo?.color || "#00E58F"} />
            ) : (
              <Text style={{ fontSize: 36 }}>🎉</Text>
            )}
          </View>

          {/* Title & Badge Header */}
          <Text style={styles.headerText}>
            {type === "streak" ? "KAYIT SERİSİ ARTTI!" : type === "badge" ? "YENİ ROZET KAZANDIN!" : "TEBRİKLER!"}
          </Text>

          <Text style={styles.titleText}>
            {title || (type === "streak" ? `${streakCount || 1} GÜN KESİNTİSİZ SERİ! 🔥` : badgeInfo?.titleTr || "Harika Başarı!")}
          </Text>

          <Text style={styles.subtext}>
            {subtitle || (type === "streak" ? "Düzenli harcama ve bütçe takibi yaparak finansal disiplinini koruyorsun!" : badgeInfo?.descTr || "Harika gidiyorsun, hedeflerine bir adım daha yaklaştın!")}
          </Text>

          {/* XP Reward Pill */}
          {xpEarned > 0 && (
            <View style={styles.xpPill}>
              <Text style={styles.xpText}>⚡ +{xpEarned} XP KAZANDIN</Text>
            </View>
          )}

          <Pressable style={({ pressed }) => [styles.actionButton, pressed && { opacity: 0.85 }]} onPress={onClose}>
            <LinearGradient
              colors={["#00DF89", "#00A362"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientBtn}
            >
              <Text style={styles.btnText}>HARİKA, DEVAM ET! 🚀</Text>
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
    borderWidth: 1.8,
    borderColor: "rgba(0, 229, 143, 0.4)",
    padding: 24,
    alignItems: "center",
    shadowColor: "#00E58F",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "rgba(0, 229, 143, 0.15)",
    borderWidth: 2,
    borderColor: "#00E58F",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#00E58F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5
  },
  headerText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#00E58F",
    letterSpacing: 1.2,
    marginBottom: 6,
    textTransform: "uppercase"
  },
  titleText: {
    fontSize: 20,
    fontWeight: "900",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 8
  },
  subtext: {
    fontSize: 13,
    fontWeight: "600",
    color: "#A7B5AF",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 18
  },
  xpPill: {
    backgroundColor: "rgba(245, 158, 11, 0.16)",
    borderColor: "rgba(245, 158, 11, 0.4)",
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 20
  },
  xpText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#F59E0B"
  },
  actionButton: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden"
  },
  gradientBtn: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center"
  },
  btnText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#031D14",
    letterSpacing: 0.5
  }
});
