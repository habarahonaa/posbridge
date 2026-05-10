import AppKit

final class MenubarController {
    private let statusItem: NSStatusItem
    private let server: BridgeServer
    private var refreshTimer: Timer?
    private var menuDelegate: MenuRefreshDelegate?

    init(server: BridgeServer) {
        self.server = server
        self.statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)

        rebuildMenu()
        refreshIcon()

        // Re-poll printer presence every 30s so the indicator stays honest
        // if a printer goes offline or gets removed in System Settings.
        refreshTimer = Timer.scheduledTimer(withTimeInterval: 30, repeats: true) { [weak self] _ in
            self?.refreshIcon()
            self?.rebuildMenu()
        }
    }

    fileprivate func refreshIcon() {
        guard let button = statusItem.button else { return }
        let cfg = NSImage.SymbolConfiguration(paletteColors: [healthState.color])
        let image = NSImage(
            systemSymbolName: "printer.fill",
            accessibilityDescription: "POSBridge \(healthState.label)"
        )?.withSymbolConfiguration(cfg)
        button.image = image
        button.toolTip = "POSBridge — \(healthState.label)"
    }

    fileprivate func rebuildMenu() {
        let menu = NSMenu()

        let delegate = MenuRefreshDelegate { [weak self] in self?.refreshIcon() }
        self.menuDelegate = delegate
        menu.delegate = delegate

        menu.addItem(headerItem(serverStatusLine))
        menu.addItem(headerItem(receiptStatusLine))
        menu.addItem(headerItem(labelStatusLine))
        menu.addItem(.separator())

        menu.addItem(action("Test receipt print",       #selector(testReceipt)))
        menu.addItem(action("Test label print",         #selector(testLabel)))
        menu.addItem(.separator())

        menu.addItem(action("Reveal templates.json",    #selector(revealTemplatesConfig)))
        menu.addItem(action("Reveal settings.json",     #selector(revealSettingsConfig)))
        menu.addItem(.separator())

        menu.addItem(action("Open project on GitHub",   #selector(openGitHub)))
        menu.addItem(NSMenuItem(
            title: "Quit POSBridge",
            action: #selector(NSApplication.terminate(_:)),
            keyEquivalent: "q"
        ))

        statusItem.menu = menu
    }

    // MARK: - Status snapshots

    private enum HealthState {
        case ok, partial, offline

        var label: String {
            switch self {
            case .ok:      return "all printers reachable"
            case .partial: return "one printer reachable"
            case .offline: return "no printers reachable"
            }
        }

        var color: NSColor {
            switch self {
            case .ok:      return .systemGreen
            case .partial: return .systemYellow
            case .offline: return .systemRed
            }
        }
    }

    private var healthState: HealthState {
        let r = ReceiptPrinter.shared.presence().detected
        let l = LabelPrinter.shared.presence().detected
        switch (r, l) {
        case (true, true):   return .ok
        case (false, false): return .offline
        default:             return .partial
        }
    }

    private var serverStatusLine: String {
        let port = SettingsHolder.current.port
        return server.isRunning ? "Listening on 127.0.0.1:\(port)" : "Server not running"
    }

    private var receiptStatusLine: String {
        let p = ReceiptPrinter.shared.presence()
        return p.detected ? "Receipt: \(p.name ?? "ready")" : "Receipt: not detected"
    }

    private var labelStatusLine: String {
        let p = LabelPrinter.shared.presence()
        return p.detected ? "Label: \(p.name ?? "ready")" : "Label: not detected"
    }

    private func headerItem(_ title: String) -> NSMenuItem {
        let item = NSMenuItem(title: title, action: nil, keyEquivalent: "")
        item.isEnabled = false
        return item
    }

    private func action(_ title: String, _ selector: Selector) -> NSMenuItem {
        let item = NSMenuItem(title: title, action: selector, keyEquivalent: "")
        item.target = self
        return item
    }

    // MARK: - Actions

    @objc private func testReceipt() {
        do {
            try ReceiptPrinter.shared.print(ReceiptPayload.sample())
        } catch {
            NSLog("[POSBridge] Test receipt failed: \(error)")
        }
    }

    @objc private func testLabel() {
        let firstName = (try? TemplateRegistry.load().mappings.keys.sorted().first) ?? "shipping"
        do {
            try LabelPrinter.shared.print(LabelPayload(template: firstName, fields: [:], copies: 1))
        } catch {
            NSLog("[POSBridge] Test label failed: \(error)")
        }
    }

    @objc private func revealTemplatesConfig() {
        if let url = try? TemplateRegistry.resolveURL() {
            NSWorkspace.shared.activateFileViewerSelecting([url])
        }
    }

    @objc private func revealSettingsConfig() {
        let here = URL(fileURLWithPath: #filePath)
        let candidate = here
            .deletingLastPathComponent() // App/
            .deletingLastPathComponent() // POSBridge/
            .deletingLastPathComponent() // Sources/
            .deletingLastPathComponent() // posbridge/
            .appendingPathComponent("settings.json")
        if FileManager.default.fileExists(atPath: candidate.path) {
            NSWorkspace.shared.activateFileViewerSelecting([candidate])
        } else {
            NSWorkspace.shared.open(URL(fileURLWithPath: NSHomeDirectory()))
        }
    }

    @objc private func openGitHub() {
        if let url = URL(string: "https://github.com/habarahonaa/posbridge") {
            NSWorkspace.shared.open(url)
        }
    }
}

/// Refreshes status lines every time the user opens the menu, so the indicator
/// reflects current state instead of whatever the 30s timer last sampled.
private final class MenuRefreshDelegate: NSObject, NSMenuDelegate {
    private let onOpen: () -> Void
    init(onOpen: @escaping () -> Void) { self.onOpen = onOpen }
    func menuWillOpen(_ menu: NSMenu) { onOpen() }
}
