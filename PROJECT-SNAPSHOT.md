# NodeShift - Project Snapshot

> Generated: 2026-04-09
> Version: 0.1.0
> Status: MVP complete, ready for build

---

## Quick Summary

NodeShift is a cross-platform, portable, GUI-based Node.js version manager built with:

| Layer | Technology |
|-------|-----------|
| Framework | Tauri 2.x |
| Frontend | React 19 + TypeScript 6 + Tailwind CSS v4 |
| Backend | Rust (system operations, downloads, env config) |
| Build | Vite 8 + GitHub Actions (4-platform matrix) |
| Packaging | Portable single exe + installer (NSIS/DMG/AppImage) |

---

## Key Design Decisions

1. **Portable first**: Binary compiles to a single exe. `profile.release` optimized with `lto=true`, `strip=true`, `codegen-units=1`, `opt-level="s"`, `panic="abort"` for minimal size.
2. **Custom title bar**: Native decorations disabled (`decorations: false`), custom `TitleBar.tsx` component with drag region and window controls.
3. **Dark theme only** (initial release): Color tokens defined in `globals.css` via `@theme`. Primary green (#22c55e), deep dark background (#09090b).
4. **Browser mock mode**: `src/lib/tauri.ts` detects Tauri runtime; falls back to mock IPC for browser-based development.
5. **Mirror acceleration**: Built-in support for npmmirror, Huawei, Tencent mirrors for users in China.

---

## File Structure (Complete)

```
nodeshift/
├── .github/workflows/
│   ├── build.yml                  # CI: build + test (4 targets)
│   └── release.yml                # CD: release + portable zip (4 targets)
├── nodeshift-shim/                # CLI shim for project-level auto-switch
│   ├── Cargo.toml
│   └── src/main.rs
├── src-tauri/                     # Rust backend
│   ├── Cargo.toml                 # Dependencies + release profile
│   ├── tauri.conf.json            # App config, bundle targets, window settings
│   ├── build.rs
│   ├── icons/                     # App icons (PNG/ICO/ICNS)
│   └── src/
│       ├── main.rs                # Entry point
│       ├── lib.rs                 # Tauri builder + command registration
│       ├── commands/
│       │   ├── mod.rs             # Re-exports + greet command
│       │   ├── version.rs         # fetch/install/switch/uninstall/detect
│       │   ├── config.rs          # AppConfig load/save
│       │   └── system.rs          # OS/arch detection
│       ├── core/
│       │   ├── mod.rs
│       │   ├── downloader.rs      # Streaming download + SHA256 verify
│       │   ├── extractor.rs       # tar.xz / zip / tar.gz extraction
│       │   ├── version_manager.rs # Install/switch/uninstall logic
│       │   ├── env_config.rs      # PATH/shell config management
│       │   ├── mirror.rs          # Mirror URL builder
│       │   └── project_detect.rs  # .nvmrc / .node-version detection
│       └── platform/
│           ├── mod.rs             # PlatformOps trait
│           ├── windows.rs         # Registry + WM_SETTINGCHANGE
│           ├── macos.rs           # Symlink + .zshrc
│           └── linux.rs           # Symlink + shell config
├── src/                           # React frontend
│   ├── main.tsx                   # React entry
│   ├── App.tsx                    # Root layout (TitleBar + Sidebar + Pages + StatusBar)
│   ├── components/
│   │   ├── TitleBar.tsx           # Custom window title bar with drag + controls
│   │   ├── Sidebar.tsx            # Left nav with active indicator
│   │   ├── Dashboard.tsx          # Overview: status cards + active version
│   │   ├── VersionList.tsx        # Version table with filter/search/actions
│   │   ├── InstallDialog.tsx      # Install confirmation modal
│   │   ├── ProgressBar.tsx        # Download/install progress
│   │   ├── SettingsPanel.tsx      # All settings with save/reset
│   │   └── StatusBar.tsx          # Bottom bar: version/count/platform
│   ├── hooks/
│   │   ├── useVersions.ts         # Version list fetch + filter
│   │   ├── useConfig.ts           # Config state management
│   │   └── useInstall.ts          # Install state machine
│   ├── lib/
│   │   ├── tauri.ts               # Tauri IPC wrapper + browser mock
│   │   ├── types.ts               # TypeScript type definitions
│   │   └── cn.ts                  # Class name utility
│   ├── styles/
│   │   └── globals.css            # Tailwind v4 + dark theme tokens
│   ├── i18n/
│   │   ├── index.ts               # i18n hook + context
│   │   ├── zh-CN.json             # Chinese translations
│   │   └── en-US.json             # English translations
│   └── vite-env.d.ts
├── package.json                   # npm dependencies + scripts
├── tsconfig.json                  # TypeScript config
├── tsconfig.node.json             # Vite config TS
├── vite.config.ts                 # Vite + React + Tailwind
├── index.html                     # HTML shell
├── .gitignore
├── README.md
├── DESIGN.md                      # Full design document (v2.0)
└── PROJECT-SNAPSHOT.md            # This file
```

---

## Tauri Commands (IPC Interface)

| Command | Args | Returns | Description |
|---------|------|---------|-------------|
| `greet` | `name: String` | `String` | IPC smoke test |
| `fetch_versions` | - | `Vec<NodeVersion>` | Fetch from nodejs.org/dist/index.json |
| `get_current_version` | - | `Option<String>` | Currently active version |
| `install_version` | `version, installDir, mirror, ltsName` | - | Download + verify + extract + configure |
| `switch_version` | `version: String` | - | Switch active version (symlink/PATH) |
| `uninstall_version` | `version: String` | - | Remove version + cleanup |
| `get_config` | - | `AppConfig` | Read config.json |
| `save_config` | `config: AppConfig` | - | Write config.json |
| `get_system_info` | - | `SystemInfo` | OS, arch, platform |
| `detect_project_version` | `dir: String` | `Option<ProjectVersionInfo>` | Check .nvmrc/.node-version |

---

## Build Commands

```bash
# Development (browser mock mode)
npm run dev

# Development (full Tauri with Rust backend)
npm run tauri dev

# Production build
npm run tauri build

# Production build for specific target
npm run tauri build -- --target x86_64-pc-windows-msvc
npm run tauri build -- --target aarch64-apple-darwin
npm run tauri build -- --target x86_64-apple-darwin
npm run tauri build -- --target x86_64-unknown-linux-gnu
```

Output binary location: `src-tauri/target/{target}/release/nodeshift[.exe]`

---

## GitHub Actions

### `build.yml` (CI)
- Triggers: push to main/develop, PRs to main
- Matrix: 4 targets (Linux x64, macOS ARM, macOS x64, Windows x64)
- Uploads: portable binary + installer artifacts

### `release.yml` (CD)
- Triggers: push `v*` tags
- Creates draft GitHub Release with:
  - Portable zip per platform (single exe, extract and run)
  - Installer per platform (.msi, .dmg, .deb, .AppImage)

### Release workflow:
```bash
git tag v0.1.0
git push origin v0.1.0
# -> GitHub Actions builds 4 platforms
# -> Draft release created with portable zips + installers
```

---

## Binary Size Optimization

Cargo.toml `[profile.release]`:
```toml
strip = true        # Strip debug symbols
lto = true          # Link-time optimization
codegen-units = 1   # Single codegen unit for better optimization
opt-level = "s"     # Optimize for size
panic = "abort"     # No unwinding, smaller binary
```

Expected portable binary size: ~8-12MB (varies by platform).

---

## Next Steps (not yet implemented)

- [ ] Wire i18n translations into components (infrastructure ready, strings hardcoded)
- [ ] Implement native directory picker via `tauri-plugin-dialog`
- [ ] System tray mode
- [ ] Auto-update via Tauri Updater plugin
- [ ] Code signing (Windows/macOS)
- [ ] Cache size display and cleanup functionality
