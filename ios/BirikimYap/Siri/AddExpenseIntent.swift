import Foundation
import AppIntents

@available(iOS 16.0, watchOS 9.0, *)
struct QuickAddExpenseIntent: AppIntent {
    static var title: LocalizedStringResource = "Sesli Harcama Gir"
    static var description = IntentDescription("Soru sorarak sesli harcama kaydeder.")
    
    static var openAppWhenRun: Bool = false
    
    @Parameter(
        title: "Harcama",
        description: "Örn: Market 500",
        requestValueDialog: IntentDialog("Ne, ne kadar?")
    )
    var expense: String?

    func perform() async throws -> some IntentResult & ProvidesDialog {
        let finalInput: String
        if let exp = expense?.trimmingCharacters(in: .whitespacesAndNewlines), !exp.isEmpty {
            finalInput = exp
        } else {
            finalInput = try await $expense.requestValue(IntentDialog("Ne, ne kadar?"))
        }
        
        let userDefaults = UserDefaults(suiteName: "group.com.birikimyapsiri.app") ?? UserDefaults.standard
        var pendingExpenses = userDefaults.array(forKey: "pending_siri_expenses") as? [[String: Any]] ?? []
        
        let newExpense: [String: Any] = [
            "id": UUID().uuidString,
            "rawInput": finalInput,
            "timestamp": Date().timeIntervalSince1970
        ]
        
        pendingExpenses.append(newExpense)
        userDefaults.set(pendingExpenses, forKey: "pending_siri_expenses")
        userDefaults.synchronize()
        
        return .result(dialog: "'\(finalInput)' harcamanız Birikim Yap'a eklendi! ✨")
    }
}

@available(iOS 16.0, watchOS 9.0, *)
struct AddExpenseIntent: AppIntent {
    static var title: LocalizedStringResource = "Harcama Ekle"
    static var description = IntentDescription("Birikim Yap uygulamasına harcama kaydeder.")
    
    static var openAppWhenRun: Bool = false
    
    @Parameter(
        title: "Harcama Detayı",
        description: "Örn: Market 500 veya Kahve 120",
        requestValueDialog: IntentDialog("Ne, ne kadar?")
    )
    var input: String?

    func perform() async throws -> some IntentResult & ProvidesDialog {
        let textToParse: String
        if let inp = input?.trimmingCharacters(in: .whitespacesAndNewlines), !inp.isEmpty {
            textToParse = inp
        } else {
            textToParse = try await $input.requestValue(IntentDialog("Ne, ne kadar?"))
        }
        
        let userDefaults = UserDefaults(suiteName: "group.com.birikimyapsiri.app") ?? UserDefaults.standard
        var pendingExpenses = userDefaults.array(forKey: "pending_siri_expenses") as? [[String: Any]] ?? []
        
        let newExpense: [String: Any] = [
            "id": UUID().uuidString,
            "rawInput": textToParse,
            "timestamp": Date().timeIntervalSince1970
        ]
        
        pendingExpenses.append(newExpense)
        userDefaults.set(pendingExpenses, forKey: "pending_siri_expenses")
        userDefaults.synchronize()
        
        return .result(dialog: "'\(textToParse)' harcamanız Birikim Yap'a eklendi! ✨")
    }
}

@available(iOS 16.0, watchOS 9.0, *)
struct BirikimYapShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: QuickAddExpenseIntent(),
            phrases: [
                "\(.applicationName)",
                "\(.applicationName) harcama",
                "\(.applicationName) harcama ekle",
                "\(.applicationName) harcama gir",
                "\(.applicationName) sesli harcama",
                "\(.applicationName)'a harcama ekle",
                "\(.applicationName)'a harcama gir",
                "\(.applicationName) ile harcama ekle"
            ],
            shortTitle: "Sesli Harcama Gir",
            systemImageName: "mic.fill"
        )
        AppShortcut(
            intent: AddExpenseIntent(),
            phrases: [
                "\(.applicationName) harcama kaydet",
                "\(.applicationName) hızlı harcama",
                "\(.applicationName) yeni harcama",
                "\(.applicationName) bütçe"
            ],
            shortTitle: "Harcama Ekle",
            systemImageName: "plus.circle.fill"
        )
    }
}
