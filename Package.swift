// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "POSBridge",
    platforms: [.macOS(.v13)],
    products: [
        .executable(name: "POSBridge", targets: ["POSBridge"])
    ],
    dependencies: [
        .package(url: "https://github.com/httpswift/swifter.git", from: "1.5.0")
    ],
    targets: [
        .executableTarget(
            name: "POSBridge",
            dependencies: [
                .product(name: "Swifter", package: "swifter")
            ],
            path: "Sources/POSBridge"
        ),
        .testTarget(
            name: "POSBridgeTests",
            dependencies: ["POSBridge"],
            path: "Tests/POSBridgeTests"
        )
    ]
)
