import Foundation
import React

@objc(LiveActivityModule)
class LiveActivityModule: NSObject {

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }

  @objc(updateLiveActivity:)
  func updateLiveActivity(_ data: [String: Any]) {
    // Shared AppGroup User Defaults for Live Activity Widget Extension
    if let userDefaults = UserDefaults(suiteName: "group.com.birikimyapsiri.app") {
      userDefaults.set(data["dailyRemaining"], forKey: "live_daily_remaining")
      userDefaults.set(data["dailyLimit"], forKey: "live_daily_limit")
      userDefaults.set(data["spentRatio"], forKey: "live_spent_ratio")
      userDefaults.set(data["statusText"], forKey: "live_status_text")
      userDefaults.synchronize()
    }
  }
}
