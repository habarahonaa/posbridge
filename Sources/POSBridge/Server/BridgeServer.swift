import Foundation
import Swifter

/// Tiny HTTP server bound to 127.0.0.1.
///
/// Chrome treats `http://127.0.0.1` as a secure context, so an HTTPS Vercel page
/// can `fetch` here without mixed-content errors. CORS is handled per-route.
final class BridgeServer {
    private let server = HttpServer()
    private let port: in_port_t
    private(set) var isRunning = false

    init(port: in_port_t) {
        self.port = port
    }

    func start() throws {
        registerRoutes()
        try server.start(port, forceIPv4: true, priority: .utility)
        isRunning = true
        NSLog("[POSBridge] Listening on 127.0.0.1:\(port)")
    }

    func stop() {
        server.stop()
        isRunning = false
    }

    private func registerRoutes() {
        // CORS preflight
        server["/health"] = corsAware { _ in self.health() }
        server["/print/receipt"] = corsAware { req in self.printReceipt(req) }
        server["/print/label"] = corsAware { req in self.printLabel(req) }
        server["/drawer/kick"] = corsAware { req in self.kickDrawer(req) }
    }

    // MARK: - Routes

    private func health() -> HttpResponse {
        let status = BridgeStatus(
            ok: true,
            version: BridgeServer.version,
            printers: BridgeStatus.Printers(
                receipt: ReceiptPrinter.shared.presence(),
                label: LabelPrinter.shared.presence()
            )
        )
        return jsonOK(status)
    }

    private func printReceipt(_ request: HttpRequest) -> HttpResponse {
        guard let payload: ReceiptPayload = decode(request) else {
            return jsonError(.invalidPayload, "Could not decode ReceiptPayload")
        }
        do {
            try ReceiptPrinter.shared.print(payload)
            return jsonOK(EmptyOK())
        } catch let err as BridgeFailure {
            return jsonError(err.code, err.message)
        } catch {
            return jsonError(.printFailed, error.localizedDescription)
        }
    }

    private func printLabel(_ request: HttpRequest) -> HttpResponse {
        guard let payload: LabelPayload = decode(request) else {
            return jsonError(.invalidPayload, "Could not decode LabelPayload")
        }
        do {
            try LabelPrinter.shared.print(payload)
            return jsonOK(EmptyOK())
        } catch let err as BridgeFailure {
            return jsonError(err.code, err.message)
        } catch {
            return jsonError(.printFailed, error.localizedDescription)
        }
    }

    private func kickDrawer(_ request: HttpRequest) -> HttpResponse {
        let payload: DrawerPayload = decode(request) ?? DrawerPayload(pin: 2)
        do {
            try ReceiptPrinter.shared.kickDrawer(pin: payload.pin ?? 2)
            return jsonOK(EmptyOK())
        } catch let err as BridgeFailure {
            return jsonError(err.code, err.message)
        } catch {
            return jsonError(.printFailed, error.localizedDescription)
        }
    }

    // MARK: - Helpers

    private static let version = "1.0.0"

    private func decode<T: Decodable>(_ request: HttpRequest) -> T? {
        let data = Data(request.body)
        return try? JSONDecoder.bridge.decode(T.self, from: data)
    }

    private func jsonOK<T: Encodable>(_ value: T) -> HttpResponse {
        let data = (try? JSONEncoder.bridge.encode(value)) ?? Data()
        return .raw(200, "OK", corsHeaders) { try $0.write(data) }
    }

    private func jsonError(_ code: BridgeErrorCode, _ message: String) -> HttpResponse {
        let body = BridgeError(ok: false, code: code, message: message)
        let data = (try? JSONEncoder.bridge.encode(body)) ?? Data()
        return .raw(400, "Bad Request", corsHeaders) { try $0.write(data) }
    }

    /// Wraps a route to short-circuit OPTIONS preflights and tag responses with
    /// CORS headers. Allows any origin — this is localhost only and not reachable
    /// from another machine.
    private func corsAware(_ handler: @escaping (HttpRequest) -> HttpResponse) -> ((HttpRequest) -> HttpResponse) {
        return { request in
            if request.method.uppercased() == "OPTIONS" {
                return .raw(204, "No Content", self.corsHeaders) { _ in }
            }
            return handler(request)
        }
    }

    private var corsHeaders: [String: String] {
        [
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "Content-Type": "application/json; charset=utf-8",
        ]
    }
}

private struct EmptyOK: Encodable {
    let ok = true
}
