import { LayoutDashboard, Layers, Settings } from "lucide-react";
import { cn } from "@/lib/cn";

type Page = "dashboard" | "versions" | "settings";

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const navItems: { id: Page; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "仪表盘", icon: LayoutDashboard },
  { id: "versions", label: "版本管理", icon: Layers },
  { id: "settings", label: "设置", icon: Settings },
];

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  return (
    <div className="flex h-full w-56 flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <span className="text-sm font-bold text-primary-foreground">NS</span>
        </div>
        <span className="text-lg font-semibold">NodeShift</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onNavigate(item.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  <Icon size={18} />
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-3">
        <p className="text-xs text-muted-foreground">NodeShift v0.1.0</p>
      </div>
    </div>
  );
}
