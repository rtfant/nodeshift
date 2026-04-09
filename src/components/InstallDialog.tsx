import { useState } from "react";
import { X, Download, FolderOpen, Globe } from "lucide-react";
import { useTranslation } from "@/i18n";
import { pickFolder } from "@/lib/tauri";
import type { NodeVersion } from "@/lib/types";

const MIRROR_KEYS = [
  { key: "mirrors.official", url: "https://nodejs.org/dist/" },
  { key: "mirrors.taobao", url: "https://npmmirror.com/mirrors/node/" },
  { key: "mirrors.huawei", url: "https://repo.huaweicloud.com/nodejs/" },
  { key: "mirrors.tencent", url: "https://mirrors.cloud.tencent.com/nodejs-release/" },
];

interface InstallDialogProps {
  version: NodeVersion;
  defaultInstallDir: string;
  defaultMirror: string;
  onConfirm: (installDir: string, mirror: string) => void;
  onCancel: () => void;
}

export default function InstallDialog({
  version,
  defaultInstallDir,
  defaultMirror,
  onConfirm,
  onCancel,
}: InstallDialogProps) {
  const { t } = useTranslation();
  const [installDir, setInstallDir] = useState(defaultInstallDir);
  const [mirror, setMirror] = useState(defaultMirror);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-[460px] rounded-2xl border border-border bg-card shadow-2xl shadow-black/40">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-base font-semibold">{t("install.title")}</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {version.version}
              {version.lts ? ` (${version.lts} LTS)` : " (Current)"}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 px-5 py-4">
          {/* Install Path */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold">
              <FolderOpen size={13} className="text-muted-foreground" />
              {t("install.installPath")}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={installDir}
                onChange={(e) => setInstallDir(e.target.value)}
                className="flex-1 rounded-lg border border-border bg-muted px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
              <button
                onClick={async () => {
                  const folder = await pickFolder(installDir);
                  if (folder) setInstallDir(folder);
                }}
                className="rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-secondary/80"
              >
                {t("install.browse")}
              </button>
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground">
              {t("install.installTo")}: {installDir}/versions/{version.version}
            </p>
          </div>

          {/* Mirror */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold">
              <Globe size={13} className="text-muted-foreground" />
              {t("install.mirror")}
            </label>
            <select
              value={mirror}
              onChange={(e) => setMirror(e.target.value)}
              className="w-full rounded-lg border border-border bg-muted px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
            >
              {MIRROR_KEYS.map((m) => (
                <option key={m.url} value={m.url}>
                  {t(m.key)}
                </option>
              ))}
            </select>
          </div>

          {/* Version Info */}
          <div className="rounded-lg bg-muted/80 p-3">
            <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t("install.versionDetails")}
            </h4>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <div>
                <span className="text-muted-foreground">npm: </span>
                <span className="font-medium">{version.npm || "-"}</span>
              </div>
              <div>
                <span className="text-muted-foreground">V8: </span>
                <span className="font-medium">{version.v8 || "-"}</span>
              </div>
              <div>
                <span className="text-muted-foreground">{t("install.releaseDate")}: </span>
                <span className="font-medium">{version.date}</span>
              </div>
              <div>
                <span className="text-muted-foreground">OpenSSL: </span>
                <span className="font-medium">{version.openssl || "-"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
          <button
            onClick={onCancel}
            className="rounded-lg border border-border px-4 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
          >
            {t("install.cancel")}
          </button>
          <button
            onClick={() => onConfirm(installDir, mirror)}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-[0_0_12px_rgba(34,197,94,0.2)]"
          >
            <Download size={13} />
            {t("install.startInstall")}
          </button>
        </div>
      </div>
    </div>
  );
}
