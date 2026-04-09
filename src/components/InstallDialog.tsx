import { useState } from "react";
import { X, Download, FolderOpen, Globe } from "lucide-react";
import type { NodeVersion } from "@/lib/types";

const MIRRORS = [
  { name: "官方源", url: "https://nodejs.org/dist/" },
  { name: "淘宝源 (npmmirror)", url: "https://npmmirror.com/mirrors/node/" },
  { name: "华为源", url: "https://repo.huaweicloud.com/nodejs/" },
  { name: "腾讯源", url: "https://mirrors.cloud.tencent.com/nodejs-release/" },
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
  const [installDir, setInstallDir] = useState(defaultInstallDir);
  const [mirror, setMirror] = useState(defaultMirror);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-[460px] rounded-2xl border border-border bg-card shadow-2xl shadow-black/40">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-base font-semibold">安装 Node.js</h2>
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
              安装路径
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={installDir}
                onChange={(e) => setInstallDir(e.target.value)}
                className="flex-1 rounded-lg border border-border bg-muted px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
              <button className="rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-secondary/80">
                浏览
              </button>
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground">
              安装到: {installDir}/versions/{version.version}
            </p>
          </div>

          {/* Mirror */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold">
              <Globe size={13} className="text-muted-foreground" />
              镜像源
            </label>
            <select
              value={mirror}
              onChange={(e) => setMirror(e.target.value)}
              className="w-full rounded-lg border border-border bg-muted px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
            >
              {MIRRORS.map((m) => (
                <option key={m.url} value={m.url}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Version Info */}
          <div className="rounded-lg bg-muted/80 p-3">
            <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              版本详情
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
                <span className="text-muted-foreground">发布日期: </span>
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
            取消
          </button>
          <button
            onClick={() => onConfirm(installDir, mirror)}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-[0_0_12px_rgba(34,197,94,0.2)]"
          >
            <Download size={13} />
            开始安装
          </button>
        </div>
      </div>
    </div>
  );
}
