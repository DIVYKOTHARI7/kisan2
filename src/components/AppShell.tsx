import { useEffect, type ReactNode } from "react";
import { useLocation, useNavigate, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { canAccess, resolveRole } from "@/lib/rbac";
import { hasOtpSession } from "@/lib/api";
import { BottomNav } from "./BottomNav";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";

// Desktop sidebar nav items
const sidebarItems = [
  { to: "/", key: "dashboard", emoji: "🏠", exact: true },
  { to: "/community", key: "community", emoji: "🤝", exact: false },
  { to: "/crop-recommend", key: "cropRec", emoji: "🌱", exact: false },
  { to: "/disease-check", key: "disease", emoji: "📷", exact: false },
  { to: "/chat", key: "chat", emoji: "🤖", exact: false },
  { to: "/schemes", key: "schemes", emoji: "🏛️", exact: false },
  { to: "/profit-tracker", key: "profit", emoji: "💰", exact: false },
  { to: "/profile", key: "profile", emoji: "👤", exact: false },
] as const;

function DesktopSidebar() {
  const location = useLocation();
  const { t } = useTranslation();
  return (
    <aside className="hidden lg:flex flex-col w-64 bg-primary h-screen sticky top-0 shrink-0 shadow-lg">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/20">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-accent flex items-center justify-center text-xl font-bold shadow-md">
            🌾
          </div>
          <div>
            <div className="font-display font-bold text-white text-lg leading-tight">Krishi Samadhan</div>
            <div className="text-white/70 text-xs">{t('tagline')}</div>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto" aria-label="Sidebar navigation">
        {sidebarItems.map((item) => {
          const isActive = item.exact
            ? location.pathname === item.to
            : location.pathname.startsWith(item.to) && item.to !== "/";
          const isDashboard = item.exact && location.pathname === "/";
          const active = isActive || isDashboard;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-150 group",
                active
                  ? "bg-accent text-white font-bold"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              )}
              aria-current={active ? "page" : undefined}
            >
              <span className="text-xl shrink-0">{item.emoji}</span>
              <div className="min-w-0">
                <div className={cn("text-sm font-semibold leading-tight truncate", active ? "text-white" : "text-white/90")}>
                  {t(item.key as any)}
                </div>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom: Upgrade */}
      <div className="p-4 border-t border-white/20">
        <Link
          to="/upgrade"
          className="flex items-center gap-2 w-full bg-accent/90 hover:bg-accent text-white rounded-lg px-4 py-3 text-sm font-bold transition-colors"
        >
          ⭐ {t('premiumPlan')}
        </Link>
      </div>
    </aside>
  );
}

function MobileTopBar() {
  const { profile } = useAuth();
  const { t } = useTranslation();
  const firstName = profile?.name?.split(" ")[0] ?? t('farmer');
  return (
    <header className="lg:hidden bg-primary text-white px-4 py-3 flex items-center justify-between shrink-0 shadow-md">
      <div className="flex items-center gap-3">
        <div className="size-9 rounded-full bg-accent flex items-center justify-center text-lg font-bold">
          {profile?.name?.[0]?.toUpperCase() ?? "K"}
        </div>
        <div>
          <div className="text-xs text-white/70 leading-none">{t('welcome')}</div>
          <div className="font-display font-bold text-base leading-tight">{firstName} 🙏</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="bg-white/15 rounded-full px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5">
          <span>☀️</span>
          <span>28°C</span>
        </div>
        <Link to="/notifications" className="size-9 rounded-full bg-white/15 flex items-center justify-center text-lg relative">
          🔔
          <span className="absolute -top-0.5 -right-0.5 size-4 bg-accent rounded-full text-[9px] font-bold flex items-center justify-center">3</span>
        </Link>
      </div>
    </header>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const role = resolveRole(profile, user);
  const otpSession = typeof window !== "undefined" ? hasOtpSession() : false;
  const isAuthenticated = Boolean(user) || otpSession;

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      navigate({ to: "/auth" });
    } else if (user && profile && !profile.onboarded) {
      navigate({ to: "/onboarding" });
    } else if (location.pathname.startsWith("/expert") && !canAccess(role, "expert_panel")) {
      navigate({ to: "/" });
    } else if (location.pathname.startsWith("/admin") && !canAccess(role, "admin_panel")) {
      navigate({ to: "/" });
    }
  }, [isAuthenticated, user, profile, loading, navigate, location.pathname, role]);

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">🌾</div>
          <div className="space-y-3 w-48">
            <div className="skeleton h-4 rounded" />
            <div className="skeleton h-4 rounded w-3/4 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop sidebar */}
      <DesktopSidebar />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <MobileTopBar />

        {/* Page content — responsive padding and wide layout */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 pb-24 lg:pb-8 overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <BottomNav />
    </div>
  );
}
