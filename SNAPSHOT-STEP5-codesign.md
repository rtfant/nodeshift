# NodeShift - Project Snapshot (After Step 5: Code Signing)

> Generated: 2026-04-09
> Version: 0.1.0
> Status: Code signing configured for Windows and macOS

---

## Completed Steps

1. [x] Wire i18n translations into components
2. [x] Implement native directory picker via `tauri-plugin-dialog`
3. [x] System tray mode
4. [x] Auto-update via Tauri Updater plugin
5. [x] Code signing (Windows/macOS)

---

## Step 5 Changes: Code Signing

### What changed

1. **`.github/workflows/release.yml`** - Added code signing support:

   **macOS code signing & notarization:**
   - Step to import Apple Developer certificate from `APPLE_CERTIFICATE` secret (base64-encoded .p12)
   - Creates a temporary keychain for the CI build
   - Passes signing environment variables to tauri-action:
     - `APPLE_SIGNING_IDENTITY` - Certificate identity
     - `APPLE_ID` - Apple ID email for notarization
     - `APPLE_PASSWORD` - App-specific password for notarization
     - `APPLE_TEAM_ID` - Apple Developer team ID

   **Windows code signing:**
   - `TAURI_WINDOWS_SIGN_COMMAND` - Custom sign command (supports EV certificates, cloud signing services like Azure SignTool, DigiCert KeyLocker, etc.)

   **Tauri Updater signing:**
   - `TAURI_SIGNING_PRIVATE_KEY` - Private key for signing update bundles
   - `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` - Password for the signing key

2. **`src-tauri/tauri.conf.json`** - Added `macOS` bundle section:
   ```json
   "macOS": {
     "signingIdentity": null,
     "entitlements": null
   }
   ```
   - `signingIdentity: null` means use `APPLE_SIGNING_IDENTITY` env var at build time
   - `entitlements: null` uses Tauri's default entitlements

### Required GitHub Secrets

| Secret | Platform | Description |
|--------|----------|-------------|
| `APPLE_CERTIFICATE` | macOS | Base64-encoded .p12 developer certificate |
| `APPLE_CERTIFICATE_PASSWORD` | macOS | Password for the .p12 certificate |
| `APPLE_SIGNING_IDENTITY` | macOS | e.g. "Developer ID Application: Your Name (TEAMID)" |
| `APPLE_ID` | macOS | Apple ID email for notarization |
| `APPLE_PASSWORD` | macOS | App-specific password for notarization |
| `APPLE_TEAM_ID` | macOS | 10-char team ID from developer.apple.com |
| `WINDOWS_SIGN_COMMAND` | Windows | Custom signing command (e.g. AzureSignTool) |
| `TAURI_SIGNING_PRIVATE_KEY` | All | Updater signing private key (from `tauri signer generate`) |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | All | Password for the updater signing key |

### Setup Instructions

**1. Generate Tauri Updater signing keys:**
```bash
npx tauri signer generate -w ~/.tauri/nodeshift.key
```
This produces a keypair. Put the private key content in `TAURI_SIGNING_PRIVATE_KEY` secret and the public key in `tauri.conf.json` plugins.updater.pubkey.

**2. macOS signing:**
- Enroll in Apple Developer Program
- Create a "Developer ID Application" certificate
- Export as .p12, base64-encode: `base64 -i cert.p12 | pbcopy`
- Set all APPLE_* secrets in GitHub repo settings

**3. Windows signing:**
- Use a code signing certificate from a trusted CA
- Set `WINDOWS_SIGN_COMMAND` to your signing tool command
- Example for Azure SignTool: `AzureSignTool sign -kvu ... -kvi ... -kvt ... -kvc ... -tr http://timestamp.digicert.com -td sha256 "%1"`

---

## File Structure (Complete)

```
nodeshift/
├── .github/workflows/
│   ├── build.yml
│   └── release.yml                # ← Added code signing + updater signing
├── nodeshift-shim/
│   ├── Cargo.toml
│   └── src/main.rs
├── src-tauri/
│   ├── Cargo.toml
│   ├── tauri.conf.json            # ← Added macOS bundle config
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
│   │   ├── InstallDialog.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── SettingsPanel.tsx
│   │   └── StatusBar.tsx
│   ├── hooks/
│   │   ├── useVersions.ts
│   │   ├── useConfig.ts
│   │   ├── useInstall.ts
│   │   └── useUpdater.ts
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

## Next Steps (remaining)

- [x] Wire i18n translations into components
- [x] Implement native directory picker via `tauri-plugin-dialog`
- [x] System tray mode
- [x] Auto-update via Tauri Updater plugin
- [x] Code signing (Windows/macOS)
- [ ] Cache size display and cleanup functionality
