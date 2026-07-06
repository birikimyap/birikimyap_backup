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

type EditableExpenseRow = {
  id: string;
  title: string;
  subtitle: string;
  amount: string;
};

type ExpenseListItem = EditableExpenseRow & {
  icon: keyof typeof Feather.glyphMap;
  tone: "orange" | "amber" | "blue";
  isDefault: boolean;
};

type ExpenseRowProps = ExpenseListItem & {
  onChangeTitle: (value: string) => void;
  onChangeSubtitle: (value: string) => void;
  onChangeText: (value: string) => void;
  onFocus: () => void;
};

const defaultExpenseRows = [
  { id: "rent", title: "Kira", subtitle: "Ev veya iş yeri kirası", icon: "home", tone: "orange" },
  { id: "bills", title: "Faturalar", subtitle: "Elektrik, su, doğalgaz vb.", icon: "zap", tone: "amber" },
  { id: "transport", title: "Ulaşım", subtitle: "Toplu taşıma, akaryakıt vb.", icon: "truck", tone: "blue" }
] as const;

const defaultExpenseRowIds = new Set<string>(defaultExpenseRows.map((row) => row.id));

const mascotTR = require("../../pgn/mascot-cutout.png");
const mascotEN = require("../../pgn/mascot-cutout-dollar.png");
const expenseAccent = "#C8742D";
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

export default function FixedExpenseScreen() {
  const listRef = useRef<FlatList<ExpenseListItem>>(null);
  const didSyncStoredRows = useRef(false);
  const hasUserEditedRows = useRef(false);
  const hasHydrated = useFinanceStore((state) => state.hasHydrated);
  const storedExpenses = useFinanceStore((state) => state.expenses);
  const setFixedExpenses = useFinanceStore((state) => state.setFixedExpenses);
  const storedFixedExpenses = storedExpenses.filter((expense) => expense.isFixed);
  const language = useFinanceStore((state) => state.language);
  const mascot = language === "tr" ? mascotTR : mascotEN;
  const t = (key: keyof typeof translations["tr"]) => translations[language][key] || key;

  const translateDefaultLabel = (id: string, field: "title" | "subtitle", val: string) => {
    if (val !== "Kira" && val !== "Ev veya iş yeri kirası" && val !== "Faturalar" && 
        val !== "Elektrik, su, doğalgaz vb." && val !== "Ulaşım" && val !== "Toplu taşıma, akaryakıt vb." &&
        val !== "Rent" && val !== "Home or work rent" && val !== "Bills" && 
        val !== "Electricity, water, natural gas etc." && val !== "Transportation" && val !== "Public transport, fuel etc.") {
      return val;
    }
    if (language === "tr") {
      if (id === "rent") return field === "title" ? "Kira" : "Ev veya iş yeri kirası";
      if (id === "bills") return field === "title" ? "Faturalar" : "Elektrik, su, doğalgaz vb.";
      if (id === "transport") return field === "title" ? "Ulaşım" : "Toplu taşıma, akaryakıt vb.";
    } else {
      if (id === "rent") return field === "title" ? "Rent" : "Home or work rent";
      if (id === "bills") return field === "title" ? "Bills" : "Electricity, water, natural gas etc.";
      if (id === "transport") return field === "title" ? "Transportation" : "Public transport, fuel etc.";
    }
    return val;
  };

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [defaultRows, setDefaultRows] = useState<EditableExpenseRow[]>(
    defaultExpenseRows.map((row) => {
      const storedExpense = storedFixedExpenses.find((expense) => expense.id === row.id);

      return {
        id: row.id,
        title: translateDefaultLabel(row.id, "title", storedExpense?.label ?? row.title),
        subtitle: translateDefaultLabel(row.id, "subtitle", storedExpense?.subtitle ?? row.subtitle),
        amount: storedExpense?.amount ? String(storedExpense.amount) : ""
      };
    })
  );
  const [customRows, setCustomRows] = useState<EditableExpenseRow[]>(() => {
    const usedIds = new Set(defaultExpenseRowIds);
    return storedFixedExpenses.filter((expense) => !defaultExpenseRowIds.has(expense.id)).map((expense) => ({
      id: getUniqueRowId(expense.id, "custom-expense", usedIds),
      title: expense.label || (language === "tr" ? "Yeni gider" : "New expense"),
      subtitle: expense.subtitle || (language === "tr" ? "Sabit gider" : "Fixed expense"),
      amount: expense.amount ? String(expense.amount) : ""
    }));
  });

  const buildExpenseRows = (nextDefaultRows: EditableExpenseRow[], nextCustomRows: EditableExpenseRow[]) => [
    ...nextDefaultRows.map((row, index) => ({
      id: row.id,
      label: row.title.trim() || translateDefaultLabel(row.id, "title", defaultExpenseRows[index].title),
      subtitle: row.subtitle.trim() || translateDefaultLabel(row.id, "subtitle", defaultExpenseRows[index].subtitle),
      amount: parseAmount(row.amount),
      period: "monthly" as const,
      isFixed: true
    })),
    ...nextCustomRows.map((row) => ({
      id: row.id,
      label: row.title.trim() || (language === "tr" ? "Gider adı" : "Expense name"),
      subtitle: row.subtitle.trim() || (language === "tr" ? "Açıklama" : "Description"),
      amount: parseAmount(row.amount),
      period: "monthly" as const,
      isFixed: true
    }))
  ];

  const syncExpenseRowsToStore = (nextDefaultRows: EditableExpenseRow[], nextCustomRows: EditableExpenseRow[]) => {
    const nextExpenses = buildExpenseRows(nextDefaultRows, nextCustomRows);
    console.log("[fixed-expense-screen] sync", {
      fixedExpenses: nextExpenses,
      totalFixedExpenses: nextExpenses.reduce((total, expense) => total + expense.amount, 0)
    });
    setFixedExpenses(nextExpenses);
  };

  useEffect(() => {
    if (!hasHydrated || didSyncStoredRows.current) {
      return;
    }

    if (hasUserEditedRows.current) {
      didSyncStoredRows.current = true;
      return;
    }

    const fixedExpenses = storedExpenses.filter((expense) => expense.isFixed);
    setDefaultRows(
      defaultExpenseRows.map((row) => {
        const storedExpense = fixedExpenses.find((expense) => expense.id === row.id);

        return {
          id: row.id,
          title: translateDefaultLabel(row.id, "title", storedExpense?.label ?? row.title),
          subtitle: translateDefaultLabel(row.id, "subtitle", storedExpense?.subtitle ?? row.subtitle),
          amount: storedExpense?.amount ? String(storedExpense.amount) : ""
        };
      })
    );

    const usedIds = new Set(defaultExpenseRowIds);
    setCustomRows(
      fixedExpenses.filter((expense) => !defaultExpenseRowIds.has(expense.id)).map((expense) => ({
        id: getUniqueRowId(expense.id, "custom-expense", usedIds),
        title: expense.label || (language === "tr" ? "Yeni gider" : "New expense"),
        subtitle: expense.subtitle || (language === "tr" ? "Sabit gider" : "Fixed expense"),
        amount: expense.amount ? String(expense.amount) : ""
      }))
    );
    didSyncStoredRows.current = true;
  }, [hasHydrated, storedExpenses]);

  useEffect(() => {
    if (!hasHydrated || !didSyncStoredRows.current) {
      return;
    }

    syncExpenseRowsToStore(defaultRows, customRows);
  }, [defaultRows, customRows, hasHydrated, setFixedExpenses]);

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

  const updateDefaultRow = (id: string, updates: Partial<EditableExpenseRow>) => {
    hasUserEditedRows.current = true;
    setDefaultRows((current) => {
      const nextDefaultRows = current.map((row) => (row.id === id ? { ...row, ...updates } : row));
      syncExpenseRowsToStore(nextDefaultRows, customRows);
      return nextDefaultRows;
    });
  };

  const updateCustomRow = (id: string, updates: Partial<EditableExpenseRow>) => {
    hasUserEditedRows.current = true;
    setCustomRows((current) => {
      const nextCustomRows = current.map((row) => (row.id === id ? { ...row, ...updates } : row));
      syncExpenseRowsToStore(defaultRows, nextCustomRows);
      return nextCustomRows;
    });
  };

  const addCustomExpense = () => {
    hasUserEditedRows.current = true;
    const newRow = {
        id: createRowId("custom-expense"),
        title: "Yeni gider",
        subtitle: "Sabit gider",
        amount: ""
      };

    setCustomRows((current) => {
      const nextCustomRows = [...current, newRow];
      syncExpenseRowsToStore(defaultRows, nextCustomRows);
      return nextCustomRows;
    });

    requestAnimationFrame(() => {
      listRef.current?.scrollToIndex({ index: customRows.length + 3, animated: true, viewPosition: 0.5 });
    });
  };

  const removeCustomExpense = (id: string) => {
    hasUserEditedRows.current = true;
    setCustomRows((current) => {
      const nextCustomRows = current.filter((row) => row.id !== id);
      syncExpenseRowsToStore(defaultRows, nextCustomRows);
      return nextCustomRows;
    });
  };

  const saveAndContinue = () => {
    syncExpenseRowsToStore(defaultRows, customRows);
    router.push("/savings-goal");
  };

  const rows: ExpenseListItem[] = [
    ...defaultRows.map((row, index) => ({
      ...row,
      icon: defaultExpenseRows[index].icon,
      tone: defaultExpenseRows[index].tone,
      isDefault: true
    })),
    ...customRows.map((row) => ({
      ...row,
      icon: "plus" as const,
      tone: "orange" as const,
      isDefault: false
    }))
  ];

  const renderRow = ({ item, index }: { item: ExpenseListItem; index: number }) => {
    const row = (
      <ExpenseAmountRow
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
          <Pressable onPress={() => removeCustomExpense(item.id)} style={({ pressed }) => [styles.deleteAction, pressed && styles.deleteActionPressed]}>
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
                {language === "tr" ? "Sabit giderlerini gir" : "Enter fixed expenses"}
              </Text>
              <Text style={[styles.subtitle, isKeyboardVisible && styles.subtitleKeyboard]}>
                {language === "tr" ? "Düzenli giderlerini ekle, gerçek harcama limitini hesaplayalım." : "Add your regular expenses, let us calculate your real spend limits."}
              </Text>
            </View>

            <View style={styles.form}>
              <Text style={styles.sectionTitle}>{t("fixedExpenseTitle")}</Text>
              <FlatList
                ref={listRef}
                data={rows}
                renderItem={renderRow}
                keyExtractor={(item) => item.id}
                style={[styles.expenseList, isKeyboardVisible && styles.expenseListKeyboard]}
                contentContainerStyle={styles.expenseListContent}
                ItemSeparatorComponent={() => <View style={styles.rowSeparator} />}
                showsVerticalScrollIndicator={rows.length > 4}
                keyboardShouldPersistTaps="handled"
                getItemLayout={(_, index) => ({ length: rowHeight, offset: rowHeight * index, index })}
                onScrollToIndexFailed={({ index }) => {
                  requestAnimationFrame(() => listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 }));
                }}
              />

              <Pressable onPress={addCustomExpense} style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
                <Feather name="plus-circle" size={24} color={expenseAccent} />
                <Text style={styles.addButtonText}>{t("fixedExpenseAddBtn")}</Text>
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

function ExpenseAmountRow({ title, subtitle, icon, tone, amount, onChangeText, onChangeTitle, onChangeSubtitle, onFocus }: ExpenseRowProps) {
  const language = useFinanceStore((state) => state.language);

  return (
    <View style={styles.expenseCard}>
      <View style={[styles.iconBox, styles[`${tone}IconBox`]]}>
        <Feather name={icon} size={24} color={tone === "blue" ? "#3D6F8F" : expenseAccent} />
      </View>
      <View style={styles.expenseCopy}>
        <TextInput
          value={title}
          onChangeText={onChangeTitle}
          onFocus={onFocus}
          placeholder={language === "tr" ? "Gider adı" : "Expense name"}
          placeholderTextColor="#9CA19E"
          style={styles.expenseTitleInput}
        />
        <TextInput
          value={subtitle}
          onChangeText={onChangeSubtitle}
          onFocus={onFocus}
          placeholder={language === "tr" ? "Açıklama" : "Description"}
          placeholderTextColor="#9CA19E"
          style={styles.expenseSubtitleInput}
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
  sparkle: { position: "absolute", color: "#D6A064", fontSize: 20, fontWeight: "700" },
  sparkleLeft: { left: 24, top: 24 },
  sparkleRight: { right: 24, bottom: 20, fontSize: 16 },
  title: { marginTop: 2, fontSize: 26, lineHeight: 32, fontWeight: "900", color: colors.primary, textAlign: "center" },
  titleKeyboard: { fontSize: 22, lineHeight: 28 },
  subtitle: { marginTop: 4, maxWidth: 300, fontSize: 14, lineHeight: 20, fontWeight: "600", color: colors.textMuted, textAlign: "center" },
  subtitleKeyboard: { fontSize: 13, lineHeight: 18 },
  form: { marginTop: 18, gap: 8 },
  sectionTitle: { marginBottom: 2, fontSize: 16, lineHeight: 22, fontWeight: "800", color: colors.primary },
  expenseList: { height: 324, maxHeight: 324, flexShrink: 1 },
  expenseListKeyboard: { height: 210, maxHeight: 210 },
  expenseListContent: { paddingBottom: 2 },
  rowSeparator: { height: 8 },
  expenseCard: {
    minHeight: 74,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "rgba(13,50,40,0.04)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2
  },
  iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  orangeIconBox: { backgroundColor: "#F8E5D4" },
  amberIconBox: { backgroundColor: "#F7E9C8" },
  blueIconBox: { backgroundColor: "#DFF1FA" },
  expenseCopy: { flex: 1, minWidth: 80 },
  expenseTitleInput: {
    minHeight: 20,
    margin: 0,
    padding: 0,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "800",
    color: colors.primary
  },
  expenseSubtitleInput: {
    minHeight: 16,
    marginTop: 2,
    padding: 0,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
    color: colors.textMuted
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
  addButtonText: { fontSize: 16, lineHeight: 22, fontWeight: "700", color: expenseAccent },
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
