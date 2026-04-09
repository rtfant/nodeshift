import { useState, useEffect } from "react";
import {
  FolderOpen,
  Globe,
  Shield,
  Package,
  Save,
  RotateCcw,
  Trash2,
  RefreshCw,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { useConfig } from "@/hooks/useConfig";
import { useTranslation } from "@/i18n";
import { pickFolder, getCacheInfo, clearCache, type CacheInfo } from "@/lib/tauri";

const MIRROR_KEYS = [
  { key: "mirrors.official", url: "https://nodejs.org/dist/" },
  { key: "mirrors.taobao", url: "https://npmmirror.com/mirrors/node/" },
  { key: "mirrors.huawei", url: "https://repo.huaweicloud.com/nodejs/" },
  { key: "mirrors.tencent", url: "https://mirrors.cloud.tencent.com/nodejs-release/" },
];

const NPM_REGISTRY_KEYS = [
  { key: "npmRegistries.official", url: "https://registry.npmjs.org" },
  { key: "npmRegistries.taobao", url: "https://registry.npmmirror.com" },
  { key: "npmRegistries.tencent", url: "https://mirrors.cloud.tencent.com/npm/" },
];

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export default function SettingsPanel() {
  const { t } = useTranslation();
  const { config, loading, update } = useConfig();

  const [installDir, setInstallDir] = useState("");
  const [mirror, setMirror] = useState("");
  const [proxy, setProxy] = useState("");
  const [npmRegistry, setNpmRegistry] = useState("");
  const [autoSwitch, setAutoSwitch] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Cache state
  const [cacheInfo, setCacheInfo] = useState<CacheInfo | null>(null);
  const [clearing, setClearing] = useState(false);
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    if (config) {
      setInstallDir(config.installDir);
      setMirror(config.mirror);
      setProxy(config.proxy ?? "");
      setNpmRegistry(config.npmRegistry);
      setAutoSwitch(config.autoSwitch);
      setDirty(false);
    }
  }, [config]);

  // Load cache info on mount
  useEffect(() => {
    getCacheInfo().then(setCacheInfo).catch(() => {});
  }, []);

  const markDirty = () => {
    setDirty(true);
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await update({
      installDir,
      mirror,
      proxy: proxy || null,
      npmRegistry,
      autoSwitch,
    });
    setSaving(false);
    setDirty(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    if (config) {
      setInstallDir(config.installDir);
      setMirror(config.mirror);
      setProxy(config.proxy ?? "");
      setNpmRegistry(config.npmRegistry);
      setAutoSwitch(config.autoSwitch);
      setDirty(false);
    }
  };

  const handleClearCache = async () => {
    setClearing(true);
    setCleared(false);
    try {
      const info = await clearCache();
      setCacheInfo(info);
      setCleared(true);
      setTimeout(() => setCleared(false), 2000);
    } catch {
      // ignore
    }
    setClearing(false);
  };

  if (loading || !config) {
    return (
      <div className="flex items-center justify-center py-20 text-xs text-muted-foreground">
        <RefreshCw size={14} className="mr-2 animate-spin" />
        {t("settings.loadingSettings")}
      </div>
    );
  }

  const cacheIsEmpty = cacheInfo ? cacheInfo.fileCount === 0 : true;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">{t("settings.title")}</h1>
        <div className="flex gap-2">
          {dirty && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground card-shadow"
            >
              <RotateCcw size={13} />
              {t("settings.reset")}
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!dirty || saving}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-semibold transition-all disabled:opacity-40 ${
              saved
                ? "bg-green-50 text-success border border-green-200"
                : "bg-primary text-white hover:bg-primary/90 shadow-md"
            }`}
          >
            <Save size={13} />
            {saving ? t("settings.saving") : saved ? t("settings.saved") : t("settings.save")}
          </button>
        </div>
      </div>

      {/* Install Path */}
      <SettingSection
        icon={<FolderOpen size={16} />}
        title={t("settings.installPath")}
        description={t("settings.installPathDesc")}
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={installDir}
            onChange={(e) => {
              setInstallDir(e.target.value);
              markDirty();
            }}
            className="flex-1 rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-xs text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            onClick={async () => {
              const folder = await pickFolder(installDir);
              if (folder) {
                setInstallDir(folder);
                markDirty();
              }
            }}
            className="rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
          >
            {t("settings.browse")}
          </button>
        </div>
        <p className="mt-1 text-[10px] text-muted-foreground font-mono">
          {t("settings.storagePath")} {installDir}/versions/
        </p>
      </SettingSection>

      {/* Mirror Source */}
      <SettingSection
        icon={<Globe size={16} />}
        title={t("settings.mirror")}
        description={t("settings.mirrorDesc")}
      >
        <select
          value={mirror}
          onChange={(e) => {
            setMirror(e.target.value);
            markDirty();
          }}
          className="w-full rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          {MIRROR_KEYS.map((m) => (
            <option key={m.url} value={m.url}>
              {t(m.key)} - {m.url}
            </option>
          ))}
        </select>
      </SettingSection>

      {/* Proxy */}
      <SettingSection
        icon={<Shield size={16} />}
        title={t("settings.proxy")}
        description={t("settings.proxyDesc")}
      >
        <input
          type="text"
          value={proxy}
          onChange={(e) => {
            setProxy(e.target.value);
            markDirty();
          }}
          placeholder={t("settings.proxyPlaceholder")}
          className="w-full rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </SettingSection>

      {/* npm Registry */}
      <SettingSection
        icon={<Package size={16} />}
        title={t("settings.npmRegistry")}
        description={t("settings.npmRegistryDesc")}
      >
        <select
          value={npmRegistry}
          onChange={(e) => {
            setNpmRegistry(e.target.value);
            markDirty();
          }}
          className="w-full rounded-lg border border-border bg-secondary/50 px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          {NPM_REGISTRY_KEYS.map((r) => (
            <option key={r.url} value={r.url}>
              {t(r.key)} - {r.url}
            </option>
          ))}
        </select>
      </SettingSection>

      {/* Auto Switch */}
      <SettingSection
        icon={<RefreshCw size={16} />}
        title={t("settings.autoSwitch")}
        description={t("settings.autoSwitchDesc")}
      >
        <label className="flex cursor-pointer items-center gap-3">
          <div className="relative">
            <input
              type="checkbox"
              checked={autoSwitch}
              onChange={(e) => {
                setAutoSwitch(e.target.checked);
                markDirty();
              }}
              className="peer sr-only"
            />
            <div className="h-5 w-9 rounded-full bg-gray-300 transition-colors peer-checked:bg-primary" />
            <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
          </div>
          <span className="text-xs text-foreground">{autoSwitch ? t("settings.enabled") : t("settings.disabled")}</span>
        </label>
      </SettingSection>

      {/* Cache Management */}
      <SettingSection
        icon={<Trash2 size={16} />}
        title={t("settings.cache")}
        description={t("settings.cacheDesc")}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-muted-foreground font-mono">
              {cacheInfo?.cacheDir ?? `${installDir}/cache/`}
            </p>
            {cacheInfo && !cacheIsEmpty && (
              <p className="mt-1 text-[11px] text-foreground">
                {t("settings.cacheSize", { size: formatSize(cacheInfo.totalSize) })}
                {" / "}
                {t("settings.cacheFiles", { count: String(cacheInfo.fileCount) })}
              </p>
            )}
            {cacheIsEmpty && (
              <p className="mt-1 text-[11px] text-muted-foreground">
                {t("settings.cacheEmpty")}
              </p>
            )}
          </div>
          <button
            onClick={handleClearCache}
            disabled={cacheIsEmpty || clearing}
            className="flex items-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-1.5 text-[11px] font-medium text-destructive transition-colors hover:bg-red-50 disabled:opacity-40"
          >
            {clearing ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                {t("settings.clearing")}
              </>
            ) : cleared ? (
              <>
                <CheckCircle2 size={12} />
                {t("settings.cleared")}
              </>
            ) : (
              <>
                <Trash2 size={12} />
                {t("settings.clearCache")}
              </>
            )}
          </button>
        </div>
      </SettingSection>
    </div>
  );
}

function SettingSection({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-white p-4 card-shadow">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="text-primary">{icon}</span>
        <div>
          <h3 className="text-xs font-semibold text-foreground">{title}</h3>
          <p className="text-[10px] text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}
