import Foundation

/// Runtime configuration loaded from `settings.json`.
///
/// Lookup order:
///   1. `$POSBRIDGE_SETTINGS` env var (full path).
///   2. `settings.json` next to the package root (dev mode, `swift run`).
///   3. `~/Library/Application Support/POSBridge/settings.json` (packaged app).
///   4. Built-in defaults.
struct Settings: Codable {
    var port: Int = 9999
    var receiptPrinter: ReceiptSettings = .init()
    var labelPrinter: LabelSettings = .init()
    var store: StoreSettings = .init()

    struct ReceiptSettings: Codable {
        /// Name of the CUPS print queue for the receipt printer. Set this in
        /// macOS System Settings → Printers when you add the printer.
        var cupsQueueName: String = "Receipt"
        /// Characters per line at Font A. 48 for 80mm rolls, 32 for 58mm.
        var lineWidth: Int = 48
        /// Codepage label — currently informational; the bridge sends PC858
        /// (ESC t 16), which covers Latin-1 / Spanish accents.
        var characterCodepage: String = "PC858"
    }

    struct LabelSettings: Codable {
        var cupsQueueName: String = "Label"
    }

    struct StoreSettings: Codable {
        /// Default store name printed at the top of receipts when the web
        /// payload doesn't override it.
        var name: String = "My Store"
        /// Default footer line printed below totals.
        var footer: String = "Thank you!"
    }

    static func load() -> Settings {
        guard let url = locateFile() else { return Settings() }
        guard
            let data = try? Data(contentsOf: url),
            let decoded = try? JSONDecoder().decode(Settings.self, from: data)
        else {
            NSLog("[POSBridge] settings.json found at \(url.path) but could not be parsed; using defaults")
            return Settings()
        }
        return decoded
    }

    private static func locateFile() -> URL? {
        if let override = ProcessInfo.processInfo.environment["POSBRIDGE_SETTINGS"] {
            return URL(fileURLWithPath: override)
        }
        let here = URL(fileURLWithPath: #filePath)
        let packageRoot = here
            .deletingLastPathComponent() // Models/
            .deletingLastPathComponent() // POSBridge/
            .deletingLastPathComponent() // Sources/
            .deletingLastPathComponent() // posbridge/
        let dev = packageRoot.appendingPathComponent("settings.json")
        if FileManager.default.fileExists(atPath: dev.path) { return dev }

        if let appSupport = FileManager.default
            .urls(for: .applicationSupportDirectory, in: .userDomainMask)
            .first?
            .appendingPathComponent("POSBridge")
            .appendingPathComponent("settings.json"),
           FileManager.default.fileExists(atPath: appSupport.path)
        {
            return appSupport
        }
        return nil
    }
}

/// Process-wide settings instance. Loaded once at startup.
enum SettingsHolder {
    static var current: Settings = Settings()
}
