import { Minus, Square, X } from "lucide-react";

export default function TitleBar() {
  const isTauri = typeof window !== "undefined" && !!(window as any).__TAURI_INTERNALS__;

  const handleMinimize = async () => {
    if (!isTauri) return;
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    getCurrentWindow().minimize();
  };

  const handleMaximize = async () => {
    if (!isTauri) return;
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    const win = getCurrentWindow();
    const isMax = await win.isMaximized();
    isMax ? win.unmaximize() : win.maximize();
  };

  const handleClose = async () => {
    if (!isTauri) return;
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    getCurrentWindow().close();
  };

  return (
    <div
      data-tauri-drag-region
      className="flex h-9 shrink-0 items-center justify-between bg-white/95 backdrop-blur-sm border-b border-border px-3"
    >
      {/* Left: App name */}
      <div className="flex items-center gap-2 pointer-events-none">
        <div className="flex h-5 w-5 items-center justify-center rounded bg-primary">
          <span className="text-[9px] font-extrabold text-white leading-none">NS</span>
        </div>
        <span className="text-xs font-semibold text-foreground/70">NodeShift</span>
      </div>

      {/* Right: Window controls (Windows/Linux style) */}
      {isTauri && (
        <div className="flex items-center">
          <button
            onClick={handleMinimize}
            className="flex h-9 w-10 items-center justify-center text-foreground/40 transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Minus size={14} />
          </button>
          <button
            onClick={handleMaximize}
            className="flex h-9 w-10 items-center justify-center text-foreground/40 transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Square size={11} />
          </button>
          <button
            onClick={handleClose}
            className="flex h-9 w-10 items-center justify-center text-foreground/40 transition-colors hover:bg-destructive hover:text-white"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
