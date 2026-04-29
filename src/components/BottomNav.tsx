import { Link, useLocation } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";

const navItems = [
  { to: "/", key: "dashboard", emoji: "🏠", exact: true },
  { to: "/community", key: "community", emoji: "🤝", exact: false },
  { to: "/disease-check", key: "disease", emoji: "📷", exact: false, fab: true },
  { to: "/profile", key: "profile", emoji: "👤", exact: false },
] as const;

export function BottomNav() {
  const location = useLocation();
  const { t } = useTranslation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t-2 border-border bottom-nav-safe lg:hidden"
      style={{ boxShadow: "0 -2px 12px rgba(0,0,0,0.08)" }}
      aria-label="Main navigation"
    >
      <div className="flex items-end justify-around h-16">
        {navItems.map((item) => {
          const isActive = item.exact
            ? location.pathname === item.to
            : location.pathname.startsWith(item.to) && item.to !== "/";
          const isDashboard = item.exact && location.pathname === "/";
          const label = t(item.key as any);

          if (item.fab) {
            // Center FAB for disease scan
            return (
              <Link
                key={item.to}
                to={item.to}
                className="flex flex-col items-center justify-center -mt-5"
                aria-label={label}
              >
                <div
                  className={cn(
                    "size-14 rounded-full flex items-center justify-center text-2xl shadow-lg border-4 border-white transition-all duration-150",
                    isActive
                      ? "bg-primary scale-105"
                      : "bg-accent hover:bg-accent/90"
                  )}
                >
                  {item.emoji}
                </div>
                <span
                  className={cn(
                    "text-[10px] font-bold mt-1 leading-tight",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-0.5 pt-1 relative transition-colors duration-150",
                isActive || isDashboard ? "text-primary" : "text-muted-foreground"
              )}
              aria-label={label}
              aria-current={isActive || isDashboard ? "page" : undefined}
            >
              {(isActive || isDashboard) && (
                <div className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-accent rounded-b-full" />
              )}
              <span className="text-xl leading-none">{item.emoji}</span>
              <span className="text-[10px] font-bold leading-tight">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
