# NodeShift - Project Snapshot (After Step 3: System Tray Mode)

> Generated: 2026-04-09
> Version: 0.1.0
> Status: System tray mode implemented

---

## Completed Steps

1. [x] Wire i18n translations into components
2. [x] Implement native directory picker via `tauri-plugin-dialog`
3. [x] System tray mode

---

## Step 3 Changes: System Tray Mode

### What changed

1. **`src-tauri/Cargo.toml`** - Added `tray-icon` feature to tauri dependency:
   ```toml
   tauri = { version = "2", features = ["tray-icon"] }
   ```

2. **`src-tauri/src/lib.rs`** - Complete rewrite to add system tray setup:
   - Uses `tauri::tray::TrayIconBuilder` to create tray icon with app's default icon
   - Tray menu with two items: "Show NodeShift" and "Quit"
   - Left-click on tray icon shows and focuses the main window
   - "Show" menu item shows and focuses the main window
   - "Quit" menu item exits the application
   - `on_window_event` handler intercepts `CloseRequested`:
     - Calls `api.prevent_close()` to prevent window destruction
     - Hides the window to tray instead of closing
   - Window can be restored from tray click or menu "Show"

### Behavior

- Closing the window hides it to system tray (does NOT quit the app)
- Left-clicking the tray icon shows the window
- Right-clicking the tray icon shows context menu (Show / Quit)
- "Quit" from tray menu actually exits the application
- Tray icon uses the app's default icon from `src-tauri/icons/`

---

## File Structure (Complete)

```
nodeshift/
├── .github/workflows/
│   ├── build.yml
│   └── release.yml
├── nodeshift-shim/
│   ├── Cargo.toml
│   └── src/main.rs
├── src-tauri/
│   ├── Cargo.toml                 # ← Added tray-icon feature
│   ├── tauri.conf.json
│   ├── build.rs
│   ├── icons/
│   └── src/
│       ├── main.rs
│       ├── lib.rs                 # ← Added tray icon setup + hide-on-close
│       ├── commands/
│       │   ├── mod.rs
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
│   ├── App.tsx
│   ├── components/
│   │   ├── TitleBar.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Dashboard.tsx
│   │   ├── VersionList.tsx
│   │   ├── InstallDialog.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── SettingsPanel.tsx
│   │   └── StatusBar.tsx
│   ├── hooks/
│   │   ├── useVersions.ts
│   │   ├── useConfig.ts
│   │   └── useInstall.ts
│   ├── lib/
│   │   ├── tauri.ts
│   │   ├── types.ts
│   │   └── cn.ts
│   ├── styles/
│   │   └── globals.css
│   ├── i18n/
│   │   ├── index.ts
│   │   ├── zh-CN.json
│   │   └── en-US.json
│   └── vite-env.d.ts
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── index.html
├── .gitignore
├── README.md
├── DESIGN.md
└── PROJECT-SNAPSHOT.md
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

### Frontend-only APIs

| Function | Description |
|----------|-------------|
| `pickFolder(defaultPath?)` | Opens native folder picker via `@tauri-apps/plugin-dialog` |

---

## Next Steps (remaining)

- [x] Wire i18n translations into components
- [x] Implement native directory picker via `tauri-plugin-dialog`
- [x] System tray mode
- [ ] Auto-update via Tauri Updater plugin
- [ ] Code signing (Windows/macOS)
- [ ] Cache size display and cleanup functionality
