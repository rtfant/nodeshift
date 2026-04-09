import { useState, useEffect } from "react";
import { Monitor, HardDrive, Package, ArrowRight, Zap } from "lucide-react";
import { greet, getSystemInfo, getConfig } from "@/lib/tauri";
import { useTranslation } from "@/i18n";
import type { AppConfig, SystemInfo } from "@/lib/types";

interface DashboardProps {
  onNavigate?: (page: string) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { t } = useTranslation();
  const [ipcStatus, setIpcStatus] = useState<"testing" | "ok" | "error">("testing");
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [config, setConfig] = useState<AppConfig | null>(null);

  useEffect(() => {
    greet("NodeShift")
      .then(() => setIpcStatus("ok"))
      .catch(() => setIpcStatus("error"));

    getSystemInfo().then(setSystemInfo).catch(() => {});
    getConfig().then(setConfig).catch(() => {});
  }, []);

  const installedCount = config ? Object.keys(config.versions).length : 0;
  const currentVersion = config?.currentVersion;
  const currentLts = currentVersion && config?.versions[currentVersion]?.lts;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t("dashboard.title")}</h1>
        <div className="flex items-center gap-2">
          <div
            className={`h-2 w-2 rounded-full ${
              ipcStatus === "ok"
                ? "bg-success"
                : ipcStatus === "error"
                  ? "bg-destructive"
                  : "bg-warning animate-pulse"
            }`}
          />
          <span className="text-[11px] text-muted-foreground">
            {ipcStatus === "ok"
              ? t("dashboard.ipcOk")
              : ipcStatus === "error"
                ? t("dashboard.ipcError")
                : t("dashboard.ipcConnecting")}
          </span>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatusCard
          icon={<Package size={18} />}
          label={t("dashboard.currentVersion")}
          value={currentVersion ?? t("dashboard.notInstalled")}
          sublabel={
            currentVersion
              ? currentLts
                ? `${currentLts} LTS`
                : "Current"
              : t("dashboard.noNodeInstalled")
          }
          highlight={!!currentVersion}
        />
        <StatusCard
          icon={<HardDrive size={18} />}
          label={t("dashboard.installedVersions")}
          value={String(installedCount)}
          sublabel={t("dashboard.versionsCount")}
        />
        <StatusCard
          icon={<Monitor size={18} />}
          label={t("dashboard.systemPlatform")}
          value={
            systemInfo
              ? systemInfo.platform === "macos"
                ? "macOS"
                : systemInfo.platform === "windows"
                  ? "Windows"
                  : "Linux"
              : "--"
          }
          sublabel={systemInfo ? systemInfo.arch : t("dashboard.detecting")}
        />
      </div>

      {/* Current Version Detail */}
      {currentVersion && config && (
        <div className="rounded-xl border border-primary/15 bg-primary/[0.03] p-5 glow-primary">
          <div className="mb-3 flex items-center gap-2">
            <Zap size={14} className="text-primary" />
            <h2 className="text-sm font-semibold text-primary">{t("dashboard.activeVersion")}</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <InfoRow label="Node.js" value={currentVersion} mono />
            <InfoRow
              label={t("dashboard.path")}
              value={config.versions[currentVersion]?.path ?? "-"}
              mono
              small
            />
            {currentLts && <InfoRow label={t("dashboard.ltsCodename")} value={currentLts} />}
            <InfoRow label={t("dashboard.mirrorSource")} value={config.mirror} small />
          </div>
        </div>
      )}

      {/* Quick Start */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-2 text-sm font-semibold">{t("dashboard.quickStart")}</h2>
        <p className="text-[13px] text-secondary-foreground leading-relaxed">
          {t("dashboard.quickStartDesc").split(t("dashboard.goToVersions"))[0]}
          <button
            onClick={() => onNavigate?.("versions")}
            className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
          >
            {t("dashboard.goToVersions")} <ArrowRight size={12} />
          </button>
          {t("dashboard.quickStartDesc").split(t("dashboard.goToVersions"))[1] || ""}
        </p>
      </div>
    </div>
  );
}

function StatusCard({
  icon,
  label,
  value,
  sublabel,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sublabel: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 transition-theme ${
        highlight
          ? "border-primary/20 bg-primary/[0.03] glow-primary"
          : "border-border bg-card"
      }`}
    >
      <div className="mb-3 flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-[11px] font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className={`text-xl font-bold ${highlight ? "text-primary" : ""}`}>{value}</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{sublabel}</p>
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono,
  small,
}: {
  label: string;
  value: string;
  mono?: boolean;
  small?: boolean;
}) {
  return (
    <div>
      <span className="text-muted-foreground">{label}: </span>
      <span
        className={`${mono ? "font-mono" : ""} ${small ? "text-xs" : ""} font-medium`}
      >
        {value}
      </span>
    </div>
  );
}
