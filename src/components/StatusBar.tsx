import { useState, useEffect } from "react";
import { Package, HardDrive, Cpu } from "lucide-react";
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
      } catch {
        // Silently fail in browser mode
      }
    };
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  const installedCount = config ? Object.keys(config.versions).length : 0;
  const ltsName = currentVersion && config?.versions[currentVersion]?.lts;

  return (
    <div className="flex items-center gap-4 border-t border-border bg-sidebar px-4 py-1.5 text-[10px] text-muted-foreground">
      <div className="flex items-center gap-1.5">
        <Package size={11} className={currentVersion ? "text-primary" : ""} />
        <span>
          {currentVersion ? (
            <>
              <span className="font-medium text-foreground">{currentVersion}</span>
              {ltsName && <span className="ml-1 opacity-70">({ltsName})</span>}
            </>
          ) : (
            "未安装"
          )}
        </span>
      </div>

      <div className="h-2.5 w-px bg-border" />

      <div className="flex items-center gap-1.5">
        <HardDrive size={11} />
        <span>{installedCount} 个版本</span>
      </div>

      <div className="h-2.5 w-px bg-border" />

      <div className="flex items-center gap-1.5">
        <Cpu size={11} />
        <span>
          {systemInfo
            ? `${systemInfo.platform} / ${systemInfo.arch}`
            : "..."}
        </span>
      </div>

      <div className="ml-auto">
        <span className="opacity-50">NodeShift v0.1.0</span>
      </div>
    </div>
  );
}
