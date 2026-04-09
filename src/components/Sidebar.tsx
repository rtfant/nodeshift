import { LayoutDashboard, Layers, Settings } from "lucide-react";
import { cn } from "@/lib/cn";
import { useTranslation } from "@/i18n";

type Page = "dashboard" | "versions" | "settings";

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const navItems: { id: Page; labelKey: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { id: "versions", labelKey: "nav.versions", icon: Layers },
  { id: "settings", labelKey: "nav.settings", icon: Settings },
];

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const { t } = useTranslation();

  return (
    <div className="flex h-full w-52 flex-col bg-white border-r border-border">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-gradient shadow-md">
          <span className="text-xs font-extrabold text-white">NS</span>
        </div>
        <div>
          <span className="text-sm font-semibold tracking-tight text-foreground">NodeShift</span>
          <p className="text-[10px] text-muted-foreground leading-none mt-0.5">{t("sidebar.subtitle")}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 pt-2">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
          {t("nav.label")}
        </p>
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onNavigate(item.id)}
                  className={cn(
                    "relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150",
                    isActive
                      ? "bg-primary/8 text-primary nav-active-indicator"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                  {t(item.labelKey)}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
          <span className="text-[10px] text-muted-foreground">{t("app.version")}</span>
        </div>
      </div>
    </div>
  );
}
