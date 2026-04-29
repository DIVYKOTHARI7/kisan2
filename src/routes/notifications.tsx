import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
import { useTranslation } from "@/hooks/useTranslation";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [{ title: "सूचनाएं — KrishiSathi" }],
  }),
  component: Notifications,
});

const typeStyles = {
  warning: "border-l-accent",
  success: "border-l-success",
  info: "border-l-info",
};

function Notifications() {
  const { t } = useTranslation();
  
  const initialNotifs = useMemo(() => [
    { id: "1", icon: "🌧️", title: t('notif1Title'), body: t('notif1Body'), time: t('notif1Time'), read: false, type: "warning" as const },
    { id: "3", icon: "🏛️", title: t('notif3Title'), body: t('notif3Body'), time: t('notif3Time'), read: false, type: "info" as const },
    { id: "4", icon: "🐛", title: t('notif4Title'), body: t('notif4Body'), time: t('notif4Time'), read: true, type: "warning" as const },
    { id: "5", icon: "☀️", title: t('notif5Title'), body: t('notif5Body'), time: t('notif5Time'), read: true, type: "info" as const },
  ], [t]);

  const [notifs, setNotifs] = useState(initialNotifs);
  const unread = notifs.filter((n) => !n.read).length;

  function markAllRead() {
    setNotifs((n) => n.map((x) => ({ ...x, read: true })));
  }

  function markRead(id: string) {
    setNotifs((n) => n.map((x) => x.id === id ? { ...x, read: true } : x));
  }

  return (
    <AppShell>
      <div className="max-w-[1600px] w-full mx-auto space-y-5 pb-20">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display font-bold text-3xl text-foreground">{t('notificationsTitle')}</h1>
            <p className="text-muted-foreground mt-1">
              {t('notificationsSubtitle')}{unread > 0 ? ` · ` : ""}
              {unread > 0 && <span className="font-bold text-accent">{unread} {t('newLabel')}</span>}
            </p>
          </div>
          {unread > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-2 text-sm font-bold text-primary bg-primary/10 px-4 py-2.5 rounded-lg hover:bg-primary/20 transition-colors border border-primary/20 shrink-0"
            >
              <CheckCheck className="size-4" /> {t('markAllReadBtn')}
            </button>
          )}
        </div>

        <div className="space-y-3">
          {notifs.map((n) => (
            <div
              key={n.id}
              onClick={() => markRead(n.id)}
              className={cn(
                "card-farm border-l-4 p-4 flex items-start gap-4 cursor-pointer hover:shadow-md transition-all",
                typeStyles[n.type],
                !n.read && "bg-white"
              )}
            >
              <div className={cn("size-11 rounded-xl flex items-center justify-center text-2xl shrink-0", !n.read ? "bg-muted/50" : "bg-muted/30")}>
                {n.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className={cn("font-bold text-base text-foreground", !n.read && "text-foreground")}>{n.title}</div>
                  {!n.read && <span className="size-2.5 rounded-full bg-accent shrink-0 mt-1.5" />}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{n.body}</p>
                <p className="text-xs text-muted-foreground mt-2">{n.time}</p>
              </div>
            </div>
          ))}
        </div>

        {unread === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <div className="text-5xl mb-3">✅</div>
            <div className="font-bold text-foreground">{t('allCaughtUpTitle')}</div>
            <div className="text-sm">{t('allCaughtUpSubtitle')}</div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
