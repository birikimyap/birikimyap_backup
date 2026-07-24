import Foundation
import React

@objc(SiriBridge)
class SiriBridge: NSObject {
    
    @objc
    static func requiresMainQueueSetup() -> Bool {
        return false
    }

    @objc
    func getPendingSiriExpenses(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        let userDefaults = UserDefaults(suiteName: "group.com.birikimyapsiri.app") ?? UserDefaults.standard
        let pending = userDefaults.array(forKey: "pending_siri_expenses") as? [[String: Any]] ?? []
        resolve(pending)
    }

    @objc
    func clearPendingSiriExpenses(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        let userDefaults = UserDefaults(suiteName: "group.com.birikimyapsiri.app") ?? UserDefaults.standard
        userDefaults.removeObject(forKey: "pending_siri_expenses")
        userDefaults.synchronize()
        resolve(true)
    }
}
