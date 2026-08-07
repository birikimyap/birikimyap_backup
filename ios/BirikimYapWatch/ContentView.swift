import SwiftUI
import WatchConnectivity

struct ContentView: View {
    @State private var dailyRemaining: Double = 0.0
    @State private var formattedRemaining: String = "₺0,00"
    @State private var isExceeded: Bool = false
    @State private var showVoiceSheet: Bool = false
    @State private var quickAmount: String = ""

    var body: some View {
        ScrollView {
            VStack(spacing: 12) {
                // Header
                HStack {
                    Image(systemName: "leaf.fill")
                        .foregroundColor(Color(red: 0, green: 0.9, blue: 0.55))
                    Text("Birikim Yap")
                        .font(.system(size: 14, weight: .bold, design: .rounded))
                        .foregroundColor(.white)
                }
                .padding(.top, 4)

                // Budget Gauge Card
                VStack(spacing: 4) {
                    Text(isExceeded ? "Bütçe Aşıldı! ⚠️" : "Bugün Kalan Limit")
                        .font(.system(size: 11, weight: .semibold, design: .rounded))
                        .foregroundColor(isExceeded ? .red : .gray)

                    Text(formattedRemaining)
                        .font(.system(size: 22, weight: .black, design: .rounded))
                        .foregroundColor(isExceeded ? .red : Color(red: 0, green: 0.9, blue: 0.55))
                        .minimumScaleFactor(0.7)
                }
                .padding()
                .frame(maxWidth: .infinity)
                .background(
                    RoundedRectangle(cornerRadius: 16)
                        .fill(isExceeded ? Color.red.opacity(0.15) : Color(red: 0.05, green: 0.2, blue: 0.15))
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(isExceeded ? Color.red.opacity(0.4) : Color(red: 0, green: 0.9, blue: 0.55).opacity(0.3), lineWidth: 1.5)
                )

                // Quick Add Expense Button (Voice & Dictation)
                Button(action: {
                    loadSharedData()
                }) {
                    HStack {
                        Image(systemName: "arrow.triangle.2.circlepath")
                        Text("Senkronize Et")
                            .font(.system(size: 12, weight: .bold, design: .rounded))
                    }
                    .foregroundColor(.white)
                    .padding(.vertical, 8)
                    .frame(maxWidth: .infinity)
                    .background(Color.blue.opacity(0.3))
                    .cornerRadius(12)
                }

                Text("iPhone Siri & Widget Canlı Senkronizasyon")
                    .font(.system(size: 9, weight: .medium))
                    .foregroundColor(.gray)
                    .multilineTextAlignment(.center)
            }
            .padding(.horizontal, 8)
        }
        .onAppear {
            loadSharedData()
        }
    }

    private func loadSharedData() {
        if let userDefaults = UserDefaults(suiteName: "group.com.birikimyapsiri.app") {
            if let val = userDefaults.object(forKey: "watch_daily_remaining") as? Double {
                self.dailyRemaining = val
                self.isExceeded = val < 0
            }
            if let formatted = userDefaults.string(forKey: "watch_formatted_remaining") {
                self.formattedRemaining = formatted
            }
        }
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}
