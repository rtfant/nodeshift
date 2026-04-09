import { useState, useEffect } from "react";
import { FolderOpen, Globe, Shield, Package, Save, RotateCcw, Trash2 } from "lucide-react";
import { useConfig } from "@/hooks/useConfig";

const MIRRORS = [
  { name: "官方源", url: "https://nodejs.org/dist/" },
  { name: "淘宝源 (npmmirror)", url: "https://npmmirror.com/mirrors/node/" },
  { name: "华为源", url: "https://repo.huaweicloud.com/nodejs/" },
  { name: "腾讯源", url: "https://mirrors.cloud.tencent.com/nodejs-release/" },
];

const NPM_REGISTRIES = [
  { name: "npm 官方", url: "https://registry.npmjs.org" },
  { name: "淘宝源", url: "https://registry.npmmirror.com" },
  { name: "腾讯源", url: "https://mirrors.cloud.tencent.com/npm/" },
];

export default function SettingsPanel() {
  const { config, loading, update } = useConfig();

  const [installDir, setInstallDir] = useState("");
  const [mirror, setMirror] = useState("");
  const [proxy, setProxy] = useState("");
  const [npmRegistry, setNpmRegistry] = useState("");
  const [autoSwitch, setAutoSwitch] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Sync local state from config
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

  if (loading || !config) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
        加载设置中...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">设置</h1>
        <div className="flex gap-2">
          {dirty && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <RotateCcw size={14} />
              重置
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!dirty || saving}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            <Save size={14} />
            {saving ? "保存中..." : saved ? "已保存" : "保存设置"}
          </button>
        </div>
      </div>

      {/* Install Path */}
      <SettingSection
        icon={<FolderOpen size={18} />}
        title="安装路径"
        description="Node.js 版本的存储位置"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={installDir}
            onChange={(e) => { setInstallDir(e.target.value); markDirty(); }}
            className="flex-1 rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button className="rounded-lg border border-border bg-secondary px-4 py-2 text-sm text-foreground transition-colors hover:bg-secondary/80">
            浏览
          </button>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          版本存储于: {installDir}/versions/
        </p>
      </SettingSection>

      {/* Mirror Source */}
      <SettingSection
        icon={<Globe size={18} />}
        title="镜像源"
        description="下载 Node.js 时使用的镜像源，国内用户建议选择淘宝源"
      >
        <select
          value={mirror}
          onChange={(e) => { setMirror(e.target.value); markDirty(); }}
          className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {MIRRORS.map((m) => (
            <option key={m.url} value={m.url}>
              {m.name} - {m.url}
            </option>
          ))}
        </select>
      </SettingSection>

      {/* Proxy */}
      <SettingSection
        icon={<Shield size={18} />}
        title="代理设置"
        description="如果需要通过代理下载，请配置代理地址"
      >
        <input
          type="text"
          value={proxy}
          onChange={(e) => { setProxy(e.target.value); markDirty(); }}
          placeholder="例如: http://127.0.0.1:7890"
          className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </SettingSection>

      {/* npm Registry */}
      <SettingSection
        icon={<Package size={18} />}
        title="npm 源"
        description="npm install 时使用的 registry"
      >
        <select
          value={npmRegistry}
          onChange={(e) => { setNpmRegistry(e.target.value); markDirty(); }}
          className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {NPM_REGISTRIES.map((r) => (
            <option key={r.url} value={r.url}>
              {r.name} - {r.url}
            </option>
          ))}
        </select>
      </SettingSection>

      {/* Auto Switch */}
      <SettingSection
        icon={<Package size={18} />}
        title="自动切换"
        description="进入包含 .nvmrc 或 .node-version 文件的项目时自动切换 Node.js 版本"
      >
        <label className="flex cursor-pointer items-center gap-3">
          <div className="relative">
            <input
              type="checkbox"
              checked={autoSwitch}
              onChange={(e) => { setAutoSwitch(e.target.checked); markDirty(); }}
              className="peer sr-only"
            />
            <div className="h-6 w-11 rounded-full bg-secondary peer-checked:bg-primary transition-colors" />
            <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-foreground transition-transform peer-checked:translate-x-5" />
          </div>
          <span className="text-sm">{autoSwitch ? "已启用" : "已关闭"}</span>
        </label>
      </SettingSection>

      {/* Cache management */}
      <SettingSection
        icon={<Trash2 size={18} />}
        title="缓存管理"
        description="清理已下载的 Node.js 压缩包缓存"
      >
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            缓存目录: {installDir}/cache/
          </span>
          <button className="flex items-center gap-1.5 rounded-lg border border-destructive/50 px-3 py-1.5 text-sm text-destructive transition-colors hover:bg-destructive/10">
            <Trash2 size={14} />
            清理缓存
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
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-muted-foreground">{icon}</span>
        <div>
          <h3 className="text-sm font-medium">{title}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}
