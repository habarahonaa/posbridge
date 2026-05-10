import Foundation

/// Prints Brother QL series labels using P-touch Template commands.
///
/// Labels are designed once in P-touch Editor for Mac with named text/barcode
/// objects, exported as BLF files, and uploaded to the QL printer's flash
/// memory via Brother's Transfer Express. The printer is then put into
/// P-touch Template mode using Brother's P-touch Template Settings tool.
///
/// At runtime this class:
///   1. Resolves the friendly template name to a printer-side template number
///      via `templates.json` next to the bridge.
///   2. Builds a P-touch Template ASCII command stream that selects that
///      template, fills each named object with its value, and triggers print.
///   3. Sends the bytes through CUPS in raw mode (`lp -d <queue> -o raw`).
///
/// No Brother SDK or framework is required at runtime — the field substitution
/// happens inside the printer's firmware.
final class LabelPrinter {
    static let shared = LabelPrinter()

    private var cupsQueueName: String { SettingsHolder.current.labelPrinter.cupsQueueName }

    func presence() -> PrinterPresence {
        if cupsQueueExists(cupsQueueName) {
            let templateCount = (try? TemplateRegistry.load().mappings.count) ?? 0
            return PrinterPresence(
                detected: true,
                name: cupsQueueName,
                detail: "via CUPS raw + P-touch Template (\(templateCount) templates registered)"
            )
        }
        return PrinterPresence(
            detected: false,
            name: nil,
            detail: "Add your Brother QL printer in System Settings → Printers and name the queue '\(cupsQueueName)'"
        )
    }

    func print(_ payload: LabelPayload) throws {
        guard cupsQueueExists(cupsQueueName) else {
            throw BridgeFailure(
                code: .printerNotFound,
                message: "Label printer queue '\(cupsQueueName)' not found. Add it in System Settings → Printers, or change `labelPrinter.cupsQueueName` in settings.json."
            )
        }

        let registry = try TemplateRegistry.load()
        guard let entry = registry.mappings[payload.template] else {
            throw BridgeFailure(
                code: .templateNotFound,
                message: "Template '\(payload.template)' is not registered in templates.json. Known: \(registry.mappings.keys.sorted().joined(separator: ", "))"
            )
        }

        // Validate that every required field for this template is present.
        if let required = entry.requiredFields {
            for name in required where payload.fields[name] == nil {
                throw BridgeFailure(
                    code: .templateFieldMissing,
                    message: "Template '\(payload.template)' requires field '\(name)' which was not provided"
                )
            }
        }

        let bytes = try PTouchTemplate.buildPrintJob(
            templateNumber: entry.number,
            fields: payload.fields.map { (name: $0.key, value: $0.value) },
            copies: payload.copies ?? 1
        )

        try sendRaw(bytes)
    }

    // MARK: - Private

    private func sendRaw(_ bytes: Data) throws {
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
