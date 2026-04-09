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
        <h1 className="text-xl font-bold text-foreground">{t("versions.title")}</h1>
        <button
          onClick={reload}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50 card-shadow"
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
        <div className="flex gap-0.5 rounded-lg bg-white p-0.5 card-shadow">
          {(["lts", "current", "all"] as VersionFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition-all duration-150 ${
                filter === f
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
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
            className="w-52 rounded-lg border border-border bg-white py-1.5 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 card-shadow"
          />
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-red-50 px-4 py-3 text-xs text-destructive">
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
        <div className="rounded-xl bg-white overflow-hidden card-shadow">
          {/* Table Header */}
          <div className="grid grid-cols-[1fr_110px_90px_90px_150px] gap-4 border-b border-border bg-secondary/50 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
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
                      : "hover:bg-secondary/50"
                  }`}
                >
                  {/* Version */}
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[13px] font-semibold text-foreground">{v.version}</span>
                    {active && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
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
                        className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1 text-[11px] font-semibold text-white transition-all hover:bg-primary/90 hover:shadow-md disabled:opacity-50"
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
                          className="flex items-center gap-1 rounded-lg bg-secondary px-2.5 py-1 text-[11px] font-medium text-foreground transition-colors hover:bg-primary/10 hover:text-primary"
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
                          className="flex items-center gap-0.5 rounded-lg px-2 py-1 text-[11px] text-destructive/80 transition-colors hover:bg-red-50 hover:text-destructive"
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
    "Active LTS": "bg-green-50 text-green-700 border-green-200",
    Maintenance: "bg-amber-50 text-amber-700 border-amber-200",
    Current: "bg-blue-50 text-blue-600 border-blue-200",
    EOL: "bg-red-50 text-red-600 border-red-200",
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
