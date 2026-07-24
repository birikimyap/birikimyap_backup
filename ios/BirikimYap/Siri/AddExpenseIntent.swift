import Foundation
import AppIntents

@available(iOS 16.0, *)
struct AddExpenseIntent: AppIntent {
    static var title: LocalizedStringResource = "Harcama Ekle"
    static var description = IntentDescription("Birikim Yap uygulamasına sesli harcama ekler.")
    
    static var openAppWhenRun: Bool = false
    
    @Parameter(title: "Harcama Detayı", description: "Örn: Market 350 veya Kahve 120")
    var input: String
    
    static var parameterSummary: ParameterSummary {
        Summary("Birikim Yap'a \(\.$input) ekle")
    }

    @MainActor
    func perform() async throws -> some IntentResult & ProvidesDialog {
        let cleanedInput = input.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !cleanedInput.isEmpty else {
            return .result(dialog: "Lütfen eklenecek harcamayı ve miktarını söyleyin.")
        }
        
        // AppGroup Shared Storage
        let userDefaults = UserDefaults(suiteName: "group.com.birikimyapsiri.app") ?? UserDefaults.standard
        var pendingExpenses = userDefaults.array(forKey: "pending_siri_expenses") as? [[String: Any]] ?? []
        
        let newExpense: [String: Any] = [
            "id": UUID().uuidString,
            "rawInput": cleanedInput,
            "timestamp": Date().timeIntervalSince1970
        ]
        
        pendingExpenses.append(newExpense)
        userDefaults.set(pendingExpenses, forKey: "pending_siri_expenses")
        userDefaults.synchronize()
        
        return .result(dialog: "'\(cleanedInput)' harcamanız Birikim Yap'a eklendi! 🐷")
    }
}

@available(iOS 16.0, *)
struct BirikimYapShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: AddExpenseIntent(),
            phrases: [
                "\(.applicationName) \(\.$input)",
                "\(.applicationName) harcama ekle \(\.$input)",
                "\(.applicationName) ile \(\.$input) harcadım"
            ],
            shortTitle: "Harcama Ekle",
            systemImageName: "plus.circle.fill"
        )
    }
}
