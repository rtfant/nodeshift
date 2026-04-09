import { CheckCircle, XCircle, Loader2, X } from "lucide-react";
import type { InstallStatus } from "@/lib/types";

interface ProgressBarProps {
  status: InstallStatus;
  onDismiss: () => void;
}

export default function ProgressBar({ status, onDismiss }: ProgressBarProps) {
  const canDismiss = status.type === "completed" || status.type === "error";

  return (
    <div
      className={`rounded-lg border p-4 ${
        status.type === "error"
          ? "border-destructive/50 bg-destructive/5"
          : status.type === "completed"
            ? "border-success/50 bg-success/5"
            : "border-border bg-card"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {status.type === "completed" && <CheckCircle size={16} className="text-success" />}
          {status.type === "error" && <XCircle size={16} className="text-destructive" />}
          {status.type !== "completed" && status.type !== "error" && status.type !== "idle" && (
            <Loader2 size={16} className="animate-spin text-primary" />
          )}
          <span className="text-sm font-medium">
            {status.type === "downloading" && "正在下载..."}
            {status.type === "verifying" && "正在校验 SHA256..."}
            {status.type === "extracting" && "正在解压..."}
            {status.type === "configuring" && "正在配置环境变量..."}
            {status.type === "completed" && "安装完成！"}
            {status.type === "error" && `安装失败: ${status.message}`}
          </span>
        </div>
        {canDismiss && (
          <button
            onClick={onDismiss}
            className="rounded p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {status.type === "downloading" && (
        <div className="space-y-1">
          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${status.progress.percentage}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{status.progress.percentage.toFixed(0)}%</span>
            <span>{status.progress.speed.toFixed(1)} MB/s</span>
          </div>
        </div>
      )}
    </div>
  );
}
