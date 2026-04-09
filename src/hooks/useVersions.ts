import { useState, useEffect, useCallback } from "react";
import type { NodeVersion } from "@/lib/types";
import { fetchVersions } from "@/lib/tauri";

export type VersionFilter = "lts" | "current" | "all";

export function useVersions() {
  const [versions, setVersions] = useState<NodeVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<VersionFilter>("lts");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchVersions();
      setVersions(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch versions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = versions.filter((v) => {
    if (search && !v.version.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === "lts") return v.lts !== false;
    if (filter === "current") return v.lts === false;
    return true;
  });

  return {
    versions: filtered,
    allVersions: versions,
    loading,
    error,
    filter,
    setFilter,
    search,
    setSearch,
    reload: load,
  };
}
