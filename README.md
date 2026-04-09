# NodeShift

Cross-platform Node.js version manager with a graphical interface.

Built with **Tauri 2.x** (Rust backend) + **React** + **TypeScript** + **Tailwind CSS**.

## Features

- Visual GUI for managing Node.js versions
- One-click install with automatic PATH configuration
- Multi-version switching (symlink-based)
- Mirror source support (npmmirror, Huawei, Tencent)
- Project-level version pinning (.nvmrc / .node-version)
- CLI shim for automatic version switching in terminal
- Cross-platform: Windows, macOS, Linux
- i18n support (Chinese / English)

## Screenshots

```
+------+---------------------------------------------------+
| NS   |  NodeShift                          [_] [O] [X]   |
+------+---------------------------------------------------+
|      |  Current: Node.js v22.15.0 (Jod LTS)              |
| Dashboard |                                               |
| Versions  |  [LTS] [Current] [All]    [______] Search    |
| Settings  |                                               |
|      |  v22.15.0  Active LTS  Jod       [* Active]       |
|      |  v20.19.0  Maintenance  Iron      [Use] [Delete]  |
|      |  v23.11.0  Current     -          [Install]        |
+------+---------------------------------------------------+
```

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) >= 20
- [Rust](https://rustup.rs/) (latest stable)
- Platform-specific dependencies:
  - **Linux**: `libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf`
  - **macOS**: Xcode Command Line Tools
  - **Windows**: Microsoft C++ Build Tools

### Setup

```bash
# Install frontend dependencies
npm install

# Run in development mode
npm run tauri dev

# Build for production
npm run tauri build
```

### Project Structure

```
nodeshift/
├── src/                    # React frontend
│   ├── components/         # UI components
│   ├── hooks/              # React hooks
│   ├── i18n/               # Internationalization
│   ├── lib/                # Utilities & Tauri API wrapper
│   └── styles/             # Tailwind CSS
├── src-tauri/              # Rust backend
│   └── src/
│       ├── commands/       # Tauri IPC command handlers
│       ├── core/           # Business logic
│       └── platform/       # OS-specific implementations
├── nodeshift-shim/         # CLI shim for terminal auto-switch
└── .github/workflows/      # CI/CD
```

### Architecture

```
React (TypeScript)  <-- Tauri IPC -->  Rust Backend
    |                                      |
    v                                      v
  UI rendering                       System operations
  State management                   File I/O
  User interactions                  PATH config
                                     Download engine
                                     Version management
```

## How It Works

### Version Installation
1. Fetch version list from nodejs.org (or mirror)
2. Download binary archive (tar.xz / zip)
3. Verify SHA256 checksum
4. Extract to `~/.nodeshift/versions/vX.X.X/`
5. Create symlink: `~/.nodeshift/current` -> version directory
6. Configure system PATH to include `~/.nodeshift/current/bin`

### Version Switching
- **Unix**: Update symlink `current -> target version`
- **Windows**: Update PATH via registry + broadcast WM_SETTINGCHANGE

### Project-Level Switching
The `nodeshift-shim` binary intercepts `node`/`npm`/`npx` commands and checks for `.nvmrc` or `.node-version` in the current directory tree.

## Configuration

Config file: `~/.nodeshift/config.json`

```json
{
  "installDir": "~/.nodeshift",
  "mirror": "https://npmmirror.com/mirrors/node/",
  "currentVersion": "v22.15.0",
  "npmRegistry": "https://registry.npmmirror.com",
  "autoSwitch": true
}
```

## Built-in Mirrors

| Name | URL |
|------|-----|
| Official | https://nodejs.org/dist/ |
| npmmirror (Taobao) | https://npmmirror.com/mirrors/node/ |
| Huawei | https://repo.huaweicloud.com/nodejs/ |
| Tencent | https://mirrors.cloud.tencent.com/nodejs-release/ |

## License

MIT
