# NodeShift - Project Snapshot (After Step 6: Cache Size Display and Cleanup)

> Generated: 2026-04-09
> Version: 0.1.0
> Status: All planned features implemented

---

## Completed Steps

1. [x] Wire i18n translations into components
2. [x] Implement native directory picker via `tauri-plugin-dialog`
3. [x] System tray mode
4. [x] Auto-update via Tauri Updater plugin
5. [x] Code signing (Windows/macOS)
6. [x] Cache size display and cleanup functionality

---

## Step 6 Changes: Cache Size Display and Cleanup

### What changed

1. **`src-tauri/src/commands/cache.rs`** - NEW file with two Tauri commands:
   - `get_cache_info()` -> `CacheInfo { cacheDir, totalSize, fileCount }` - Recursively calculates cache directory size and file count
   - `clear_cache()` -> `CacheInfo` - Removes all files in cache directory and returns empty CacheInfo
   - Uses `dirs::home_dir()` to resolve `~` in install path
   - Returns zeros if cache directory doesn't exist yet

2. **`src-tauri/src/commands/mod.rs`** - Added `pub mod cache` to register module.

3. **`src-tauri/src/lib.rs`** - Registered new commands in `invoke_handler`:
   ```rust
   commands::cache::get_cache_info,
   commands::cache::clear_cache,
   ```

4. **`src/lib/tauri.ts`** - Added frontend API wrappers:
   - `getCacheInfo()` -> `CacheInfo` type
   - `clearCache()` -> `CacheInfo` type
   - Browser mock returns 50MB/3 files for `get_cache_info`, zeros for `clear_cache`

5. **`src/components/SettingsPanel.tsx`** - Cache management section now fully functional:
   - Displays actual cache directory path from backend
   - Shows cache size (formatted: B/KB/MB/GB) and file count
   - Shows "Cache is empty" when no files present
   - "Clear Cache" button with loading spinner and success state
   - Button disabled when cache is empty or clearing in progress
   - Auto-loads cache info on mount

6. **`src/i18n/en-US.json`** + **`src/i18n/zh-CN.json`** - Added cache keys:
   - `settings.cacheSize`, `settings.cacheFiles`, `settings.cacheEmpty`
   - `settings.clearing`, `settings.cleared`

### CacheInfo Type

```typescript
interface CacheInfo {
  cacheDir: string;    // Absolute path to cache directory
  totalSize: number;   // Total bytes
  fileCount: number;   // Number of files
}
```

### Behavior

- On settings page load, `getCacheInfo()` is called to display current cache state
- Cache size is formatted with appropriate units (B/KB/MB/GB)
- Clear button shows spinner while clearing, then "Cleared" checkmark for 2 seconds
- After clearing, cache info updates to show 0 B / 0 files

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
│   ├── tauri.conf.json
│   ├── build.rs
│   ├── icons/
│   └── src/
│       ├── main.rs
│       ├── lib.rs                 # ← Registered cache commands
│       ├── commands/
│       │   ├── mod.rs             # ← Added pub mod cache
│       │   ├── cache.rs           # ← NEW: get_cache_info + clear_cache
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
│   │   ├── SettingsPanel.tsx      # ← Cache section now functional
│   │   └── StatusBar.tsx
│   ├── hooks/
│   │   ├── useVersions.ts
│   │   ├── useConfig.ts
│   │   ├── useInstall.ts
│   │   └── useUpdater.ts
│   ├── lib/
│   │   ├── tauri.ts               # ← Added getCacheInfo + clearCache + CacheInfo type
│   │   ├── types.ts
│   │   └── cn.ts
│   ├── styles/
│   │   └── globals.css
│   ├── i18n/
│   │   ├── index.ts
│   │   ├── zh-CN.json             # ← Added cache display keys
│   │   └── en-US.json             # ← Added cache display keys
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
