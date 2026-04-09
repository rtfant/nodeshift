import { useState, useEffect } from "react";
import { Monitor, HardDrive, Package, ArrowRight, Zap } from "lucide-react";
import { greet, getSystemInfo, getConfig } from "@/lib/tauri";
import type { AppConfig, SystemInfo } from "@/lib/types";

interface DashboardProps {
  onNavigate?: (page: string) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
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
        <h1 className="text-xl font-bold">仪表盘</h1>
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
            {ipcStatus === "ok" ? "IPC 正常" : ipcStatus === "error" ? "浏览器模式" : "连接中..."}
          </span>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatusCard
          icon={<Package size={18} />}
          label="当前版本"
          value={currentVersion ?? "未安装"}
          sublabel={
            currentVersion
              ? currentLts
                ? `${currentLts} LTS`
                : "Current"
              : "尚未安装 Node.js"
          }
          highlight={!!currentVersion}
        />
        <StatusCard
          icon={<HardDrive size={18} />}
          label="已安装版本"
          value={String(installedCount)}
          sublabel="个版本"
        />
        <StatusCard
          icon={<Monitor size={18} />}
          label="系统平台"
          value={
            systemInfo
              ? systemInfo.platform === "macos"
                ? "macOS"
                : systemInfo.platform === "windows"
                  ? "Windows"
                  : "Linux"
              : "--"
          }
          sublabel={systemInfo ? systemInfo.arch : "检测中..."}
        />
      </div>

      {/* Current Version Detail */}
      {currentVersion && config && (
        <div className="rounded-xl border border-primary/15 bg-primary/[0.03] p-5 glow-primary">
          <div className="mb-3 flex items-center gap-2">
            <Zap size={14} className="text-primary" />
            <h2 className="text-sm font-semibold text-primary">当前活跃版本</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <InfoRow label="Node.js" value={currentVersion} mono />
            <InfoRow
              label="路径"
              value={config.versions[currentVersion]?.path ?? "-"}
              mono
              small
            />
            {currentLts && <InfoRow label="LTS 代号" value={currentLts} />}
            <InfoRow label="镜像源" value={config.mirror} small />
          </div>
        </div>
      )}

      {/* Quick Start */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-2 text-sm font-semibold">快速开始</h2>
        <p className="text-[13px] text-secondary-foreground leading-relaxed">
          前往{" "}
          <button
            onClick={() => onNavigate?.("versions")}
            className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
          >
            版本管理 <ArrowRight size={12} />
          </button>{" "}
          页面选择并安装你需要的 Node.js 版本。安装完成后，NodeShift 会自动配置系统环境变量。
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
