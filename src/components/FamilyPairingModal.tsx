import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  Share,
  Clipboard,
  Alert,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import Svg, { Rect } from "react-native-svg";
import { Feather } from "@expo/vector-icons";
import { useFinanceStore } from "@/store/financeStore";
import { darkColors, lightColors } from "@/theme";
import { generateQRMatrix } from "@/utils/qrCodeGenerator";

interface FamilyPairingModalProps {
  visible: boolean;
  onClose: () => void;
  initialTab?: "invite" | "join";
  onSuccessJoin?: () => void;
}

export function FamilyPairingModal({
  visible,
  onClose,
  initialTab = "invite",
  onSuccessJoin
}: FamilyPairingModalProps) {
  const isDarkMode = useFinanceStore((state) => state.isDarkMode);
  const language = useFinanceStore((state) => state.language);
  const themeColors = isDarkMode ? darkColors : lightColors;

  const familyGroup = useFinanceStore((state) => state.familyGroup);
  const pendingInviteCode = useFinanceStore((state) => state.pendingInviteCode);
  const generateInviteCode = useFinanceStore((state) => state.generateInviteCode);
  const joinFamilyGroup = useFinanceStore((state) => state.joinFamilyGroup);
  const leaveFamilyGroup = useFinanceStore((state) => state.leaveFamilyGroup);
  const userProfile = useFinanceStore((state) => state.userProfile);

  const [activeTab, setActiveTab] = useState<"invite" | "join">(initialTab);
  const [inputCode, setInputCode] = useState("");
  const [partnerNameInput, setPartnerNameInput] = useState("");
  const [localCode, setLocalCode] = useState<string | null>(null);

  const currentInviteCode = familyGroup?.inviteCode || pendingInviteCode || localCode;

  const handleCreateCode = () => {
    const code = generateInviteCode();
    setLocalCode(code);
  };

  const handleShareCode = async () => {
    if (!currentInviteCode) return;
    try {
      await Share.share({
        message: language === "tr"
          ? `Birikim Yap uygulamasına katılarak benimle ortak aile bütçesi oluşturabilirsin! Aile Katılım Kodum: ${currentInviteCode}`
          : `Join me on Birikim Yap to manage our shared family budget! Family Join Code: ${currentInviteCode}`
      });
    } catch (e) {
      // Handle share error
    }
  };

  const handleCopyCode = () => {
    if (!currentInviteCode) return;
    Clipboard.setString(currentInviteCode);
    Alert.alert(
      language === "tr" ? "Kopyalandı 📋" : "Copied 📋",
      language === "tr" ? "Aile katılım kodu panoya kopyalandı." : "Family join code copied to clipboard."
    );
  };

  const handleJoin = () => {
    if (!inputCode.trim()) {
      Alert.alert(
        language === "tr" ? "Uyarı" : "Warning",
        language === "tr" ? "Lütfen 6 haneli aile kodunu girin." : "Please enter the family code."
      );
      return;
    }

    const res = joinFamilyGroup(inputCode, partnerNameInput.trim() || undefined);
    if (res.success) {
      Alert.alert(
        language === "tr" ? "Tebrikler! 🎉" : "Congratulations! 🎉",
        language === "tr" ? "Çift / Aile bütçesine başarıyla katıldınız." : "Successfully joined the family budget.",
        [{
          text: "Tamam",
          onPress: () => {
            onClose();
            if (onSuccessJoin) {
              onSuccessJoin();
            }
          }
        }]
      );
    } else {
      Alert.alert(
        language === "tr" ? "Hata" : "Error",
        res.error || (language === "tr" ? "Eşleşme başarısız." : "Pairing failed.")
      );
    }
  };

  const handleLeave = () => {
    Alert.alert(
      language === "tr" ? "Çift Hesabından Ayrıl" : "Leave Family Account",
      language === "tr"
        ? "Çift bütçesinden ayrılmak istediğinize emin misiniz? Bütçeniz kişisel moda dönecektir."
        : "Are you sure you want to leave the shared family budget?",
      [
        { text: language === "tr" ? "İptal" : "Cancel", style: "cancel" },
        {
          text: language === "tr" ? "Evet, Ayrıl" : "Yes, Leave",
          style: "destructive",
          onPress: () => {
            leaveFamilyGroup();
            setLocalCode(null);
            onClose();
          }
        }
      ]
    );
  };

  // Render Real Scannable SVG QR Code
  const qrMatrix = currentInviteCode ? generateQRMatrix(currentInviteCode) : null;
  const qrCellSize = 6;
  const qrDimensions = qrMatrix ? qrMatrix.length * qrCellSize : 150;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "flex-end" }}
      >
        <View style={{
          backgroundColor: isDarkMode ? "#0F261F" : "#FFFFFF",
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          padding: 20,
          maxHeight: "90%",
          borderColor: isDarkMode ? "rgba(0, 223, 137, 0.3)" : "rgba(13, 50, 40, 0.15)",
          borderWidth: 1.5
        }}>
          {/* Header Drag Handle */}
          <View style={{ width: 38, height: 5, borderRadius: 2.5, backgroundColor: isDarkMode ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)", alignSelf: "center", marginBottom: 16 }} />

          {/* Header Title */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(0,229,143,0.15)", alignItems: "center", justifyContent: "center" }}>
                <Feather name="users" size={20} color="#00E58F" />
              </View>
              <View>
                <Text style={{ fontSize: 18, fontWeight: "900", color: themeColors.text }}>
                  {language === "tr" ? "Çift & Aile Hesabı" : "Couple & Family Budget"}
                </Text>
                <Text style={{ fontSize: 11, fontWeight: "600", color: themeColors.textMuted }}>
                  {language === "tr" ? "Eşinizle harcamalarınızı ortak yönetin" : "Manage shared expenses together"}
                </Text>
              </View>
            </View>
            <Pressable onPress={onClose} style={{ padding: 6 }}>
              <Feather name="x" size={22} color={themeColors.textMuted} />
            </Pressable>
          </View>

          {/* Active Family Group View */}
          {familyGroup ? (
            <View style={{ gap: 16, paddingVertical: 10 }}>
              <View style={{
                backgroundColor: isDarkMode ? "rgba(0, 229, 143, 0.1)" : "#ECFDF5",
                borderRadius: 20,
                padding: 16,
                borderColor: "rgba(0, 229, 143, 0.35)",
                borderWidth: 1.5,
                gap: 10
              }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ fontSize: 15, fontWeight: "900", color: themeColors.text }}>
                    {familyGroup.name}
                  </Text>
                  <View style={{ backgroundColor: "rgba(0,229,143,0.2)", paddingHorizontal: 9, paddingVertical: 3, borderRadius: 8 }}>
                    <Text style={{ fontSize: 10, fontWeight: "900", color: isDarkMode ? "#00E58F" : "#046C4E" }}>
                      🟢 {language === "tr" ? "AKTİF" : "ACTIVE"}
                    </Text>
                  </View>
                </View>

                <View style={{ gap: 6, marginTop: 4 }}>
                  <Text style={{ fontSize: 11, fontWeight: "800", color: themeColors.textMuted }}>
                    👥 {language === "tr" ? "Bütçe Üyeleri:" : "Budget Members:"}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <View style={{ backgroundColor: isDarkMode ? "rgba(255,255,255,0.08)" : "#F1F5F9", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={{ fontSize: 12 }}>👨🏻</Text>
                      <Text style={{ fontSize: 12, fontWeight: "800", color: themeColors.text }}>
                        {familyGroup.ownerName} ({language === "tr" ? "Kurucu" : "Owner"})
                      </Text>
                    </View>
                    <View style={{ backgroundColor: isDarkMode ? "rgba(255,255,255,0.08)" : "#F1F5F9", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={{ fontSize: 12 }}>👩🏻</Text>
                      <Text style={{ fontSize: 12, fontWeight: "800", color: themeColors.text }}>
                        {familyGroup.partnerName || (language === "tr" ? "Eşiniz" : "Partner")}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={{ backgroundColor: isDarkMode ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.6)", borderRadius: 12, padding: 10, marginTop: 4, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: themeColors.textMuted }}>
                    {language === "tr" ? "Aile Katılım Kodu:" : "Family Join Code:"}
                  </Text>
                  <Text style={{ fontSize: 14, fontWeight: "900", color: "#00E58F", letterSpacing: 1 }}>
                    {familyGroup.inviteCode}
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={handleLeave}
                style={{
                  backgroundColor: "rgba(239, 68, 68, 0.12)",
                  borderColor: "rgba(239, 68, 68, 0.3)",
                  borderWidth: 1.2,
                  paddingVertical: 14,
                  borderRadius: 16,
                  alignItems: "center"
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: "900", color: "#EF4444" }}>
                  🚨 {language === "tr" ? "Çift Hesabından Ayrıl" : "Leave Family Account"}
                </Text>
              </Pressable>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Tab Selector */}
              <View style={{ flexDirection: "row", backgroundColor: isDarkMode ? "rgba(255,255,255,0.06)" : "#F1F5F9", borderRadius: 14, padding: 4, marginBottom: 20 }}>
                <Pressable
                  onPress={() => setActiveTab("invite")}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    alignItems: "center",
                    borderRadius: 10,
                    backgroundColor: activeTab === "invite" ? (isDarkMode ? "#00E58F" : "#046C4E") : "transparent"
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: "900", color: activeTab === "invite" ? (isDarkMode ? "#031D14" : "#FFFFFF") : themeColors.textMuted }}>
                    📲 {language === "tr" ? "QR / Davet Et" : "QR / Invite"}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setActiveTab("join")}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    alignItems: "center",
                    borderRadius: 10,
                    backgroundColor: activeTab === "join" ? (isDarkMode ? "#00E58F" : "#046C4E") : "transparent"
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: "900", color: activeTab === "join" ? (isDarkMode ? "#031D14" : "#FFFFFF") : themeColors.textMuted }}>
                    🔑 {language === "tr" ? "Koda Katıl" : "Join Code"}
                  </Text>
                </Pressable>
              </View>

              {activeTab === "invite" ? (
                <View style={{ alignItems: "center", gap: 16, paddingVertical: 10 }}>
                  {!currentInviteCode ? (
                    <View style={{ alignItems: "center", gap: 14, paddingVertical: 20 }}>
                      <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: "rgba(0,229,143,0.12)", alignItems: "center", justifyContent: "center" }}>
                        <Feather name="grid" size={32} color="#00E58F" />
                      </View>
                      <Text style={{ fontSize: 15, fontWeight: "800", color: themeColors.text, textAlign: "center" }}>
                        {language === "tr" ? "Henüz Bir Davet Kodu Oluşturulmadı" : "No Join Code Generated Yet"}
                      </Text>
                      <Text style={{ fontSize: 12, color: themeColors.textMuted, textAlign: "center", paddingHorizontal: 20 }}>
                        {language === "tr" ? "Aşağıdaki butona basarak eşinizin okutabileceği canlı QR kodu ve 6 haneli aile kodunu oluşturun." : "Generate a live QR code and 6-digit family code for your partner to scan."}
                      </Text>

                      <Pressable
                        onPress={handleCreateCode}
                        style={{
                          backgroundColor: isDarkMode ? "#00E58F" : "#046C4E",
                          paddingHorizontal: 20,
                          paddingVertical: 14,
                          borderRadius: 16,
                          marginTop: 10,
                          shadowColor: "#00E58F",
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.3,
                          shadowRadius: 10,
                          elevation: 4
                        }}
                      >
                        <Text style={{ fontSize: 14, fontWeight: "900", color: isDarkMode ? "#031D14" : "#FFFFFF" }}>
                          ✨ {language === "tr" ? "QR Kod & Davet Kodu Oluştur" : "Generate QR & Join Code"}
                        </Text>
                      </Pressable>
                    </View>
                  ) : (
                    <>
                      {/* REAL SCANNABLE SVG QR CODE */}
                      <View style={{
                        borderRadius: 24,
                        backgroundColor: "#FFFFFF",
                        padding: 16,
                        alignItems: "center",
                        justifyContent: "center",
                        shadowColor: "#00E58F",
                        shadowOffset: { width: 0, height: 6 },
                        shadowOpacity: 0.25,
                        shadowRadius: 14,
                        elevation: 5,
                        borderWidth: 3,
                        borderColor: "#00E58F"
                      }}>
                        {qrMatrix && (
                          <Svg width={qrDimensions} height={qrDimensions}>
                            {qrMatrix.map((row, r) =>
                              row.map((cell, c) =>
                                cell ? (
                                  <Rect
                                    key={`${r}-${c}`}
                                    x={c * qrCellSize}
                                    y={r * qrCellSize}
                                    width={qrCellSize}
                                    height={qrCellSize}
                                    fill="#031D14"
                                  />
                                ) : null
                              )
                            )}
                          </Svg>
                        )}
                      </View>

                      <View style={{ alignItems: "center", gap: 4 }}>
                        <Text style={{ fontSize: 12, fontWeight: "700", color: themeColors.textMuted }}>
                          {language === "tr" ? "Eşinizin taraması için Canlı QR & Davet Kodu:" : "Scan QR code or use join code:"}
                        </Text>
                        <Text style={{ fontSize: 26, fontWeight: "900", color: isDarkMode ? "#00E58F" : "#046C4E", letterSpacing: 2 }}>
                          {currentInviteCode}
                        </Text>
                      </View>

                      <View style={{ flexDirection: "row", gap: 12, width: "100%", marginTop: 10 }}>
                        <Pressable
                          onPress={handleCopyCode}
                          style={{
                            flex: 1,
                            backgroundColor: isDarkMode ? "rgba(255,255,255,0.08)" : "#F1F5F9",
                            paddingVertical: 12,
                            borderRadius: 14,
                            alignItems: "center",
                            flexDirection: "row",
                            justifyContent: "center",
                            gap: 6
                          }}
                        >
                          <Feather name="copy" size={16} color={themeColors.text} />
                          <Text style={{ fontSize: 12.5, fontWeight: "800", color: themeColors.text }}>
                            {language === "tr" ? "Kodu Kopyala" : "Copy Code"}
                          </Text>
                        </Pressable>

                        <Pressable
                          onPress={handleShareCode}
                          style={{
                            flex: 1,
                            backgroundColor: isDarkMode ? "#00E58F" : "#046C4E",
                            paddingVertical: 12,
                            borderRadius: 14,
                            alignItems: "center",
                            flexDirection: "row",
                            justifyContent: "center",
                            gap: 6
                          }}
                        >
                          <Feather name="share-2" size={16} color={isDarkMode ? "#031D14" : "#FFFFFF"} />
                          <Text style={{ fontSize: 12.5, fontWeight: "900", color: isDarkMode ? "#031D14" : "#FFFFFF" }}>
                            {language === "tr" ? "Paylaş 📲" : "Share 📲"}
                          </Text>
                        </Pressable>
                      </View>
                    </>
                  )}
                </View>
              ) : (
                <View style={{ gap: 14, paddingVertical: 10 }}>
                  <Text style={{ fontSize: 12.5, fontWeight: "700", color: themeColors.textMuted }}>
                    {language === "tr"
                      ? "Eşinizin oluşturduğu 6 haneli Aile Katılım Kodunu girin:"
                      : "Enter 6-digit family code from your partner:"}
                  </Text>

                  <TextInput
                    value={inputCode}
                    onChangeText={setInputCode}
                    placeholder="Örn: BRK-8921"
                    placeholderTextColor={themeColors.textMuted}
                    autoCapitalize="characters"
                    style={{
                      backgroundColor: isDarkMode ? "rgba(255,255,255,0.06)" : "#F8FAFC",
                      borderColor: isDarkMode ? "rgba(0,223,137,0.3)" : "rgba(0,0,0,0.12)",
                      borderWidth: 1.5,
                      borderRadius: 16,
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      fontSize: 18,
                      fontWeight: "900",
                      color: themeColors.text,
                      textAlign: "center",
                      letterSpacing: 2
                    }}
                  />

                  <TextInput
                    value={partnerNameInput}
                    onChangeText={setPartnerNameInput}
                    placeholder={language === "tr" ? "İsminiz (Opsiyonel)" : "Your Name (Optional)"}
                    placeholderTextColor={themeColors.textMuted}
                    style={{
                      backgroundColor: isDarkMode ? "rgba(255,255,255,0.06)" : "#F8FAFC",
                      borderColor: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
                      borderWidth: 1.2,
                      borderRadius: 16,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      fontSize: 14,
                      fontWeight: "700",
                      color: themeColors.text
                    }}
                  />

                  <Pressable
                    onPress={handleJoin}
                    style={{
                      backgroundColor: isDarkMode ? "#00E58F" : "#046C4E",
                      paddingVertical: 14,
                      borderRadius: 16,
                      alignItems: "center",
                      marginTop: 8
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: "900", color: isDarkMode ? "#031D14" : "#FFFFFF" }}>
                      👥 {language === "tr" ? "Aile Bütçesine Katıl" : "Join Family Budget"}
                    </Text>
                  </Pressable>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
