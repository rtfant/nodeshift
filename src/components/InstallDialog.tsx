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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[480px] rounded-xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold">安装 Node.js</h2>
            <p className="text-sm text-muted-foreground">
              {version.version}
              {version.lts ? ` (${version.lts} LTS)` : " (Current)"}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 px-6 py-5">
          {/* Install Path */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
              <FolderOpen size={14} className="text-muted-foreground" />
              安装路径
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={installDir}
                onChange={(e) => setInstallDir(e.target.value)}
                className="flex-1 rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground transition-colors hover:bg-secondary/80">
                浏览
              </button>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              版本将安装到: {installDir}/versions/{version.version}
            </p>
          </div>

          {/* Mirror */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
              <Globe size={14} className="text-muted-foreground" />
              镜像源
            </label>
            <select
              value={mirror}
              onChange={(e) => setMirror(e.target.value)}
              className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {MIRRORS.map((m) => (
                <option key={m.url} value={m.url}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Version Info */}
          <div className="rounded-lg bg-muted p-3">
            <h4 className="mb-2 text-xs font-medium text-muted-foreground">版本详情</h4>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              <div>
                <span className="text-muted-foreground">npm: </span>
                <span>{version.npm || "-"}</span>
              </div>
              <div>
                <span className="text-muted-foreground">V8: </span>
                <span>{version.v8 || "-"}</span>
              </div>
              <div>
                <span className="text-muted-foreground">发布日期: </span>
                <span>{version.date}</span>
              </div>
              <div>
                <span className="text-muted-foreground">OpenSSL: </span>
                <span>{version.openssl || "-"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-border px-6 py-4">
          <button
            onClick={onCancel}
            className="rounded-lg border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-secondary"
          >
            取消
          </button>
          <button
            onClick={() => onConfirm(installDir, mirror)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Download size={16} />
            开始安装
          </button>
        </div>
      </div>
    </div>
  );
}
