import Foundation

/// Loads `templates.json` — the bridge's mapping from friendly template names
/// (sent by your web app) to printer-side template numbers (uploaded to the
/// printer's flash via Brother's Transfer Express) plus optional required-
/// field declarations.
///
/// Lookup order:
///   1. `$POSBRIDGE_TEMPLATES` env var (full path to a JSON file).
///   2. `templates.json` next to the package root (dev mode).
///   3. `~/Library/Application Support/POSBridge/templates.json` (packaged app).
struct TemplateRegistry {
    let mappings: [String: TemplateEntry]

    static func load() throws -> TemplateRegistry {
        let url = try resolveURL()
        do {
            let data = try Data(contentsOf: url)
            let decoded = try JSONDecoder().decode([String: TemplateEntry].self, from: data)
            return TemplateRegistry(mappings: decoded)
        } catch let err as BridgeFailure {
            throw err
        } catch {
            throw BridgeFailure(
                code: .internal,
                message: "Failed to read templates.json at \(url.path): \(error.localizedDescription)"
            )
        }
    }

    static func resolveURL() throws -> URL {
        if let override = ProcessInfo.processInfo.environment["POSBRIDGE_TEMPLATES"] {
            return URL(fileURLWithPath: override)
        }

        let here = URL(fileURLWithPath: #filePath)
        let packageRoot = here
            .deletingLastPathComponent() // Printers/
            .deletingLastPathComponent() // POSBridge/
            .deletingLastPathComponent() // Sources/
            .deletingLastPathComponent() // posbridge/
        let dev = packageRoot.appendingPathComponent("templates.json")
        if FileManager.default.fileExists(atPath: dev.path) {
            return dev
        }

        let installed = FileManager.default
            .urls(for: .applicationSupportDirectory, in: .userDomainMask)
            .first?
            .appendingPathComponent("POSBridge")
            .appendingPathComponent("templates.json")

        if let installed, FileManager.default.fileExists(atPath: installed.path) {
            return installed
        }

        throw BridgeFailure(
            code: .templateNotFound,
            message: "templates.json not found. Expected at \(dev.path) or \(installed?.path ?? "~/Library/Application Support/POSBridge/templates.json")"
        )
    }
}

struct TemplateEntry: Codable {
    /// Printer-side template number (1..99) assigned by P-touch Transfer
    /// Manager / Transfer Express when the BLF was uploaded.
    let number: Int
    /// Optional list of object names that must be present in every print
    /// request. Used to fail fast with a clear error if the caller forgets a field.
    let requiredFields: [String]?
    /// Free-form note for whoever maintains this file.
    let description: String?
}
