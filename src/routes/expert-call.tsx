import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Phone, Star, Clock } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

export const Route = createFileRoute("/expert-call")({
  head: () => ({
    meta: [{ title: "विशेषज्ञ से बात करें — KrishiSathi" }],
  }),
  component: ExpertCall,
});

function ExpertCall() {
  const { t } = useTranslation();

  const experts = [
    { name: "Dr. Ramesh Patel", title: t('expert1Title'), desc: t('expert1Desc'), district: "Pune, Maharashtra", rating: 4.9, calls: 1240, available: true, emoji: "👨‍🔬" },
    { name: "Dr. Sunita Sharma", title: t('expert2Title'), desc: t('expert2Desc'), district: "Nashik, Maharashtra", rating: 4.8, calls: 890, available: true, emoji: "👩‍🌾" },
    { name: "Mr. Arun Singh", title: t('expert3Title'), desc: t('expert3Desc'), district: "Aurangabad, Maharashtra", rating: 4.7, calls: 650, available: false, emoji: "👨‍🌾" },
    { name: "Dr. Priya Desai", title: t('expert4Title'), desc: t('expert4Desc'), district: "Kolhapur, Maharashtra", rating: 4.9, calls: 2100, available: true, emoji: "👩‍💼" },
  ];

  return (
    <AppShell>
      <div className="max-w-[1600px] w-full mx-auto space-y-5">
        <div>
          <h1 className="font-display font-bold text-3xl text-foreground">{t('expertCallTitle')}</h1>
          <p className="text-muted-foreground mt-1">{t('expertCallSubtitle')}</p>
        </div>

        <div className="alert-success rounded-xl p-4 flex items-start gap-3">
          <span className="text-2xl">🎁</span>
          <div>
            <div className="font-bold text-base text-foreground">{t('firstCallFree')}</div>
            <div className="text-sm text-muted-foreground">{t('firstCallFreeDesc')}</div>
          </div>
        </div>

        <div className="space-y-4">
          {experts.map((e) => (
            <div key={e.name} className="card-farm p-5">
              <div className="flex items-start gap-4">
                <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center text-4xl shrink-0">
                  {e.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <div className="font-display font-bold text-lg text-foreground">{e.name}</div>
                      <div className="text-sm font-semibold text-primary">{e.title}</div>
                      <div className="text-xs text-muted-foreground">{e.desc}</div>
                    </div>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${e.available ? "bg-success/10 text-success border border-success/20" : "bg-muted text-muted-foreground"}`}>
                      {e.available ? t('availableStatus') : t('busyStatus')}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Star className="size-4 text-sun fill-sun" /> {e.rating}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="size-3.5" /> {e.calls.toLocaleString()} {t('callsText')}
                    </span>
                    <span>📍 {e.district}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  disabled={!e.available}
                  className={`flex-1 flex items-center justify-center gap-2 font-bold text-sm py-3 rounded-lg transition-colors ${e.available ? "btn-primary-farm" : "bg-muted text-muted-foreground cursor-not-allowed"}`}
                >
                  <Phone className="size-4" /> {t('callNow')}
                </button>
                <button className="flex items-center justify-center gap-2 font-bold text-sm py-3 px-5 rounded-lg border-2 border-accent text-accent hover:bg-accent/10 transition-colors">
                  <Clock className="size-4" /> {t('bookNow')}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
