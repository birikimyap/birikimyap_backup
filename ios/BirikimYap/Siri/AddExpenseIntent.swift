import Foundation
import AppIntents

@available(iOS 16.0, *)
struct AddExpenseIntent: AppIntent {
    static var title: LocalizedStringResource = "Harcama Ekle"
    static var description = IntentDescription("Birikim Yap uygulamasına sesli harcama ekler.")
    
    static var openAppWhenRun: Bool = false
    
    @Parameter(title: "Harcama Detayı")
    var input: String?

    func perform() async throws -> some IntentResult & ProvidesDialog {
        guard let rawInput = input, !rawInput.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            throw $input.needsValue("Ne kadar ve ne için harcama yaptınız? (Örn: Market 350)")
        }
        
        let textToParse = rawInput.trimmingCharacters(in: .whitespacesAndNewlines)
        
        // AppGroup Shared Storage
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
        
        return .result(dialog: "'\(textToParse)' harcamanız Birikim Yap'a eklendi! 🐷")
    }
}

@available(iOS 16.0, *)
struct BirikimYapShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: AddExpenseIntent(),
            phrases: [
                "\(.applicationName) ile harcama ekle",
                "\(.applicationName) harcama ekle",
                "\(.applicationName) sesli harcama",
                "\(.applicationName) harcama"
            ],
            shortTitle: "Harcama Ekle",
            systemImageName: "plus.circle.fill"
        )
    }
}
