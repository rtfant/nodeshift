import { useState, useEffect } from "react";
import { Package, HardDrive, Cpu, Loader2, ArrowDownCircle, CheckCircle2 } from "lucide-react";
import { getCurrentVersion, getConfig, getSystemInfo } from "@/lib/tauri";
import { useTranslation } from "@/i18n";
import { useUpdater } from "@/hooks/useUpdater";
import type { AppConfig, SystemInfo } from "@/lib/types";

export default function StatusBar() {
  const { t } = useTranslation();
  const { status: updateStatus, updateInfo, downloadAndInstall } = useUpdater();
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
            t("statusBar.notInstalled")
          )}
        </span>
      </div>

      <div className="h-2.5 w-px bg-border" />

      <div className="flex items-center gap-1.5">
        <HardDrive size={11} />
        <span>{t("statusBar.versionsCount", { count: String(installedCount) })}</span>
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

      {/* Update status indicator */}
      {updateStatus === "checking" && (
        <>
          <div className="h-2.5 w-px bg-border" />
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Loader2 size={11} className="animate-spin" />
            <span>{t("updater.checking")}</span>
          </div>
        </>
      )}
      {updateStatus === "available" && updateInfo && (
        <>
          <div className="h-2.5 w-px bg-border" />
          <button
            onClick={downloadAndInstall}
            className="flex items-center gap-1.5 text-primary hover:underline"
          >
            <ArrowDownCircle size={11} />
            <span>{t("updater.available", { version: updateInfo.version })}</span>
          </button>
        </>
      )}
      {updateStatus === "downloading" && (
        <>
          <div className="h-2.5 w-px bg-border" />
          <div className="flex items-center gap-1.5 text-primary">
            <Loader2 size={11} className="animate-spin" />
            <span>{t("updater.downloading")}</span>
          </div>
        </>
      )}
      {updateStatus === "ready" && (
        <>
          <div className="h-2.5 w-px bg-border" />
          <div className="flex items-center gap-1.5 text-success">
            <CheckCircle2 size={11} />
            <span>{t("updater.ready")}</span>
          </div>
        </>
      )}

      <div className="ml-auto">
        <span className="opacity-50">NodeShift {t("app.version")}</span>
      </div>
    </div>
  );
}
