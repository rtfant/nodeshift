import { useState, useEffect } from "react";
import { Package, HardDrive, Cpu, RefreshCw } from "lucide-react";
import { getCurrentVersion, getConfig, getSystemInfo } from "@/lib/tauri";
import type { AppConfig, SystemInfo } from "@/lib/types";

export default function StatusBar() {
  const [currentVersion, setCurrentVersion] = useState<string | null>(null);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [ver, cfg, sys] = await Promise.all([
          getCurrentVersion(),
          getConfig(),
          getSystemInfo(),
        ]);
        setCurrentVersion(ver);
        setConfig(cfg);
        setSystemInfo(sys);
      } catch (e) {
        console.error("Failed to load status bar data:", e);
      }
    };
    load();

    // Refresh every 5 seconds
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  const installedCount = config ? Object.keys(config.versions).length : 0;
  const ltsName = currentVersion && config?.versions[currentVersion]?.lts;

  return (
    <div className="flex items-center gap-4 border-t border-border bg-card px-4 py-2 text-xs text-muted-foreground">
      <div className="flex items-center gap-1.5">
        <Package size={12} className={currentVersion ? "text-primary" : ""} />
        <span>
          {currentVersion ? (
            <>
              <span className="font-medium text-foreground">{currentVersion}</span>
              {ltsName && <span className="ml-1">({ltsName})</span>}
            </>
          ) : (
            "未安装"
          )}
        </span>
      </div>

      <div className="h-3 w-px bg-border" />

      <div className="flex items-center gap-1.5">
        <HardDrive size={12} />
        <span>{installedCount} 个版本</span>
      </div>

      <div className="h-3 w-px bg-border" />

      <div className="flex items-center gap-1.5">
        <Cpu size={12} />
        <span>
          {systemInfo
            ? `${systemInfo.platform} / ${systemInfo.arch}`
            : "..."}
        </span>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <span>NodeShift v0.1.0</span>
      </div>
    </div>
  );
}
