import { CheckCircle, XCircle, Loader2, X } from "lucide-react";
import { useTranslation } from "@/i18n";
import type { InstallStatus } from "@/lib/types";

interface ProgressBarProps {
  status: InstallStatus;
  onDismiss: () => void;
}

export default function ProgressBar({ status, onDismiss }: ProgressBarProps) {
  const { t } = useTranslation();
  const canDismiss = status.type === "completed" || status.type === "error";

  return (
    <div
      className={`rounded-xl p-4 transition-theme card-shadow ${
        status.type === "error"
          ? "bg-red-50 border border-red-200"
          : status.type === "completed"
            ? "bg-green-50 border border-green-200 glow-success"
            : "bg-white border border-border"
      }`}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {status.type === "completed" && (
            <CheckCircle size={15} className="text-success" />
          )}
          {status.type === "error" && (
            <XCircle size={15} className="text-destructive" />
          )}
          {status.type !== "completed" &&
            status.type !== "error" &&
            status.type !== "idle" && (
              <Loader2 size={15} className="animate-spin text-primary" />
            )}
          <span className="text-xs font-semibold text-foreground">
            {status.type === "downloading" && t("install.downloading")}
            {status.type === "verifying" && t("install.verifying")}
            {status.type === "extracting" && t("install.extracting")}
            {status.type === "configuring" && t("install.configuring")}
            {status.type === "completed" && t("install.completed")}
            {status.type === "error" && `${t("install.failed")}: ${status.message}`}
          </span>
        </div>
        {canDismiss && (
          <button
            onClick={onDismiss}
            className="rounded p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {status.type === "downloading" && (
        <div className="space-y-1.5">
          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${status.progress.percentage}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>{status.progress.percentage.toFixed(0)}%</span>
            <span>{status.progress.speed.toFixed(1)} MB/s</span>
          </div>
        </div>
      )}
    </div>
  );
}
