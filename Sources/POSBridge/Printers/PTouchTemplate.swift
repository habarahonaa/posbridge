import Foundation

/// Builds a P-touch Template command stream for a Brother QL-800 with a
/// pre-loaded template stored in printer flash memory.
///
/// The protocol (per Brother's "Software Developer's Manual — P-touch Template
/// Command Reference QL-810W/820NWB", which the QL-800 firmware also implements):
///
///   ^II                  Initialize
///   ^TS<n>               Select template number n  (n = single binary byte 0x01..0x63)
///   ^ON<name>\           Select object by its P-touch Editor object name (delimited by 0x5C '\')
///   ^DI<text>\           Directly insert text into the currently selected object
///   ^CN<n>               Number of copies, n binary byte 0x01..0x63
///   ^FF                  Start printing
///
/// The exact byte for "select template by number" is `^TS` followed by the
/// 1-byte binary template index. The manual's documentation occasionally writes
/// it as `^TS\01` — the `\01` notation in Brother's docs means "the byte 0x01",
/// not the literal 4 ASCII characters. We send it as a raw byte here to match.
///
/// Strings are encoded using the printer's configured character code table.
/// We default to **Windows-1252**, which the bridge's setup instructions tell
/// the operator to set in the P-touch Template Settings tool. CP-1252 covers
/// Spanish characters (ñ, á, é, í, ó, ú, ¿, ¡) cleanly. Any character that
/// can't be represented falls back to '?' so we never send broken bytes.
enum PTouchTemplate {

    static func buildPrintJob(
        templateNumber: Int,
        fields: [(name: String, value: String)],
        copies: Int = 1
    ) throws -> Data {
        guard (1...99).contains(templateNumber) else {
            throw BridgeFailure(
                code: .invalidPayload,
                message: "templateNumber must be between 1 and 99 (got \(templateNumber))"
            )
        }
        guard (1...99).contains(copies) else {
            throw BridgeFailure(
                code: .invalidPayload,
                message: "copies must be between 1 and 99 (got \(copies))"
            )
        }

        var stream = Data()

        // ^II — initialize. Resets any partial state from a previous job.
        stream.append(ascii("^II"))

        // ^TS + 1 binary byte — select stored template by index.
        stream.append(ascii("^TS"))
        stream.append(UInt8(templateNumber))

        // For each field: ^ON<name>\  then  ^DI<value>\
        for field in fields {
            stream.append(ascii("^ON"))
            stream.append(encode(field.name))
            stream.append(0x5C) // '\' delimiter

            stream.append(ascii("^DI"))
            stream.append(encode(field.value))
            stream.append(0x5C) // '\' delimiter
        }

        // ^CN + 1 binary byte — number of copies.
        if copies != 1 {
            stream.append(ascii("^CN"))
            stream.append(UInt8(copies))
        }

        // ^FF — start printing.
        stream.append(ascii("^FF"))

        return stream
    }

    // MARK: - Private

    private static func ascii(_ s: String) -> Data {
        // All command tokens are pure ASCII — force-unwrap is fine here.
        s.data(using: .ascii)!
    }

    /// Encodes a field value using Windows-1252, the bridge's default printer
    /// character code table. Characters outside CP-1252 are replaced with '?'
    /// rather than dropped, so the field doesn't shift visually.
    private static func encode(_ s: String) -> Data {
        if let cp1252 = s.data(using: .windowsCP1252, allowLossyConversion: true) {
            return cp1252
        }
        // Should never happen with allowLossyConversion: true, but keep a path.
        return Data(s.utf8)
    }
}
