import AppKit

final class AppDelegate: NSObject, NSApplicationDelegate {
    private var menubar: MenubarController?
    private var server: BridgeServer?

    func applicationDidFinishLaunching(_ notification: Notification) {
        SettingsHolder.current = Settings.load()

        let server = BridgeServer(port: in_port_t(SettingsHolder.current.port))
        do {
            try server.start()
        } catch {
            NSLog("[POSBridge] Failed to start HTTP server: \(error)")
        }
        self.server = server
        self.menubar = MenubarController(server: server)
    }

    func applicationWillTerminate(_ notification: Notification) {
        server?.stop()
    }
}
