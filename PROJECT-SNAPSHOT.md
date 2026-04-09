# NodeShift - Project Snapshot

> Generated: 2026-04-09
> Version: 0.1.0
> Status: All planned features implemented

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
6. **Full i18n**: All UI strings resolved via `useTranslation()` hook with `I18nProvider` context. Supports en-US and zh-CN.
7. **System tray**: Close-to-tray with tray menu (Show/Quit). Window hidden on close, restored on tray click.
8. **Auto-update**: Tauri Updater plugin with status bar indicator and one-click download+install.
9. **Code signing**: macOS notarization + Windows signing configured in CI pipeline.
10. **Cache management**: Display cache size/count + one-click cleanup in settings.

---

## File Structure (Complete)

```
nodeshift/
├── .github/workflows/
│   ├── build.yml
│   └── release.yml                # Code signing + updater signing
├── nodeshift-shim/
│   ├── Cargo.toml
│   └── src/main.rs
├── src-tauri/
│   ├── Cargo.toml                 # tray-icon feature + tauri-plugin-updater
│   ├── tauri.conf.json            # dialog + updater + macOS bundle config
│   ├── build.rs
│   ├── icons/
│   └── src/
│       ├── main.rs
│       ├── lib.rs                 # Tray icon + hide-on-close + updater plugin
│       ├── commands/
│       │   ├── mod.rs             # Re-exports + greet + cache module
│       │   ├── cache.rs           # get_cache_info + clear_cache
│       │   ├── version.rs
│       │   ├── config.rs
│       │   └── system.rs
│       ├── core/
│       │   ├── mod.rs
│       │   ├── downloader.rs
│       │   ├── extractor.rs
│       │   ├── version_manager.rs
│       │   ├── env_config.rs
│       │   ├── mirror.rs
│       │   └── project_detect.rs
│       └── platform/
│           ├── mod.rs
│           ├── windows.rs
│           ├── macos.rs
│           └── linux.rs
├── src/
│   ├── main.tsx
│   ├── App.tsx                    # Wrapped in I18nProvider
│   ├── components/
│   │   ├── TitleBar.tsx
│   │   ├── Sidebar.tsx            # i18n wired
│   │   ├── Dashboard.tsx          # i18n wired
│   │   ├── VersionList.tsx        # i18n wired
│   │   ├── InstallDialog.tsx      # i18n + native dialog picker
│   │   ├── ProgressBar.tsx        # i18n wired
│   │   ├── SettingsPanel.tsx      # i18n + native dialog + cache management
│   │   └── StatusBar.tsx          # i18n + update status indicator
│   ├── hooks/
│   │   ├── useVersions.ts
│   │   ├── useConfig.ts
│   │   ├── useInstall.ts
│   │   └── useUpdater.ts          # Auto-update hook
│   ├── lib/
│   │   ├── tauri.ts               # pickFolder + getCacheInfo + clearCache
│   │   ├── types.ts
│   │   └── cn.ts
│   ├── styles/
│   │   └── globals.css
│   ├── i18n/
│   │   ├── index.ts               # I18nProvider + useTranslation
│   │   ├── zh-CN.json             # Full Chinese translations
│   │   └── en-US.json             # Full English translations
│   └── vite-env.d.ts
├── package.json                   # Added @tauri-apps/plugin-updater
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── index.html
├── .gitignore
├── README.md
├── DESIGN.md
├── PROJECT-SNAPSHOT.md
├── SNAPSHOT-STEP1-i18n.md
├── SNAPSHOT-STEP2-dialog.md
├── SNAPSHOT-STEP3-tray.md
├── SNAPSHOT-STEP4-updater.md
├── SNAPSHOT-STEP5-codesign.md
└── SNAPSHOT-STEP6-cache.md
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
| `get_cache_info` | - | `CacheInfo` | Get cache dir path, size, file count |
| `clear_cache` | - | `CacheInfo` | Delete all cache files, return empty info |

### Frontend-only APIs

| Function | Description |
|----------|-------------|
| `pickFolder(defaultPath?)` | Opens native folder picker via `@tauri-apps/plugin-dialog` |

---

## All Features Complete

All 6 planned "Next Steps" have been implemented:

1. **i18n** - Full bilingual support (en-US / zh-CN) wired into all components
2. **Directory picker** - Native OS folder picker for install path selection
3. **System tray** - Close-to-tray behavior with tray menu (Show / Quit)
4. **Auto-update** - Tauri Updater plugin with status bar indicator
5. **Code signing** - macOS notarization + Windows signing in CI pipeline
6. **Cache management** - Display cache size/count + one-click cleanup

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
