import XCTest
@testable import POSBridge

final class PTouchTemplateTests: XCTestCase {

    /// A minimal job — no fields, one copy — should produce just `^II^TS<n>^FF`.
    func testEmptyJobIsInitSelectPrint() throws {
        let bytes = try PTouchTemplate.buildPrintJob(templateNumber: 1, fields: [])
        XCTAssertEqual(Array(bytes), [
            0x5E, 0x49, 0x49,           // ^II
            0x5E, 0x54, 0x53, 0x01,     // ^TS + binary 0x01
            0x5E, 0x46, 0x46            // ^FF
        ])
    }

    /// Each field becomes `^ON<name>\^DI<value>\` between the select and print.
    func testSingleFieldEmitsObjectThenInsert() throws {
        let bytes = try PTouchTemplate.buildPrintJob(
            templateNumber: 2,
            fields: [(name: "name", value: "Hi")]
        )
        XCTAssertEqual(Array(bytes), [
            0x5E, 0x49, 0x49,                                    // ^II
            0x5E, 0x54, 0x53, 0x02,                              // ^TS\x02
            0x5E, 0x4F, 0x4E, 0x6E, 0x61, 0x6D, 0x65, 0x5C,      // ^ONname\
            0x5E, 0x44, 0x49, 0x48, 0x69, 0x5C,                  // ^DIHi\
            0x5E, 0x46, 0x46                                     // ^FF
        ])
    }

    /// `copies > 1` emits `^CN<n>` before `^FF`.
    func testCopiesEmitsCN() throws {
        let bytes = try PTouchTemplate.buildPrintJob(templateNumber: 1, fields: [], copies: 5)
        let expectedTail: [UInt8] = [0x5E, 0x43, 0x4E, 0x05, 0x5E, 0x46, 0x46]
        XCTAssertEqual(Array(bytes.suffix(7)), expectedTail)
    }

    func testRejectsOutOfRangeTemplateNumber() {
        XCTAssertThrowsError(try PTouchTemplate.buildPrintJob(templateNumber: 0, fields: []))
        XCTAssertThrowsError(try PTouchTemplate.buildPrintJob(templateNumber: 100, fields: []))
    }

    func testRejectsOutOfRangeCopies() {
        XCTAssertThrowsError(try PTouchTemplate.buildPrintJob(templateNumber: 1, fields: [], copies: 0))
        XCTAssertThrowsError(try PTouchTemplate.buildPrintJob(templateNumber: 1, fields: [], copies: 100))
    }

    /// Spanish characters round-trip via Windows-1252, the printer's default codepage.
    /// `ñ` is 0xF1 in CP-1252 (and in Latin-1, which is why this works for Spanish).
    func testEncodesSpanishCharacters() throws {
        let bytes = try PTouchTemplate.buildPrintJob(
            templateNumber: 1,
            fields: [(name: "name", value: "ñ")]
        )
        XCTAssertTrue(Array(bytes).contains(0xF1), "expected ñ to appear as 0xF1 (CP-1252)")
    }
}
