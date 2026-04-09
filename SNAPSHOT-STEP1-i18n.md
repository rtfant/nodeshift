# NodeShift - Project Snapshot (After Step 1: i18n Wiring)

> Generated: 2026-04-09
> Version: 0.1.0
> Status: i18n fully wired into all components

---

## Completed: Wire i18n translations into components

### What changed

1. **`src/i18n/index.ts`** - Added `I18nProvider` component wrapping `I18nContext.Provider`. Removed fallback `useI18n()` from `useTranslation()` - now throws if used outside provider.

2. **`src/App.tsx`** - Wrapped entire app in `<I18nProvider>`, making `useTranslation()` available to all child components.

3. **`src/i18n/en-US.json`** / **`src/i18n/zh-CN.json`** - Added new keys:
   - `nav.label` (Navigation / 导航)
   - `sidebar.subtitle` (Version Manager / 版本管理器)
   - `dashboard.ipcOk`, `dashboard.ipcError`, `dashboard.ipcConnecting`
   - `dashboard.path`, `dashboard.ltsCodename`, `dashboard.mirrorSource`
   - `install.releaseDate`
   - `settings.loadingSettings`
   - `mirrors.*` (official, taobao, huawei, tencent)
   - `npmRegistries.*` (official, taobao, tencent)
   - `statusBar.notInstalled`, `statusBar.versionsCount`

4. **All 7 components updated** to use `useTranslation()` hook:
   - `Sidebar.tsx` - nav labels, section header, version badge
   - `Dashboard.tsx` - all status cards, IPC status, quick start section
   - `VersionList.tsx` - title, toolbar filters, table headers, action buttons, status badges
   - `InstallDialog.tsx` - all labels, mirror names, buttons
   - `ProgressBar.tsx` - all phase labels (downloading, verifying, etc.)
   - `SettingsPanel.tsx` - all section titles/descriptions, mirror names, npm registries, buttons
   - `StatusBar.tsx` - version count, "not installed" text

### Architecture

- `I18nProvider` wraps `App` in `main.tsx` -> `App.tsx`
- All components call `useTranslation()` to get `{ t, locale, setLocale }`
- `t("key.path")` resolves nested JSON keys with optional `{param}` interpolation
- Locale auto-detected from `navigator.language` (zh -> zh-CN, else en-US)
- No hardcoded Chinese strings remain in any component

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
│   ├── App.tsx                    # ← Wraps app in I18nProvider
│   ├── components/
│   │   ├── TitleBar.tsx
│   │   ├── Sidebar.tsx            # ← i18n wired
│   │   ├── Dashboard.tsx          # ← i18n wired
│   │   ├── VersionList.tsx        # ← i18n wired
│   │   ├── InstallDialog.tsx      # ← i18n wired
│   │   ├── ProgressBar.tsx        # ← i18n wired
│   │   ├── SettingsPanel.tsx      # ← i18n wired
│   │   └── StatusBar.tsx          # ← i18n wired
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
│   │   ├── index.ts               # ← Added I18nProvider component
│   │   ├── zh-CN.json             # ← Extended with new keys
│   │   └── en-US.json             # ← Extended with new keys
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

---

## Next Steps (remaining)

- [x] Wire i18n translations into components
- [ ] Implement native directory picker via `tauri-plugin-dialog`
- [ ] System tray mode
- [ ] Auto-update via Tauri Updater plugin
- [ ] Code signing (Windows/macOS)
- [ ] Cache size display and cleanup functionality
