import Foundation

// Mirrors lib/print-bridge/types.ts on the Next.js side.
// Keep both in sync — these are the wire format.

struct BridgeStatus: Codable {
    let ok: Bool
    let version: String
    let printers: Printers

    struct Printers: Codable {
        let receipt: PrinterPresence
        let label: PrinterPresence
    }
}

struct PrinterPresence: Codable {
    let detected: Bool
    let name: String?
    let detail: String?
}

struct BridgeError: Codable {
    let ok: Bool
    let code: BridgeErrorCode
    let message: String
}

enum BridgeErrorCode: String, Codable {
    case printerNotFound = "printer_not_found"
    case templateNotFound = "template_not_found"
    case templateFieldMissing = "template_field_missing"
    case printFailed = "print_failed"
    case invalidPayload = "invalid_payload"
    case `internal` = "internal"
}

struct BridgeFailure: Error {
    let code: BridgeErrorCode
    let message: String
}

struct ReceiptLine: Codable {
    let name: String
    let quantity: Double
    let unitPriceCents: Int
    let totalCents: Int
}

struct ReceiptPayload: Codable {
    let storeName: String
    let storeFooter: String?
    let saleId: String
    let cashier: String?
    let occurredAt: String
    let lines: [ReceiptLine]
    let subtotalCents: Int
    let taxCents: Int?
    let totalCents: Int
    let paymentMethod: String?
    let amountTenderedCents: Int?
    let changeCents: Int?
    let currency: String
    let openDrawer: Bool?

    static func sample() -> ReceiptPayload {
        let store = SettingsHolder.current.store
        return ReceiptPayload(
            storeName: store.name,
            storeFooter: store.footer,
            saleId: "TEST-0001",
            cashier: "Test",
            occurredAt: ISO8601DateFormatter().string(from: Date()),
            lines: [
                ReceiptLine(name: "Coffee 12oz", quantity: 1, unitPriceCents: 4500, totalCents: 4500),
                ReceiptLine(name: "Pastry",      quantity: 2, unitPriceCents: 2500, totalCents: 5000),
            ],
            subtotalCents: 9500,
            taxCents: 0,
            totalCents: 9500,
            paymentMethod: "Cash",
            amountTenderedCents: 10000,
            changeCents: 500,
            currency: "USD",
            openDrawer: true
        )
    }
}

struct LabelPayload: Codable {
    let template: String
    let fields: [String: String]
    let copies: Int?
}

struct DrawerPayload: Codable {
    let pin: Int?
}

extension JSONEncoder {
    static let bridge: JSONEncoder = {
        let e = JSONEncoder()
        e.outputFormatting = [.withoutEscapingSlashes]
        return e
    }()
}

extension JSONDecoder {
    static let bridge = JSONDecoder()
}
