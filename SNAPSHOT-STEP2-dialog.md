# NodeShift - Project Snapshot (After Step 2: Native Directory Picker)

> Generated: 2026-04-09
> Version: 0.1.0
> Status: Native directory picker wired via tauri-plugin-dialog

---

## Completed Steps

1. [x] Wire i18n translations into components
2. [x] Implement native directory picker via `tauri-plugin-dialog`

---

## Step 2 Changes: Native Directory Picker

### What changed

1. **`src-tauri/tauri.conf.json`** - Added `"dialog": { "open": true }` to plugins section to enable dialog permissions.

2. **`src/lib/tauri.ts`** - Added `pickFolder(defaultPath?)` function:
   - In Tauri: imports `@tauri-apps/plugin-dialog` and calls `open({ directory: true, multiple: false, defaultPath })`
   - In browser mock: returns `null` (no native dialog available)

3. **`src/components/InstallDialog.tsx`** - "Browse" button now calls `pickFolder(installDir)` and updates the install path when a folder is selected.

4. **`src/components/SettingsPanel.tsx`** - "Browse" button now calls `pickFolder(installDir)`, updates the path, and marks the form dirty.

### Dependencies (already present)

- `@tauri-apps/plugin-dialog` v2.7.0 in `package.json`
- `tauri-plugin-dialog = "2"` in `Cargo.toml`
- Plugin initialized in `lib.rs`: `.plugin(tauri_plugin_dialog::init())`

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
│   ├── Cargo.toml
│   ├── tauri.conf.json            # ← Added dialog plugin permissions
│   ├── build.rs
│   ├── icons/
│   └── src/
│       ├── main.rs
│       ├── lib.rs
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
│   │   ├── InstallDialog.tsx      # ← Browse button wired to native dialog
│   │   ├── ProgressBar.tsx
│   │   ├── SettingsPanel.tsx      # ← Browse button wired to native dialog
│   │   └── StatusBar.tsx
│   ├── hooks/
│   │   ├── useVersions.ts
│   │   ├── useConfig.ts
│   │   └── useInstall.ts
│   ├── lib/
│   │   ├── tauri.ts               # ← Added pickFolder() function
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

### Frontend-only APIs (no IPC)

| Function | Description |
|----------|-------------|
| `pickFolder(defaultPath?)` | Opens native folder picker via `@tauri-apps/plugin-dialog`, returns selected path or null |

---

## Next Steps (remaining)

- [x] Wire i18n translations into components
- [x] Implement native directory picker via `tauri-plugin-dialog`
- [ ] System tray mode
- [ ] Auto-update via Tauri Updater plugin
- [ ] Code signing (Windows/macOS)
- [ ] Cache size display and cleanup functionality
