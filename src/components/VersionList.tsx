import { useState } from "react";
import {
  Search,
  Download,
  Check,
  Trash2,
  RefreshCw,
  Loader2,
  ArrowUpDown,
  AlertCircle,
} from "lucide-react";
import { useVersions, type VersionFilter } from "@/hooks/useVersions";
import { useConfig } from "@/hooks/useConfig";
import { useInstall } from "@/hooks/useInstall";
import type { NodeVersion } from "@/lib/types";
import InstallDialog from "./InstallDialog";
import ProgressBar from "./ProgressBar";

export default function VersionList() {
  const { versions, loading, error, filter, setFilter, search, setSearch, reload } =
    useVersions();
  const { config, reload: reloadConfig } = useConfig();
  const { status: installStatus, install, reset: resetInstall } = useInstall();
  const [selectedVersion, setSelectedVersion] = useState<NodeVersion | null>(null);
  const [showInstallDialog, setShowInstallDialog] = useState(false);

  const installedVersions = config?.versions ?? {};

  const handleInstall = (v: NodeVersion) => {
    setSelectedVersion(v);
    setShowInstallDialog(true);
  };

  const handleConfirmInstall = async (installDir: string, mirror: string) => {
    if (!selectedVersion) return;
    setShowInstallDialog(false);
    await install(selectedVersion.version, installDir, mirror, selectedVersion.lts);
    await reloadConfig();
  };

  const getVersionStatus = (v: NodeVersion): string => {
    if (v.lts) {
      // Check if there's a newer LTS with the same codename
      const major = parseInt(v.version.slice(1));
      if (major >= 22) return "Active LTS";
      if (major >= 18) return "Maintenance";
      return "EOL";
    }
    return "Current";
  };

  const isInstalled = (version: string) => version in installedVersions;
  const isActive = (version: string) => config?.currentVersion === version;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">版本管理</h1>
        <button
          onClick={reload}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          刷新
        </button>
      </div>

      {/* Install Progress */}
      {installStatus.type !== "idle" && (
        <ProgressBar status={installStatus} onDismiss={resetInstall} />
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-1 rounded-lg bg-secondary p-1">
          {(["lts", "current", "all"] as VersionFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "lts" ? "LTS" : f === "current" ? "Current" : "全部"}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="搜索版本..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border border-border bg-card py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle size={16} />
          <span>{error}</span>
          <button onClick={reload} className="ml-auto underline">
            重试
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">正在获取版本列表...</span>
        </div>
      )}

      {/* Version Table */}
      {!loading && (
        <div className="rounded-lg border border-border bg-card">
          <div className="grid grid-cols-[1fr_120px_100px_100px_160px] gap-4 border-b border-border px-4 py-3 text-xs font-medium text-muted-foreground">
            <span>版本</span>
            <span>状态</span>
            <span>LTS 名称</span>
            <span>发布日期</span>
            <span className="text-right">操作</span>
          </div>

          <div className="max-h-[calc(100vh-320px)] overflow-y-auto">
            {versions.map((v) => {
              const installed = isInstalled(v.version);
              const active = isActive(v.version);
              const versionStatus = getVersionStatus(v);

              return (
                <div
                  key={v.version}
                  className={`grid grid-cols-[1fr_120px_100px_100px_160px] items-center gap-4 border-b border-border px-4 py-3 last:border-b-0 transition-colors ${
                    active
                      ? "bg-primary/5"
                      : "hover:bg-secondary/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium">{v.version}</span>
                    {active && (
                      <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                        使用中
                      </span>
                    )}
                    {installed && !active && (
                      <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                        已安装
                      </span>
                    )}
                  </div>
                  <span>
                    <StatusBadge status={versionStatus} />
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {v.lts || "-"}
                  </span>
                  <span className="text-xs text-muted-foreground">{v.date}</span>
                  <div className="flex justify-end gap-2">
                    {!installed && (
                      <button
                        onClick={() => handleInstall(v)}
                        disabled={installStatus.type !== "idle" && installStatus.type !== "completed" && installStatus.type !== "error"}
                        className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                      >
                        <Download size={14} />
                        安装
                      </button>
                    )}
                    {installed && active && (
                      <span className="flex items-center gap-1.5 rounded-md bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                        <Check size={14} />
                        使用中
                      </span>
                    )}
                    {installed && !active && (
                      <>
                        <button
                          onClick={async () => {
                            const { switchVersion } = await import("@/lib/tauri");
                            await switchVersion(v.version);
                            await reloadConfig();
                          }}
                          className="flex items-center gap-1.5 rounded-md bg-secondary px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary/80"
                        >
                          <ArrowUpDown size={14} />
                          使用
                        </button>
                        <button
                          onClick={async () => {
                            if (!confirm(`确认卸载 ${v.version}？`)) return;
                            const { uninstallVersion } = await import("@/lib/tauri");
                            await uninstallVersion(v.version);
                            await reloadConfig();
                          }}
                          className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-destructive transition-colors hover:bg-destructive/10"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {versions.length === 0 && !loading && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              没有找到匹配的版本
            </div>
          )}
        </div>
      )}

      {/* Install Dialog */}
      {showInstallDialog && selectedVersion && (
        <InstallDialog
          version={selectedVersion}
          defaultInstallDir={config?.installDir ?? "~/.nodeshift"}
          defaultMirror={config?.mirror ?? "https://npmmirror.com/mirrors/node/"}
          onConfirm={handleConfirmInstall}
          onCancel={() => setShowInstallDialog(false)}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    "Active LTS": "bg-success/10 text-success",
    Maintenance: "bg-warning/10 text-warning",
    Current: "bg-blue-500/10 text-blue-400",
    EOL: "bg-destructive/10 text-destructive",
  };
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs ${colorMap[status] || "bg-secondary text-muted-foreground"}`}
    >
      {status}
    </span>
  );
}
