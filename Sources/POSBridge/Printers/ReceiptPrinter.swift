import Foundation

/// Sends ESC/POS bytes to the receipt printer through a CUPS raw queue.
///
/// The printer must be installed in macOS (System Settings → Printers) under
/// the name configured in `settings.json` (default `Receipt`). This class
/// shells out to `/usr/bin/lp` with `-o raw` to forward bytes untouched.
final class ReceiptPrinter {
    static let shared = ReceiptPrinter()

    private var cupsQueueName: String { SettingsHolder.current.receiptPrinter.cupsQueueName }

    func presence() -> PrinterPresence {
        if cupsQueueExists(cupsQueueName) {
            return PrinterPresence(detected: true, name: cupsQueueName, detail: "via CUPS raw")
        }
        return PrinterPresence(
            detected: false,
            name: nil,
            detail: "Add your receipt printer in System Settings → Printers and name the queue '\(cupsQueueName)'"
        )
    }

    func print(_ payload: ReceiptPayload) throws {
        let bytes = ESCPOS.receipt(payload, lineWidth: SettingsHolder.current.receiptPrinter.lineWidth)
        try sendRaw(bytes)
    }

    func kickDrawer(pin: Int) throws {
        try sendRaw(ESCPOS.drawerKick(pin: pin))
    }

    // MARK: - Private

    private func sendRaw(_ bytes: Data) throws {
        guard cupsQueueExists(cupsQueueName) else {
            throw BridgeFailure(
                code: .printerNotFound,
                message: "Receipt printer queue '\(cupsQueueName)' not found. Add it in System Settings → Printers, or change `receiptPrinter.cupsQueueName` in settings.json."
            )
        }

        let proc = Process()
        proc.executableURL = URL(fileURLWithPath: "/usr/bin/lp")
        proc.arguments = ["-d", cupsQueueName, "-o", "raw"]

        let stdin = Pipe()
        let stderr = Pipe()
        proc.standardInput = stdin
        proc.standardError = stderr

        try proc.run()
        try stdin.fileHandleForWriting.write(contentsOf: bytes)
        try stdin.fileHandleForWriting.close()
        proc.waitUntilExit()

        if proc.terminationStatus != 0 {
            let err = String(data: stderr.fileHandleForReading.readDataToEndOfFile(), encoding: .utf8) ?? ""
            throw BridgeFailure(code: .printFailed, message: "lp exited with \(proc.terminationStatus): \(err)")
        }
    }

    private func cupsQueueExists(_ name: String) -> Bool {
        let proc = Process()
        proc.executableURL = URL(fileURLWithPath: "/usr/bin/lpstat")
        proc.arguments = ["-p", name]
        let nullOut = Pipe()
        proc.standardOutput = nullOut
        proc.standardError = nullOut
        do {
            try proc.run()
            proc.waitUntilExit()
            return proc.terminationStatus == 0
        } catch {
            return false
        }
    }
}
