import { useState, useEffect } from "react";
import {
  Monitor,
  Package,
  ArrowRight,
  Zap,
  CheckCircle,
  Search,
  CircleDot,
} from "lucide-react";
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

  const platformName = systemInfo
    ? systemInfo.platform === "macos"
      ? "macOS"
      : systemInfo.platform === "windows"
        ? "Windows"
        : "Linux"
    : "--";

  return (
    <div className="space-y-6">
      {/* Hero Card with Blue Header */}
      <div className="overflow-hidden rounded-2xl card-shadow-lg bg-white">
        {/* Blue gradient header */}
        <div className="bg-blue-gradient px-8 py-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm shadow-lg">
            <Package size={28} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">NodeShift {t("sidebar.subtitle")}</h1>
          <p className="mt-1 text-sm text-white/70">Node.js {t("sidebar.subtitle")}</p>
        </div>

        {/* Content area */}
        <div className="p-6 space-y-5">
          {/* System Info */}
          <div className="rounded-xl bg-secondary/60 px-5 py-4">
            <div className="flex items-center gap-3 mb-2">
              <Monitor size={16} className="text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">{t("dashboard.systemPlatform")}</span>
            </div>
            <div className="flex items-center gap-2 pl-7">
              <span className="text-sm text-secondary-foreground">
                {t("dashboard.systemPlatform")}:
              </span>
              <span className="text-sm font-semibold text-primary">{platformName}</span>
              {systemInfo && (
                <span className="text-xs text-muted-foreground">({systemInfo.arch})</span>
              )}
            </div>
          </div>

          {/* Node.js Detection Status */}
          <div className="rounded-xl bg-secondary/60 px-5 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Search size={16} className="text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">Node.js</span>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  currentVersion
                    ? "badge-found"
                    : "bg-orange-50 text-orange-600 border border-orange-200"
                }`}
              >
                {currentVersion ? t("versions.installed") : t("dashboard.notInstalled")}
              </span>
            </div>

            {/* Installed versions list */}
            {currentVersion && config && (
              <div className="space-y-2.5 pt-1">
                {/* Active version */}
                <div className="flex items-center justify-between rounded-lg bg-white px-4 py-3 indicator-green">
                  <div className="flex items-center gap-3">
                    <CircleDot size={14} className="text-accent" />
                    <span className="text-sm font-mono font-medium">{currentVersion}</span>
                    {currentLts && (
                      <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-primary border border-blue-100">
                        {currentLts} LTS
                      </span>
                    )}
                  </div>
                  <span className="badge-valid rounded-full px-2.5 py-0.5 text-[11px] font-semibold">
                    {t("versions.using")}
                  </span>
                </div>

                {/* Other installed versions */}
                {Object.entries(config.versions)
                  .filter(([v]) => v !== currentVersion)
                  .slice(0, 3)
                  .map(([version, info]) => (
                    <div
                      key={version}
                      className="flex items-center justify-between rounded-lg bg-white px-4 py-3 indicator-green"
                    >
                      <div className="flex items-center gap-3">
                        <CircleDot size={14} className="text-muted-foreground" />
                        <span className="text-sm font-mono font-medium">{version}</span>
                        {info.lts && (
                          <span className="rounded bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                            {info.lts}
                          </span>
                        )}
                      </div>
                      <span className="badge-valid rounded-full px-2.5 py-0.5 text-[11px] font-semibold">
                        {t("versions.installed")}
                      </span>
                    </div>
                  ))}
              </div>
            )}

            {/* No Node installed */}
            {!currentVersion && (
              <p className="pl-7 text-sm text-muted-foreground">{t("dashboard.noNodeInstalled")}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <button
              onClick={() => onNavigate?.("versions")}
              className="flex items-center justify-center gap-2 rounded-xl bg-primary-gradient px-6 py-4 text-sm font-bold text-white shadow-md btn-hover-lift"
            >
              <Package size={18} />
              {t("nav.versions")}
            </button>
            <button
              onClick={() => onNavigate?.("settings")}
              className="flex items-center justify-center gap-2 rounded-xl bg-green-gradient px-6 py-4 text-sm font-bold text-white shadow-md btn-hover-lift"
            >
              <Zap size={18} />
              {t("nav.settings")}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border px-6 py-3 text-center">
          <span className="text-xs text-muted-foreground">
            {t("app.version")} | {t("dashboard.systemPlatform")}: Windows/macOS/Linux
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          icon={<Package size={18} className="text-primary" />}
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
        <StatCard
          icon={<Zap size={18} className="text-accent" />}
          label={t("dashboard.installedVersions")}
          value={String(installedCount)}
          sublabel={t("dashboard.versionsCount")}
        />
        <StatCard
          icon={<Monitor size={18} className="text-blue-400" />}
          label={t("dashboard.systemPlatform")}
          value={platformName}
          sublabel={systemInfo ? systemInfo.arch : t("dashboard.detecting")}
        />
      </div>

      {/* Quick Start Card */}
      <div className="rounded-xl bg-white p-5 card-shadow">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle size={16} className="text-accent" />
          <h2 className="text-sm font-semibold">{t("dashboard.quickStart")}</h2>
        </div>
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

      {/* IPC Status */}
      <div className="flex items-center gap-2 justify-center">
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
  );
}

function StatCard({
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
      className={`rounded-xl bg-white p-4 card-shadow transition-theme ${
        highlight ? "ring-1 ring-primary/20 glow-primary" : ""
      }`}
    >
      <div className="mb-3 flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-[11px] font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className={`text-xl font-bold ${highlight ? "text-primary" : "text-foreground"}`}>{value}</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{sublabel}</p>
    </div>
  );
}
