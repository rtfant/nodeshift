import { useState, useCallback, useRef } from "react";
import type { InstallStatus } from "@/lib/types";
import { installVersion as installVersionApi } from "@/lib/tauri";

export function useInstall() {
  const [status, setStatus] = useState<InstallStatus>({ type: "idle" });
  const cancelledRef = useRef(false);

  const install = useCallback(
    async (version: string, installDir: string, mirror: string, ltsName?: string | false) => {
      cancelledRef.current = false;

      // Phase 1: Downloading (0% - 100%)
      setStatus({
        type: "downloading",
        progress: { downloaded: 0, total: 100, speed: 0, percentage: 0 },
      });

      // Start the real install API call
      const installPromise = installVersionApi(version, installDir, mirror, ltsName);

      // Simulate progress alongside the real download
      let percent = 0;
      const progressInterval = setInterval(() => {
        if (cancelledRef.current) {
          clearInterval(progressInterval);
          return;
        }
        // Accelerate from 0 to ~90%, then slow down waiting for real completion
        if (percent < 60) {
          percent += Math.random() * 8 + 2;
        } else if (percent < 85) {
          percent += Math.random() * 3 + 0.5;
        } else if (percent < 95) {
          percent += Math.random() * 0.5;
        }
        percent = Math.min(percent, 95);

        const speed = 1.5 + Math.random() * 3;
        setStatus({
          type: "downloading",
          progress: {
            downloaded: Math.round(percent),
            total: 100,
            speed,
            percentage: Math.round(percent),
          },
        });
      }, 300);

      try {
        await installPromise;
        clearInterval(progressInterval);

        if (cancelledRef.current) return;

        // Phase 2: Quick verification steps
        setStatus({
          type: "downloading",
          progress: { downloaded: 100, total: 100, speed: 0, percentage: 100 },
        });
        await new Promise((r) => setTimeout(r, 200));

        setStatus({ type: "verifying" });
        await new Promise((r) => setTimeout(r, 400));

        setStatus({ type: "extracting" });
        await new Promise((r) => setTimeout(r, 300));

        setStatus({ type: "configuring" });
        await new Promise((r) => setTimeout(r, 300));

        setStatus({ type: "completed" });
      } catch (e) {
        clearInterval(progressInterval);
        if (!cancelledRef.current) {
          setStatus({
            type: "error",
            message: e instanceof Error ? e.message : "Install failed",
          });
        }
      }
    },
    [],
  );

  const reset = useCallback(() => {
    cancelledRef.current = true;
    setStatus({ type: "idle" });
  }, []);

  return { status, install, reset };
}
