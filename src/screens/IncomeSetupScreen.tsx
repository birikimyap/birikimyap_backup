import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

import { useFinanceStore } from "@/store/financeStore";
import { colors, radius } from "@/theme";
import { parseAmount } from "@/utils/currency";
import { translations } from "@/utils/translations";

type EditableIncomeRow = {
  id: string;
  title: string;
  subtitle: string;
  amount: string;
};

type IncomeListItem = EditableIncomeRow & {
  icon: keyof typeof Feather.glyphMap;
  tone: "green" | "blue" | "gold";
  isDefault: boolean;
};

type IncomeRowProps = IncomeListItem & {
  onChangeTitle: (value: string) => void;
  onChangeSubtitle: (value: string) => void;
  onChangeText: (value: string) => void;
  onFocus: () => void;
};

const defaultIncomeRows = [
  { id: "salary", title: "Maaş", subtitle: "Düzenli gelir", icon: "briefcase", tone: "green" },
  { id: "freelance", title: "Freelance", subtitle: "Serbest çalışma", icon: "monitor", tone: "blue" },
  { id: "extra", title: "Ek gelir", subtitle: "Yatırım, kira vb.", icon: "bar-chart-2", tone: "gold" }
] as const;

const defaultIncomeRowIds = new Set<string>(defaultIncomeRows.map((row) => row.id));

const mascotTR = require("../../pgn/mascot-cutout.png");
const mascotEN = require("../../pgn/mascot-cutout-dollar.png");
const rowHeight = 86;

function createRowId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random()}`;
}

function getUniqueRowId(id: string | undefined, prefix: string, usedIds: Set<string>) {
  if (id && !usedIds.has(id)) {
    usedIds.add(id);
    return id;
  }

  const nextId = createRowId(prefix);
  usedIds.add(nextId);
  return nextId;
}

export default function IncomeSetupScreen() {
  const listRef = useRef<FlatList<IncomeListItem>>(null);
  const didSyncStoredRows = useRef(false);
  const hasUserEditedRows = useRef(false);
  const hasHydrated = useFinanceStore((state) => state.hasHydrated);
  const storedIncomes = useFinanceStore((state) => state.incomes);
  const setIncomes = useFinanceStore((state) => state.setIncomes);
  const language = useFinanceStore((state) => state.language);
  const mascot = language === "tr" ? mascotTR : mascotEN;
  const t = (key: keyof typeof translations["tr"]) => translations[language][key] || key;

  const translateDefaultLabel = (id: string, field: "title" | "subtitle", val: string) => {
    if (val !== "Maaş" && val !== "Freelance" && val !== "Ek gelir" && 
        val !== "Düzenli gelir" && val !== "Serbest çalışma" && val !== "Yatırım, kira vb." &&
        val !== "Salary" && val !== "Regular income" && val !== "Freelance work" && 
        val !== "Extra income" && val !== "Investments, rent etc.") {
      return val;
    }
    if (language === "tr") {
      if (id === "salary") return field === "title" ? "Maaş" : "Düzenli gelir";
      if (id === "freelance") return field === "title" ? "Freelance" : "Serbest çalışma";
      if (id === "extra") return field === "title" ? "Ek gelir" : "Yatırım, kira vb.";
    } else {
      if (id === "salary") return field === "title" ? "Salary" : "Regular income";
      if (id === "freelance") return field === "title" ? "Freelance" : "Freelance work";
      if (id === "extra") return field === "title" ? "Extra income" : "Investments, rent etc.";
    }
    return val;
  };

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [defaultRows, setDefaultRows] = useState<EditableIncomeRow[]>(
    defaultIncomeRows.map((row) => {
      const storedIncome = storedIncomes.find((income) => income.id === row.id);

      return {
        id: row.id,
        title: translateDefaultLabel(row.id, "title", storedIncome?.label ?? row.title),
        subtitle: translateDefaultLabel(row.id, "subtitle", storedIncome?.subtitle ?? row.subtitle),
        amount: storedIncome?.amount ? String(storedIncome.amount) : ""
      };
    })
  );
  const [customRows, setCustomRows] = useState<EditableIncomeRow[]>(() => {
    const usedIds = new Set(defaultIncomeRowIds);
    return storedIncomes.filter((income) => !defaultIncomeRowIds.has(income.id)).map((income) => ({
      id: getUniqueRowId(income.id, "custom-income", usedIds),
      title: income.label || (language === "tr" ? "Yeni gelir" : "New income"),
      subtitle: income.subtitle || (language === "tr" ? "Ek gelir kaynağı" : "Extra income source"),
      amount: income.amount ? String(income.amount) : ""
    }));
  });

  const buildIncomeRows = (nextDefaultRows: EditableIncomeRow[], nextCustomRows: EditableIncomeRow[]) => [
    ...nextDefaultRows.map((row, index) => ({
      id: row.id,
      label: row.title.trim() || translateDefaultLabel(row.id, "title", defaultIncomeRows[index].title),
      subtitle: row.subtitle.trim() || translateDefaultLabel(row.id, "subtitle", defaultIncomeRows[index].subtitle),
      amount: parseAmount(row.amount),
      period: "monthly" as const
    })),
    ...nextCustomRows.map((row) => ({
      id: row.id,
      label: row.title.trim() || (language === "tr" ? "Gelir adı" : "Income name"),
      subtitle: row.subtitle.trim() || (language === "tr" ? "Açıklama" : "Description"),
      amount: parseAmount(row.amount),
      period: "monthly" as const
    }))
  ];

  const syncIncomeRowsToStore = (nextDefaultRows: EditableIncomeRow[], nextCustomRows: EditableIncomeRow[]) => {
    const nextIncomes = buildIncomeRows(nextDefaultRows, nextCustomRows);
    console.log("[income-screen] sync", {
      incomes: nextIncomes,
      totalIncome: nextIncomes.reduce((total, income) => total + income.amount, 0)
    });
    setIncomes(nextIncomes);
  };

  useEffect(() => {
    if (!hasHydrated || didSyncStoredRows.current) {
      return;
    }

    if (hasUserEditedRows.current) {
      didSyncStoredRows.current = true;
      return;
    }

    setDefaultRows(
      defaultIncomeRows.map((row) => {
        const storedIncome = storedIncomes.find((income) => income.id === row.id);

        return {
          id: row.id,
          title: translateDefaultLabel(row.id, "title", storedIncome?.label ?? row.title),
          subtitle: translateDefaultLabel(row.id, "subtitle", storedIncome?.subtitle ?? row.subtitle),
          amount: storedIncome?.amount ? String(storedIncome.amount) : ""
        };
      })
    );

    const usedIds = new Set(defaultIncomeRowIds);
    setCustomRows(
      storedIncomes.filter((income) => !defaultIncomeRowIds.has(income.id)).map((income) => ({
        id: getUniqueRowId(income.id, "custom-income", usedIds),
        title: income.label || (language === "tr" ? "Yeni gelir" : "New income"),
        subtitle: income.subtitle || (language === "tr" ? "Ek gelir kaynağı" : "Extra income source"),
        amount: income.amount ? String(income.amount) : ""
      }))
    );
    didSyncStoredRows.current = true;
  }, [hasHydrated, storedIncomes]);

  useEffect(() => {
    if (!hasHydrated || !didSyncStoredRows.current) {
      return;
    }

    syncIncomeRowsToStore(defaultRows, customRows);
  }, [defaultRows, customRows, hasHydrated, setIncomes]);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSubscription = Keyboard.addListener(showEvent, () => setIsKeyboardVisible(true));
    const hideSubscription = Keyboard.addListener(hideEvent, () => setIsKeyboardVisible(false));

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const scrollToRow = (index: number) => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
    });
  };

  const updateDefaultRow = (id: string, updates: Partial<EditableIncomeRow>) => {
    hasUserEditedRows.current = true;
    setDefaultRows((current) => {
      const nextDefaultRows = current.map((row) => (row.id === id ? { ...row, ...updates } : row));
      syncIncomeRowsToStore(nextDefaultRows, customRows);
      return nextDefaultRows;
    });
  };

  const updateCustomRow = (id: string, updates: Partial<EditableIncomeRow>) => {
    hasUserEditedRows.current = true;
    setCustomRows((current) => {
      const nextCustomRows = current.map((row) => (row.id === id ? { ...row, ...updates } : row));
      syncIncomeRowsToStore(defaultRows, nextCustomRows);
      return nextCustomRows;
    });
  };

  const addCustomIncome = () => {
    hasUserEditedRows.current = true;
    const newRow = {
        id: createRowId("custom-income"),
        title: "Yeni gelir",
        subtitle: "Ek gelir kaynağı",
        amount: ""
      };

    setCustomRows((current) => {
      const nextCustomRows = [...current, newRow];
      syncIncomeRowsToStore(defaultRows, nextCustomRows);
      return nextCustomRows;
    });

    requestAnimationFrame(() => {
      listRef.current?.scrollToIndex({ index: customRows.length + 3, animated: true, viewPosition: 0.5 });
    });
  };

  const removeCustomIncome = (id: string) => {
    hasUserEditedRows.current = true;
    setCustomRows((current) => {
      const nextCustomRows = current.filter((row) => row.id !== id);
      syncIncomeRowsToStore(defaultRows, nextCustomRows);
      return nextCustomRows;
    });
  };

  const saveAndContinue = () => {
    syncIncomeRowsToStore(defaultRows, customRows);
    router.push("/fixed-expense");
  };

  const rows: IncomeListItem[] = [
    ...defaultRows.map((row, index) => ({
      ...row,
      icon: defaultIncomeRows[index].icon,
      tone: defaultIncomeRows[index].tone,
      isDefault: true
    })),
    ...customRows.map((row) => ({
      ...row,
      icon: "plus" as const,
      tone: "green" as const,
      isDefault: false
    }))
  ];

  const renderRow = ({ item, index }: { item: IncomeListItem; index: number }) => {
    const row = (
      <IncomeRow
        {...item}
        onChangeTitle={(title) => (item.isDefault ? updateDefaultRow(item.id, { title }) : updateCustomRow(item.id, { title }))}
        onChangeSubtitle={(subtitle) => (item.isDefault ? updateDefaultRow(item.id, { subtitle }) : updateCustomRow(item.id, { subtitle }))}
        onChangeText={(amount) => (item.isDefault ? updateDefaultRow(item.id, { amount }) : updateCustomRow(item.id, { amount }))}
        onFocus={() => scrollToRow(index)}
      />
    );

    if (item.isDefault) {
      return row;
    }

    return (
      <Swipeable
        friction={2}
        overshootLeft={false}
        renderLeftActions={() => (
          <Pressable onPress={() => removeCustomIncome(item.id)} style={({ pressed }) => [styles.deleteAction, pressed && styles.deleteActionPressed]}>
            <Feather name="trash-2" size={20} color={colors.white} />
            <Text style={styles.deleteActionText}>{t("delete")}</Text>
          </Pressable>
        )}
      >
        {row}
      </Swipeable>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoiding}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.content}>
            <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
              <Feather name="chevron-left" size={30} color={colors.primary} />
            </Pressable>

            <View style={[styles.hero, isKeyboardVisible && styles.heroKeyboard]}>
              <View style={[styles.mascotStage, isKeyboardVisible && styles.mascotStageKeyboard]}>
                <View style={styles.softOval} />
                <Text style={[styles.sparkle, styles.sparkleLeft]}>✦</Text>
                <Text style={[styles.sparkle, styles.sparkleRight]}>✦</Text>
                <Image source={mascot} style={[styles.mascot, isKeyboardVisible && styles.mascotKeyboard]} resizeMode="contain" />
              </View>
              <Text style={[styles.title, isKeyboardVisible && styles.titleKeyboard]}>
                {language === "tr" ? "Gelirlerini gir" : "Enter your incomes"}
              </Text>
              <Text style={[styles.subtitle, isKeyboardVisible && styles.subtitleKeyboard]}>
                {language === "tr" ? "Gelirlerini ekle, sana özel harcama planını oluşturalım." : "Add your incomes, let us create your custom spending plan."}
              </Text>
            </View>

            <View style={styles.form}>
              <Text style={styles.sectionTitle}>{t("incomeSubtitle")}</Text>
              <FlatList
                ref={listRef}
                data={rows}
                renderItem={renderRow}
                keyExtractor={(item) => item.id}
                style={[styles.incomeList, isKeyboardVisible && styles.incomeListKeyboard]}
                contentContainerStyle={styles.incomeListContent}
                ItemSeparatorComponent={() => <View style={styles.rowSeparator} />}
                showsVerticalScrollIndicator={rows.length > 4}
                keyboardShouldPersistTaps="handled"
                getItemLayout={(_, index) => ({ length: rowHeight, offset: rowHeight * index, index })}
                onScrollToIndexFailed={({ index }) => {
                  requestAnimationFrame(() => listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 }));
                }}
              />

              <Pressable onPress={addCustomIncome} style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
                <Feather name="plus-circle" size={24} color={colors.primary} />
                <Text style={styles.addButtonText}>{t("incomeAddBtn")}</Text>
              </Pressable>
            </View>

            {!isKeyboardVisible && (
              <>
                <Pressable onPress={saveAndContinue} style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}>
                  <View style={styles.ctaSpacer} />
                  <Text style={styles.ctaText}>{t("incomeNextBtn")}</Text>
                  <Feather name="arrow-right" size={26} color={colors.white} style={styles.ctaIcon} />
                </Pressable>

                <View style={styles.securityRow}>
                  <Feather name="lock" size={15} color="#8B928E" />
                  <Text style={styles.securityText}>
                    {language === "tr" ? "Verilerin güvenle saklanır." : "Your data is stored securely."}
                  </Text>
                </View>
              </>
            )}
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function IncomeRow({ title, subtitle, icon, tone, amount, onChangeText, onChangeTitle, onChangeSubtitle, onFocus }: IncomeRowProps) {
  const language = useFinanceStore((state) => state.language);

  return (
    <View style={styles.incomeCard}>
      <View style={[styles.iconBox, styles[`${tone}IconBox`]]}>
        <Feather name={icon} size={24} color={tone === "gold" ? "#B98519" : colors.primary} />
      </View>
      <View style={styles.incomeCopy}>
        <TextInput
          value={title}
          onChangeText={onChangeTitle}
          onFocus={onFocus}
          placeholder={language === "tr" ? "Gelir adı" : "Income name"}
          placeholderTextColor="#9CA19E"
          style={styles.incomeTitleInput}
        />
        <TextInput
          value={subtitle}
          onChangeText={onChangeSubtitle}
          onFocus={onFocus}
          placeholder={language === "tr" ? "Açıklama" : "Description"}
          placeholderTextColor="#9CA19E"
          style={styles.incomeSubtitleInput}
        />
      </View>
      <View style={styles.amountBox}>
        <TextInput
          value={amount}
          onChangeText={onChangeText}
          onFocus={onFocus}
          placeholder="0,00"
          placeholderTextColor="#9CA19E"
          keyboardType="decimal-pad"
          style={styles.amountInput}
        />
        <Text style={styles.currency}>
          {useFinanceStore.getState().currency === "USD" ? "$" : useFinanceStore.getState().currency === "EUR" ? "€" : "₺"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  keyboardAvoiding: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 48, paddingBottom: 12 },
  backButton: {
    position: "absolute",
    top: 12,
    left: 16,
    zIndex: 15,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2
  },
  pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
  hero: { alignItems: "center", marginTop: 10 },
  heroKeyboard: { marginTop: -4 },
  mascotStage: { width: 180, height: 110, alignItems: "center", justifyContent: "center" },
  mascotStageKeyboard: { height: 72 },
  softOval: { position: "absolute", bottom: 4, width: 140, height: 50, borderRadius: 120, backgroundColor: "rgba(13, 50, 40, 0.06)" },
  mascot: { width: 104, height: 108 },
  mascotKeyboard: { width: 72, height: 76 },
  sparkle: { position: "absolute", color: colors.primaryMuted, fontSize: 20, fontWeight: "700" },
  sparkleLeft: { left: 24, top: 24 },
  sparkleRight: { right: 24, bottom: 20, fontSize: 16 },
  title: { marginTop: 2, fontSize: 26, lineHeight: 32, fontWeight: "900", color: colors.primary, textAlign: "center" },
  titleKeyboard: { fontSize: 22, lineHeight: 28 },
  subtitle: { marginTop: 4, maxWidth: 300, fontSize: 14, lineHeight: 20, fontWeight: "600", color: "#747C78", textAlign: "center" },
  subtitleKeyboard: { fontSize: 13, lineHeight: 18 },
  form: { marginTop: 18, gap: 8 },
  sectionTitle: { marginBottom: 2, fontSize: 16, lineHeight: 22, fontWeight: "800", color: colors.primary },
  incomeList: { height: 324, maxHeight: 324, flexShrink: 1 },
  incomeListKeyboard: { height: 210, maxHeight: 210 },
  incomeListContent: { paddingBottom: 2 },
  rowSeparator: { height: 8 },
  incomeCard: {
    minHeight: 74,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1.2,
    borderColor: "rgba(13, 50, 40, 0.06)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2
  },
  iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  greenIconBox: { backgroundColor: colors.primarySoft },
  blueIconBox: { backgroundColor: "#DFF1FA" },
  goldIconBox: { backgroundColor: "#F6E7C6" },
  incomeCopy: { flex: 1, minWidth: 80 },
  incomeTitleInput: {
    minHeight: 20,
    margin: 0,
    padding: 0,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "800",
    color: colors.primary
  },
  incomeSubtitleInput: {
    minHeight: 16,
    marginTop: 2,
    padding: 0,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
    color: "#747C78"
  },
  amountBox: {
    width: 120,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: "rgba(13,50,40,0.03)",
    borderWidth: 1,
    borderColor: "rgba(13,50,40,0.04)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12
  },
  amountInput: { flex: 1, fontSize: 18, lineHeight: 22, fontWeight: "800", color: colors.primary, paddingVertical: 4 },
  currency: { marginLeft: 4, fontSize: 16, lineHeight: 20, fontWeight: "800", color: colors.primaryMuted },
  addButton: {
    marginTop: 6,
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: "dashed",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "transparent"
  },
  addButtonText: { fontSize: 16, lineHeight: 22, fontWeight: "700", color: colors.primary },
  deleteAction: {
    width: 72,
    minHeight: 72,
    borderRadius: 14,
    backgroundColor: "#D95555",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginRight: 8
  },
  deleteActionPressed: { opacity: 0.82 },
  deleteActionText: { fontSize: 14, lineHeight: 18, fontWeight: "700", color: colors.white },
  cta: {
    minHeight: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    marginTop: "auto",
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 3
  },
  ctaPressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  ctaSpacer: { width: 26 },
  ctaText: { fontSize: 17, lineHeight: 22, fontWeight: "700", color: colors.white, textAlign: "center" },
  ctaIcon: { width: 26 },
  securityRow: { marginTop: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  securityText: { fontSize: 12, lineHeight: 16, fontWeight: "500", color: "#8B928E", textAlign: "center" }
});
