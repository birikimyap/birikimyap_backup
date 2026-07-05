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

const mascot = require("../../pgn/mascot-cutout.png");
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
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [defaultRows, setDefaultRows] = useState<EditableExpenseRow[]>(
    defaultExpenseRows.map((row) => {
      const storedExpense = storedFixedExpenses.find((expense) => expense.id === row.id);

      return {
        id: row.id,
        title: storedExpense?.label ?? row.title,
        subtitle: storedExpense?.subtitle ?? row.subtitle,
        amount: storedExpense?.amount ? String(storedExpense.amount) : ""
      };
    })
  );
  const [customRows, setCustomRows] = useState<EditableExpenseRow[]>(() => {
    const usedIds = new Set(defaultExpenseRowIds);
    return storedFixedExpenses.filter((expense) => !defaultExpenseRowIds.has(expense.id)).map((expense) => ({
      id: getUniqueRowId(expense.id, "custom-expense", usedIds),
      title: expense.label || "Yeni gider",
      subtitle: expense.subtitle || "Sabit gider",
      amount: expense.amount ? String(expense.amount) : ""
    }));
  });

  const buildExpenseRows = (nextDefaultRows: EditableExpenseRow[], nextCustomRows: EditableExpenseRow[]) => [
    ...nextDefaultRows.map((row, index) => ({
      id: row.id,
      label: row.title.trim() || defaultExpenseRows[index].title,
      subtitle: row.subtitle.trim() || "Açıklama",
      amount: parseAmount(row.amount),
      period: "monthly" as const,
      isFixed: true
    })),
    ...nextCustomRows.map((row) => ({
      id: row.id,
      label: row.title.trim() || "Gider adı",
      subtitle: row.subtitle.trim() || "Açıklama",
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
          title: storedExpense?.label ?? row.title,
          subtitle: storedExpense?.subtitle ?? row.subtitle,
          amount: storedExpense?.amount ? String(storedExpense.amount) : ""
        };
      })
    );

    const usedIds = new Set(defaultExpenseRowIds);
    setCustomRows(
      fixedExpenses.filter((expense) => !defaultExpenseRowIds.has(expense.id)).map((expense) => ({
        id: getUniqueRowId(expense.id, "custom-expense", usedIds),
        title: expense.label || "Yeni gider",
        subtitle: expense.subtitle || "Sabit gider",
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
            <Text style={styles.deleteActionText}>Sil</Text>
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
              <Text style={[styles.title, isKeyboardVisible && styles.titleKeyboard]}>Sabit giderlerini gir</Text>
              <Text style={[styles.subtitle, isKeyboardVisible && styles.subtitleKeyboard]}>Düzenli giderlerini ekle, gerçek harcama limitini hesaplayalım.</Text>
            </View>

            <View style={styles.form}>
              <Text style={styles.sectionTitle}>Aylık sabit giderlerin</Text>
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
                <Text style={styles.addButtonText}>Yeni gider ekle</Text>
              </Pressable>
            </View>

            {!isKeyboardVisible && (
              <>
                <Pressable onPress={saveAndContinue} style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}>
                  <View style={styles.ctaSpacer} />
                  <Text style={styles.ctaText}>Devam et</Text>
                  <Feather name="arrow-right" size={26} color={colors.white} style={styles.ctaIcon} />
                </Pressable>

                <View style={styles.securityRow}>
                  <Feather name="lock" size={15} color="#8B928E" />
                  <Text style={styles.securityText}>Verilerin güvenle saklanır.</Text>
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
          placeholder="Gider adı"
          placeholderTextColor="#9CA19E"
          style={styles.expenseTitleInput}
        />
        <TextInput
          value={subtitle}
          onChangeText={onChangeSubtitle}
          onFocus={onFocus}
          placeholder="Açıklama"
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
        <Text style={styles.currency}>₺</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  keyboardAvoiding: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 8, paddingBottom: 12 },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "rgba(255,252,246,0.7)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2
  },
  pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
  hero: { alignItems: "center", marginTop: -6 },
  heroKeyboard: { marginTop: -16 },
  mascotStage: { width: 180, height: 110, alignItems: "center", justifyContent: "center" },
  mascotStageKeyboard: { height: 72 },
  softOval: { position: "absolute", bottom: 4, width: 140, height: 50, borderRadius: 120, backgroundColor: "#EAF0DF" },
  mascot: { width: 104, height: 108 },
  mascotKeyboard: { width: 72, height: 76 },
  sparkle: { position: "absolute", color: "#D6A064", fontSize: 20, fontWeight: "700" },
  sparkleLeft: { left: 24, top: 24 },
  sparkleRight: { right: 24, bottom: 20, fontSize: 16 },
  title: { marginTop: 2, fontSize: 32, lineHeight: 38, fontWeight: "800", color: colors.primary, textAlign: "center" },
  titleKeyboard: { fontSize: 26, lineHeight: 32 },
  subtitle: { marginTop: 4, maxWidth: 300, fontSize: 15, lineHeight: 22, fontWeight: "500", color: "#747C78", textAlign: "center" },
  subtitleKeyboard: { fontSize: 13, lineHeight: 18 },
  form: { marginTop: 22, gap: 8 },
  sectionTitle: { marginBottom: 2, fontSize: 18, lineHeight: 24, fontWeight: "700", color: colors.primary },
  expenseList: { height: 324, maxHeight: 324, flexShrink: 1 },
  expenseListKeyboard: { height: 210, maxHeight: 210 },
  expenseListContent: { paddingBottom: 2 },
  rowSeparator: { height: 8 },
  expenseCard: {
    minHeight: 72,
    borderRadius: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "rgba(13,50,40,0.06)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 10,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
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
    fontWeight: "700",
    color: "#101514"
  },
  expenseSubtitleInput: {
    minHeight: 16,
    marginTop: 2,
    padding: 0,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
    color: "#747C78"
  },
  amountBox: {
    width: 130,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: "rgba(13,50,40,0.03)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12
  },
  amountInput: { flex: 1, fontSize: 18, lineHeight: 22, fontWeight: "700", color: colors.text, paddingVertical: 4 },
  currency: { marginLeft: 6, fontSize: 16, lineHeight: 20, fontWeight: "700", color: "#747C78" },
  addButton: {
    marginTop: 6,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(13,50,40,0.18)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10
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
