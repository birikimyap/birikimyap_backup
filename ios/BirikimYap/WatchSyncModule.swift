import Foundation
import React
import WatchConnectivity

@objc(WatchSyncModule)
class WatchSyncModule: NSObject, WCSessionDelegate {

  override init() {
    super.init()
    if WCSession.isSupported() {
      let session = WCSession.default
      session.delegate = self
      session.activate()
    }
  }

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }

  @objc(updateWatchContext:)
  func updateWatchContext(_ data: [String: Any]) {
    if WCSession.isSupported() {
      let session = WCSession.default
      if session.activationState == .activated {
        do {
          try session.updateApplicationContext(data)
        } catch {
          print("WatchConnectivity error: \(error.localizedDescription)")
        }
      }
    }

    // Shared AppGroup fallback
    if let userDefaults = UserDefaults(suiteName: "group.com.birikimyapsiri.app") {
      userDefaults.set(data["dailyRemaining"], forKey: "watch_daily_remaining")
      userDefaults.set(data["formattedRemaining"], forKey: "watch_formatted_remaining")
      userDefaults.synchronize()
    }
  }

  // WCSessionDelegate Stub Methods
  func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {}
  func sessionDidBecomeInactive(_ session: WCSession) {}
  func sessionDidDeactivate(_ session: WCSession) {
    WCSession.default.activate()
  }
}
