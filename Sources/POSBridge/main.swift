import AppKit

// Menubar apps must run a Cocoa app loop. SwiftPM executable targets don't ship
// with @main + NSApplicationMain wiring out of the box, so bootstrap manually.
let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.setActivationPolicy(.accessory) // No Dock icon, no menubar — pure status item.
app.run()
