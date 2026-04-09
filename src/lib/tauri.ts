import type { NodeVersion, AppConfig, SystemInfo } from "./types";

// Detect if running inside Tauri
const isTauri = typeof window !== "undefined" && !!(window as any).__TAURI_INTERNALS__;

async function tauriInvoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  if (isTauri) {
    const { invoke } = await import("@tauri-apps/api/core");
    return invoke<T>(cmd, args);
  }
  return mockInvoke<T>(cmd, args);
}

// ---------- Mock storage for browser mode ----------

let mockConfig: AppConfig = {
  version: "1.0.0",
  installDir: "~/.nodeshift",
  mirror: "https://npmmirror.com/mirrors/node/",
  currentVersion: null,
  proxy: null,
  npmRegistry: "https://registry.npmmirror.com",
  autoSwitch: true,
  versions: {},
};

async function mockInvoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  switch (cmd) {
    case "greet":
      return `Hello, ${args?.name}! NodeShift IPC is working. (Browser Mock)` as T;

    case "fetch_versions":
      return fetchVersionsMock() as T;

    case "get_config":
      return { ...mockConfig } as T;

    case "save_config":
      if (args?.config) mockConfig = args.config as AppConfig;
      return undefined as T;

    case "get_system_info":
      return {
        os: navigator.platform.includes("Win")
          ? "windows"
          : navigator.platform.includes("Mac")
            ? "macos"
            : "linux",
        arch: "x64",
        platform: navigator.platform.includes("Win")
          ? "windows"
          : navigator.platform.includes("Mac")
            ? "macos"
            : "linux",
      } as T;

    case "install_version": {
      const version = args?.version as string;
      const ltsName = (args as any)?.ltsName || null;
      await new Promise((r) => setTimeout(r, 2000));
      mockConfig.versions[version] = {
        version,
        path: `${mockConfig.installDir}/versions/${version}`,
        installedAt: new Date().toISOString(),
        lts: ltsName,
      };
      if (!mockConfig.currentVersion) {
        mockConfig.currentVersion = version;
      }
      return undefined as T;
    }

    case "switch_version": {
      const ver = args?.version as string;
      if (mockConfig.versions[ver]) {
        mockConfig.currentVersion = ver;
      }
      return undefined as T;
    }

    case "uninstall_version": {
      const ver = args?.version as string;
      const wasActive = mockConfig.currentVersion === ver;
      delete mockConfig.versions[ver];
      if (wasActive) {
        const remaining = Object.keys(mockConfig.versions);
        mockConfig.currentVersion = remaining.length > 0 ? remaining[0] : null;
      }
      return undefined as T;
    }

    case "detect_project_version": {
      return null as T;
    }

    case "get_current_version":
      return (mockConfig.currentVersion ?? null) as T;

    case "get_cache_info":
      return {
        cacheDir: `${mockConfig.installDir}/cache`,
        totalSize: 52428800,
        fileCount: 3,
      } as T;

    case "clear_cache":
      return {
        cacheDir: `${mockConfig.installDir}/cache`,
        totalSize: 0,
        fileCount: 0,
      } as T;

    default:
      console.warn(`Unknown mock command: ${cmd}`);
      return undefined as T;
  }
}

async function fetchVersionsMock(): Promise<NodeVersion[]> {
  try {
    const resp = await fetch("https://nodejs.org/dist/index.json");
    const data: NodeVersion[] = await resp.json();
    return data;
  } catch {
    return [
      { version: "v22.15.0", date: "2025-04-01", files: [], npm: "10.9.2", v8: "12.4.254.21", uv: "1.49.2", zlib: "1.3.1", openssl: "3.0.15", modules: "127", lts: "Jod", security: false },
      { version: "v20.19.0", date: "2025-03-10", files: [], npm: "10.8.2", v8: "11.3.244.8", uv: "1.46.0", zlib: "1.3.1", openssl: "3.0.14", modules: "115", lts: "Iron", security: false },
      { version: "v23.11.0", date: "2025-03-20", files: [], npm: "10.9.2", v8: "12.4.254.21", uv: "1.49.2", zlib: "1.3.1", openssl: "3.0.15", modules: "131", lts: false, security: false },
    ];
  }
}

// ---------- Public API ----------

export async function fetchVersions(): Promise<NodeVersion[]> {
  return tauriInvoke("fetch_versions");
}

export async function getConfig(): Promise<AppConfig> {
  return tauriInvoke("get_config");
}

export async function saveConfig(config: AppConfig): Promise<void> {
  return tauriInvoke("save_config", { config });
}

export async function getSystemInfo(): Promise<SystemInfo> {
  return tauriInvoke("get_system_info");
}

export async function installVersion(
  version: string,
  installDir: string,
  mirror: string,
  ltsName?: string | false,
): Promise<void> {
  return tauriInvoke("install_version", { version, installDir, mirror, ltsName: ltsName || null });
}

export async function switchVersion(version: string): Promise<void> {
  return tauriInvoke("switch_version", { version });
}

export async function uninstallVersion(version: string): Promise<void> {
  return tauriInvoke("uninstall_version", { version });
}

export async function getCurrentVersion(): Promise<string | null> {
  return tauriInvoke("get_current_version");
}

export interface ProjectVersionInfo {
  version: string;
  sourceFile: string;
  sourceDir: string;
}

export async function detectProjectVersion(dir: string): Promise<ProjectVersionInfo | null> {
  return tauriInvoke("detect_project_version", { dir });
}

export async function greet(name: string): Promise<string> {
  return tauriInvoke("greet", { name });
}

export interface CacheInfo {
  cacheDir: string;
  totalSize: number;
  fileCount: number;
}

export async function getCacheInfo(): Promise<CacheInfo> {
  return tauriInvoke("get_cache_info");
}

export async function clearCache(): Promise<CacheInfo> {
  return tauriInvoke("clear_cache");
}

export async function pickFolder(defaultPath?: string): Promise<string | null> {
  if (isTauri) {
    const { open } = await import("@tauri-apps/plugin-dialog");
    const selected = await open({ directory: true, multiple: false, defaultPath });
    return selected as string | null;
  }
  return null;
}
