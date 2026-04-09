# NodeShift - Project Snapshot (After Step 4: Auto-Update)

> Generated: 2026-04-09
> Version: 0.1.0
> Status: Auto-update via Tauri Updater plugin implemented

---

## Completed Steps

1. [x] Wire i18n translations into components
2. [x] Implement native directory picker via `tauri-plugin-dialog`
3. [x] System tray mode
4. [x] Auto-update via Tauri Updater plugin

---

## Step 4 Changes: Auto-Update

### What changed

1. **`src-tauri/Cargo.toml`** - Added `tauri-plugin-updater = "2"` dependency.

2. **`package.json`** - Added `@tauri-apps/plugin-updater: "^2.5.0"` to dependencies.

3. **`src-tauri/tauri.conf.json`** - Added `updater` plugin config:
   ```json
   "updater": {
     "endpoints": ["https://github.com/nicehash/nodeshift/releases/latest/download/latest.json"],
     "pubkey": ""
   }
   ```
   Note: `pubkey` must be set to the real signing key before production release.

4. **`src-tauri/src/lib.rs`** - Registered updater plugin:
   ```rust
   .plugin(tauri_plugin_updater::Builder::new().build())
   ```

5. **`src/hooks/useUpdater.ts`** - New hook providing:
   - `status`: idle | checking | available | downloading | ready | error | up-to-date
   - `updateInfo`: `{ version, body }` when available
   - `checkForUpdates()`: manually trigger check
   - `downloadAndInstall()`: download and apply update
   - Auto-checks 3 seconds after mount
   - Browser mock: immediately returns "up-to-date"

6. **`src/components/StatusBar.tsx`** - Added update indicator in status bar:
   - Shows spinner while checking
   - Clickable "Update vX.Y.Z available" when update found
   - Shows download progress
   - Shows "Update ready. Restart to apply." when downloaded

7. **`src/i18n/en-US.json`** + **`src/i18n/zh-CN.json`** - Added `updater.*` keys.

### Update Flow

1. App starts -> 3s delay -> `check()` from `@tauri-apps/plugin-updater`
2. If update available, status bar shows green notification
3. User clicks -> `downloadAndInstall()` starts
4. After download, user prompted to restart
5. On restart, Tauri applies the update

### Production Setup Required

- Generate signing keypair with `tauri signer generate`
- Set `TAURI_SIGNING_PRIVATE_KEY` and `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` in CI
- Put the public key in `tauri.conf.json` plugins.updater.pubkey
- GitHub releases must include `latest.json` alongside platform bundles

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
│   ├── Cargo.toml                 # ← Added tauri-plugin-updater
│   ├── tauri.conf.json            # ← Added updater endpoint config
│   ├── build.rs
│   ├── icons/
│   └── src/
│       ├── main.rs
│       ├── lib.rs                 # ← Registered updater plugin
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
│   │   └── StatusBar.tsx          # ← Added update status indicator
│   ├── hooks/
│   │   ├── useVersions.ts
│   │   ├── useConfig.ts
│   │   ├── useInstall.ts
│   │   └── useUpdater.ts          # ← NEW: auto-update hook
│   ├── lib/
│   │   ├── tauri.ts
│   │   ├── types.ts
│   │   └── cn.ts
│   ├── styles/
│   │   └── globals.css
│   ├── i18n/
│   │   ├── index.ts
│   │   ├── zh-CN.json             # ← Added updater.* keys
│   │   └── en-US.json             # ← Added updater.* keys
│   └── vite-env.d.ts
├── package.json                   # ← Added @tauri-apps/plugin-updater
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

## Next Steps (remaining)

- [x] Wire i18n translations into components
- [x] Implement native directory picker via `tauri-plugin-dialog`
- [x] System tray mode
- [x] Auto-update via Tauri Updater plugin
- [ ] Code signing (Windows/macOS)
- [ ] Cache size display and cleanup functionality
