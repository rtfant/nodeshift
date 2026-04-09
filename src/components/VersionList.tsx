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
import { useTranslation } from "@/i18n";
import type { NodeVersion } from "@/lib/types";
import InstallDialog from "./InstallDialog";
import ProgressBar from "./ProgressBar";

export default function VersionList() {
  const { t } = useTranslation();
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
      const major = parseInt(v.version.slice(1));
      if (major >= 22) return t("versions.activeLts");
      if (major >= 18) return t("versions.maintenance");
      return t("versions.eol");
    }
    return t("versions.current");
  };

  const isInstalled = (version: string) => version in installedVersions;
  const isActive = (version: string) => config?.currentVersion === version;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t("versions.title")}</h1>
        <button
          onClick={reload}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          {t("versions.refresh")}
        </button>
      </div>

      {/* Install Progress */}
      {installStatus.type !== "idle" && (
        <ProgressBar status={installStatus} onDismiss={resetInstall} />
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-0.5 rounded-lg bg-secondary/80 p-0.5">
          {(["lts", "current", "all"] as VersionFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition-all duration-150 ${
                filter === f
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "lts" ? t("versions.lts") : f === "current" ? t("versions.current") : t("versions.all")}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder={t("versions.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-52 rounded-lg border border-border bg-card py-1.5 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-xs text-destructive">
          <AlertCircle size={14} />
          <span>{error}</span>
          <button onClick={reload} className="ml-auto font-medium underline">
            {t("versions.retry")}
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={20} className="animate-spin text-primary" />
          <span className="ml-2 text-xs text-muted-foreground">{t("versions.loading")}</span>
        </div>
      )}

      {/* Version Table */}
      {!loading && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-[1fr_110px_90px_90px_150px] gap-4 border-b border-border bg-secondary/30 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <span>{t("versions.version")}</span>
            <span>{t("versions.status")}</span>
            <span>{t("versions.ltsName")}</span>
            <span>{t("versions.releaseDate")}</span>
            <span className="text-right">{t("versions.actions")}</span>
          </div>

          {/* Table Body */}
          <div className="max-h-[calc(100vh-320px)] overflow-y-auto">
            {versions.map((v) => {
              const installed = isInstalled(v.version);
              const active = isActive(v.version);
              const versionStatus = getVersionStatus(v);

              return (
                <div
                  key={v.version}
                  className={`grid grid-cols-[1fr_110px_90px_90px_150px] items-center gap-4 border-b border-border/60 px-4 py-2.5 last:border-b-0 table-row-hover ${
                    active
                      ? "bg-primary/[0.04]"
                      : "hover:bg-secondary/40"
                  }`}
                >
                  {/* Version */}
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[13px] font-semibold">{v.version}</span>
                    {active && (
                      <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                        {t("versions.using")}
                      </span>
                    )}
                    {installed && !active && (
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {t("versions.installed")}
                      </span>
                    )}
                  </div>

                  {/* Status */}
                  <span>
                    <StatusBadge status={versionStatus} />
                  </span>

                  {/* LTS Name */}
                  <span className="text-xs text-muted-foreground">
                    {v.lts || "-"}
                  </span>

                  {/* Date */}
                  <span className="text-[11px] text-muted-foreground">{v.date}</span>

                  {/* Actions */}
                  <div className="flex justify-end gap-1.5">
                    {!installed && (
                      <button
                        onClick={() => handleInstall(v)}
                        disabled={
                          installStatus.type !== "idle" &&
                          installStatus.type !== "completed" &&
                          installStatus.type !== "error"
                        }
                        className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1 text-[11px] font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-[0_0_10px_rgba(34,197,94,0.2)] disabled:opacity-50"
                      >
                        <Download size={12} />
                        {t("versions.install")}
                      </button>
                    )}
                    {installed && active && (
                      <span className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
                        <Check size={12} />
                        {t("versions.using")}
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
                          className="flex items-center gap-1 rounded-lg bg-secondary px-2.5 py-1 text-[11px] font-medium text-foreground transition-colors hover:bg-secondary/80"
                        >
                          <ArrowUpDown size={11} />
                          {t("versions.use")}
                        </button>
                        <button
                          onClick={async () => {
                            if (!confirm(t("versions.confirmUninstall", { version: v.version }))) return;
                            const { uninstallVersion } = await import("@/lib/tauri");
                            await uninstallVersion(v.version);
                            await reloadConfig();
                          }}
                          className="flex items-center gap-0.5 rounded-lg px-2 py-1 text-[11px] text-destructive/80 transition-colors hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 size={11} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {versions.length === 0 && !loading && (
            <div className="py-16 text-center text-xs text-muted-foreground">
              {t("versions.noResults")}
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
  const styles: Record<string, string> = {
    "Active LTS": "bg-success/10 text-success border-success/20",
    Maintenance: "bg-warning/10 text-warning border-warning/20",
    Current: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    EOL: "bg-destructive/10 text-destructive border-destructive/20",
  };
  return (
    <span
      className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-medium ${
        styles[status] || "bg-secondary text-muted-foreground border-border"
      }`}
    >
      {status}
    </span>
  );
}
