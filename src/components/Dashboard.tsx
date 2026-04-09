import { useState, useEffect } from "react";
import { Monitor, HardDrive, Package, Cpu, Globe, ArrowRight } from "lucide-react";
import { greet, getSystemInfo, getConfig } from "@/lib/tauri";
import type { AppConfig, SystemInfo } from "@/lib/types";

interface DashboardProps {
  onNavigate?: (page: string) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [greetMsg, setGreetMsg] = useState("");
  const [ipcStatus, setIpcStatus] = useState<"testing" | "ok" | "error">("testing");
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [config, setConfig] = useState<AppConfig | null>(null);

  useEffect(() => {
    greet("NodeShift")
      .then((msg) => {
        setGreetMsg(msg);
        setIpcStatus("ok");
      })
      .catch(() => {
        setIpcStatus("error");
      });

    getSystemInfo()
      .then(setSystemInfo)
      .catch(() => {});

    getConfig()
      .then(setConfig)
      .catch(() => {});
  }, []);

  const installedCount = config ? Object.keys(config.versions).length : 0;
  const currentVersion = config?.currentVersion;
  const currentLts = currentVersion && config?.versions[currentVersion]?.lts;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">仪表盘</h1>

      {/* Status Cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatusCard
          icon={<Package size={20} />}
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
          icon={<HardDrive size={20} />}
          label="已安装版本"
          value={String(installedCount)}
          sublabel="个版本"
        />
        <StatusCard
          icon={<Monitor size={20} />}
          label="系统平台"
          value={
            systemInfo
              ? `${systemInfo.platform === "macos" ? "macOS" : systemInfo.platform === "windows" ? "Windows" : "Linux"}`
              : "--"
          }
          sublabel={systemInfo ? `${systemInfo.arch}` : "检测中..."}
        />
      </div>

      {/* Current Version Detail */}
      {currentVersion && config && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
          <h2 className="mb-3 text-sm font-medium text-primary">当前活跃版本</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Node.js: </span>
              <span className="font-mono font-medium">{currentVersion}</span>
            </div>
            <div>
              <span className="text-muted-foreground">路径: </span>
              <span className="font-mono text-xs">
                {config.versions[currentVersion]?.path ?? "-"}
              </span>
            </div>
            {currentLts && (
              <div>
                <span className="text-muted-foreground">LTS 代号: </span>
                <span>{currentLts}</span>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">镜像源: </span>
              <span className="text-xs">{config.mirror}</span>
            </div>
          </div>
        </div>
      )}

      {/* IPC Test */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          Tauri IPC 通信测试
        </h2>
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "h-2.5 w-2.5 rounded-full",
              ipcStatus === "ok" && "bg-success",
              ipcStatus === "error" && "bg-destructive",
              ipcStatus === "testing" && "bg-warning animate-pulse",
            )}
          />
          <span className="text-sm">
            {ipcStatus === "testing" && "正在测试 IPC 通信..."}
            {ipcStatus === "ok" && `IPC 通信正常: ${greetMsg}`}
            {ipcStatus === "error" &&
              "IPC 通信失败 (在浏览器中运行时这是正常的，需要在 Tauri 环境中测试)"}
          </span>
        </div>
      </div>

      {/* Quick Start */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">快速开始</h2>
        <p className="text-sm text-secondary-foreground">
          前往{" "}
          <button
            onClick={() => onNavigate?.("versions")}
            className="inline-flex items-center gap-1 text-primary hover:underline"
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
      className={`rounded-lg border p-4 ${
        highlight ? "border-primary/30 bg-primary/5" : "border-border bg-card"
      }`}
    >
      <div className="mb-2 flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className={`text-xl font-semibold ${highlight ? "text-primary" : ""}`}>
        {value}
      </p>
      <p className="text-xs text-muted-foreground">{sublabel}</p>
    </div>
  );
}

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
