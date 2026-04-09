/** Node.js 版本信息 */
export interface NodeVersion {
  version: string;
  date: string;
  files: string[];
  npm: string;
  v8: string;
  uv: string;
  zlib: string;
  openssl: string;
  modules: string;
  lts: string | false;
  security: boolean;
}

/** 已安装的版本信息 */
export interface InstalledVersion {
  version: string;
  path: string;
  installedAt: string;
  lts: string | null;
}

/** 镜像源配置 */
export interface MirrorSource {
  name: string;
  url: string;
  region: string;
}

/** 应用配置 */
export interface AppConfig {
  version: string;
  installDir: string;
  mirror: string;
  currentVersion: string | null;
  proxy: string | null;
  npmRegistry: string;
  autoSwitch: boolean;
  versions: Record<string, InstalledVersion>;
}

/** 下载进度 */
export interface DownloadProgress {
  downloaded: number;
  total: number;
  speed: number;
  percentage: number;
}

/** 安装状态 */
export type InstallStatus =
  | { type: "idle" }
  | { type: "downloading"; progress: DownloadProgress }
  | { type: "verifying" }
  | { type: "extracting" }
  | { type: "configuring" }
  | { type: "completed" }
  | { type: "error"; message: string };

/** 系统信息 */
export interface SystemInfo {
  os: string;
  arch: string;
  platform: "windows" | "macos" | "linux";
}
