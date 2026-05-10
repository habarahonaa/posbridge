import Foundation

/// Builds an ESC/POS byte stream from a structured receipt.
///
/// Targets the generic ESC/POS command set that virtually every 58mm/80mm
/// thermal receipt printer implements (Epson TM-T20/T88, Star TSP143, Volcora,
/// Citizen, generic OEMs). If your printer dialect differs, the constants here
/// — paper cut, drawer-kick pulse, codepage select — are usually the only
/// thing that needs adjusting.
enum ESCPOS {
    private static let ESC: UInt8 = 0x1B
    private static let GS:  UInt8 = 0x1D
    private static let LF:  UInt8 = 0x0A

    static let lineWidth80mm = 48 // characters per line at Font A on 80mm
    static let lineWidth58mm = 32

    static func receipt(_ payload: ReceiptPayload, lineWidth: Int = lineWidth80mm) -> Data {
        var data = Data()

        data.append(initPrinter())
        data.append(codepageLatin1())

        data.append(align(.center))
        data.append(textSize(width: 2, height: 2))
        data.append(payload.storeName.utf8Latin1())
        data.append(LF)
        data.append(textSize(width: 1, height: 1))
        data.append(LF)

        data.append(align(.left))
        data.append("Sale: \(payload.saleId)".utf8Latin1())
        data.append(LF)
        data.append(formatDate(payload.occurredAt).utf8Latin1())
        data.append(LF)
        if let cashier = payload.cashier {
            data.append("Cashier: \(cashier)".utf8Latin1())
            data.append(LF)
        }
        data.append(separator(width: lineWidth))

        for line in payload.lines {
            data.append(itemRow(line, width: lineWidth, currency: payload.currency))
        }
        data.append(separator(width: lineWidth))

        data.append(amountRow("Subtotal", payload.subtotalCents, width: lineWidth, currency: payload.currency))
        if let tax = payload.taxCents, tax > 0 {
            data.append(amountRow("Tax", tax, width: lineWidth, currency: payload.currency))
        }
        data.append(textSize(width: 1, height: 2))
        data.append(amountRow("TOTAL", payload.totalCents, width: lineWidth, currency: payload.currency))
        data.append(textSize(width: 1, height: 1))

        if let method = payload.paymentMethod {
            data.append(LF)
            data.append("Payment: \(method)".utf8Latin1())
            data.append(LF)
        }
        if let tendered = payload.amountTenderedCents {
            data.append(amountRow("Tendered", tendered, width: lineWidth, currency: payload.currency))
        }
        if let change = payload.changeCents {
            data.append(amountRow("Change", change, width: lineWidth, currency: payload.currency))
        }

        data.append(LF)
        data.append(align(.center))
        if let footer = payload.storeFooter {
            data.append(footer.utf8Latin1())
            data.append(LF)
        }
        data.append(LF)
        data.append(LF)
        data.append(LF)

        data.append(cutPaper())

        if payload.openDrawer == true {
            data.append(drawerKick(pin: 2))
        }

        return data
    }

    static func drawerKick(pin: Int) -> Data {
        // ESC p m t1 t2 — m=0 is pin 2, m=1 is pin 5. t1/t2 = pulse on/off (units of 2ms).
        let m: UInt8 = pin == 5 ? 1 : 0
        return Data([ESC, 0x70, m, 0x32, 0xFA])
    }

    // MARK: - Command helpers

    private static func initPrinter() -> Data { Data([ESC, 0x40]) }
    private static func codepageLatin1() -> Data { Data([ESC, 0x74, 0x10]) } // PC858 (Latin-1 superset)
    private static func cutPaper() -> Data { Data([GS, 0x56, 0x00]) }

    private enum Align { case left, center, right }

    private static func align(_ a: Align) -> Data {
        let n: UInt8 = a == .left ? 0 : (a == .center ? 1 : 2)
        return Data([ESC, 0x61, n])
    }

    private static func textSize(width: UInt8, height: UInt8) -> Data {
        let n = ((width - 1) << 4) | (height - 1)
        return Data([GS, 0x21, n])
    }

    private static func separator(width: Int) -> Data {
        var d = Data()
        d.append(String(repeating: "-", count: width).utf8Latin1())
        d.append(LF)
        return d
    }

    private static func itemRow(_ line: ReceiptLine, width: Int, currency: String) -> Data {
        var d = Data()
        let qty = formatQuantity(line.quantity)
        let amount = formatAmount(line.totalCents, currency: currency)
        let nameBudget = max(8, width - qty.count - amount.count - 2)
        let name = line.name.padOrTruncate(to: nameBudget)
        d.append("\(qty) \(name) \(amount)".utf8Latin1())
        d.append(LF)
        return d
    }

    private static func amountRow(_ label: String, _ cents: Int, width: Int, currency: String) -> Data {
        var d = Data()
        let amount = formatAmount(cents, currency: currency)
        let pad = width - label.count - amount.count
        d.append((label + String(repeating: " ", count: max(1, pad)) + amount).utf8Latin1())
        d.append(LF)
        return d
    }

    private static func formatQuantity(_ q: Double) -> String {
        if q == q.rounded() {
            return String(format: "%2dx", Int(q))
        }
        return String(format: "%.2fx", q)
    }

    private static func formatAmount(_ cents: Int, currency: String) -> String {
        let major = Double(cents) / 100.0
        return String(format: "%@ %.2f", currency, major)
    }

    private static func formatDate(_ iso: String) -> String {
        let f = ISO8601DateFormatter()
        guard let date = f.date(from: iso) else { return iso }
        let out = DateFormatter()
        out.locale = Locale(identifier: "en_US_POSIX")
        out.dateFormat = "yyyy-MM-dd HH:mm"
        return out.string(from: date)
    }
}

private extension String {
    func utf8Latin1() -> Data {
        // Fall back to UTF-8 if the string has characters Latin-1 can't encode.
        // The printer's codepage is set to PC858 above, which covers ñ, accents, ¿, ¡.
        data(using: .isoLatin1) ?? Data(self.utf8)
    }

    func padOrTruncate(to width: Int) -> String {
        if count >= width { return String(prefix(width)) }
        return self + String(repeating: " ", count: width - count)
    }
}
