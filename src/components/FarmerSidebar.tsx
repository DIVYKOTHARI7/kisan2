import { Link, useLocation } from "@tanstack/react-router";
import { Home, Sprout, Microscope, MessageCircle, TrendingUp, BookOpenText, LogOut, Crown, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { resolveRole, roleLabel } from "@/lib/rbac";
import { clearOtpSession } from "@/lib/api";
import { useState } from "react";

const farmerNavItems = [
  { to: "/", label: "Dashboard", icon: Home },
  { to: "/crop-recommend", label: "Crop Advice", icon: Sprout },
  { to: "/disease-check", label: "Disease Check", icon: Microscope },
  { to: "/chat", label: "Krishi AI", icon: MessageCircle },
  { to: "/schemes", label: "Schemes", icon: BookOpenText },
] as const;

export function FarmerSidebar() {
  const location = useLocation();
  const path = location.pathname;
  const { profile, user, signOut } = useAuth();
  const role = resolveRole(profile, user);
  const navItems = farmerNavItems; // simplified for farmer use case in this redesign
  
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "hidden lg:flex shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 relative",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-6 size-6 bg-primary text-primary-foreground rounded-full grid place-items-center shadow-md z-10 hover:scale-110 transition-transform"
      >
        {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
      </button>

      <div className={cn("flex items-center px-4 py-6 border-b border-sidebar-border h-20", collapsed ? "justify-center" : "gap-3")}>
        <div className="size-10 shrink-0 rounded-2xl bg-gradient-to-br from-primary to-leaf text-primary-foreground grid place-items-center font-serif text-xl font-bold shadow-lg">
          K
        </div>
        {!collapsed && (
          <div className="overflow-hidden whitespace-nowrap">
            <div className="font-serif text-lg font-bold text-primary leading-none">Krishi Samadhan</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
              Rooted in wisdom
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => {
          const active = path === item.to || path.startsWith(item.to + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all group relative overflow-hidden",
                active
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-md shadow-[0_0_8px_var(--color-primary)]" />
              )}
              <Icon className={cn("size-5 shrink-0 transition-transform group-hover:scale-110", active && "text-primary")} />
              {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto border-t border-sidebar-border flex flex-col gap-4">
        {/* Upgrade CTA */}
        <Link
          to="/upgrade"
          title={collapsed ? "Upgrade Plan" : undefined}
          className={cn(
            "flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent to-warning text-accent-foreground p-3 font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all",
            collapsed ? "px-0" : "px-4"
          )}
        >
          <Crown className="size-5 shrink-0" />
          {!collapsed && <span>Upgrade Plan</span>}
        </Link>
      </div>
    </aside>
  );
}
