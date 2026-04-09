import { useState, useEffect, useCallback } from "react";
import type { AppConfig } from "@/lib/types";
import { getConfig, saveConfig } from "@/lib/tauri";

export function useConfig() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const c = await getConfig();
      setConfig(c);
    } catch (e) {
      console.error("Failed to load config:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const update = useCallback(
    async (partial: Partial<AppConfig>) => {
      if (!config) return;
      const updated = { ...config, ...partial };
      setConfig(updated);
      await saveConfig(updated);
    },
    [config],
  );

  return { config, loading, reload: load, update };
}
