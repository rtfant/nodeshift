import { useState, useEffect, useCallback } from "react";

const isTauri = typeof window !== "undefined" && !!(window as any).__TAURI_INTERNALS__;

type UpdateStatus =
  | "idle"
  | "checking"
  | "available"
  | "downloading"
  | "ready"
  | "error"
  | "up-to-date";

interface UpdateInfo {
  version: string;
  body: string;
}

export function useUpdater() {
  const [status, setStatus] = useState<UpdateStatus>("idle");
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);

  const checkForUpdates = useCallback(async () => {
    if (!isTauri) {
      setStatus("up-to-date");
      return;
    }

    try {
      setStatus("checking");
      const { check } = await import("@tauri-apps/plugin-updater");
      const update = await check();
      if (update) {
        setUpdateInfo({ version: update.version, body: update.body ?? "" });
        setStatus("available");
      } else {
        setStatus("up-to-date");
      }
    } catch {
      setStatus("error");
    }
  }, []);

  const downloadAndInstall = useCallback(async () => {
    if (!isTauri) return;

    try {
      setStatus("downloading");
      const { check } = await import("@tauri-apps/plugin-updater");
      const update = await check();
      if (update) {
        await update.downloadAndInstall();
        setStatus("ready");
      }
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(checkForUpdates, 3000);
    return () => clearTimeout(timer);
  }, [checkForUpdates]);

  return { status, updateInfo, checkForUpdates, downloadAndInstall };
}
