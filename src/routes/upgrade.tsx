import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { CheckCircle2, Star, Zap, ShieldCheck, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";

export const Route = createFileRoute("/upgrade")({
  head: () => ({
    meta: [
      { title: "प्रीमियम प्लान — KrishiSathi" },
      { name: "description", content: "अपनी खेती को प्रीमियम फीचर्स के साथ अगले स्तर पर ले जाएं।" },
    ],
  }),
  component: UpgradePage,
});

function UpgradePage() {
  const { t } = useTranslation();
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");

  const plans = [
    {
      name: t('freePlan'),
      nameEn: "Free",
      price: "0",
      description: t('freeDesc'),
      features: [t('freeFeat1'), t('freeFeat2'), t('freeFeat3'), t('freeFeat4')],
      popular: false,
      color: "border-border",
      btnText: t('currentPlan'),
      btnActive: false,
      icon: "🌾"
    },
    {
      name: t('premiumPlanName'),
      nameEn: "Premium",
      price: "199",
      description: t('premiumDesc'),
      features: [t('premFeat1'), t('premFeat2'), t('premFeat3'), t('premFeat4'), t('premFeat5')],
      popular: true,
      color: "border-accent",
      btnText: t('upgradeNow'),
      btnActive: true,
      icon: "⭐"
    },
    {
      name: t('proPlan'),
      nameEn: "Progressive",
      price: "499",
      description: t('proDesc'),
      features: [t('proFeat1'), t('proFeat2'), t('proFeat3'), t('proFeat4'), t('proFeat5')],
      popular: false,
      color: "border-primary",
      btnText: t('contactUs'),
      btnActive: true,
      icon: "🚀"
    },
  ];

  return (
    <AppShell>
      <div className="max-w-[1600px] w-full mx-auto space-y-8 pb-12">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-accent bg-accent/10 px-3 py-1.5 rounded-full border border-accent/20">
            {t('premiumFeaturesLabel')}
          </div>
          <h1 className="font-display font-bold text-4xl text-foreground">{t('upgradeTitle')}</h1>
          <p className="text-muted-foreground text-lg max-w-lg mx-auto">
            {t('upgradeSubtitle')}
          </p>
        </div>

        {/* Toggle */}
        <div className="flex justify-center">
          <div className="bg-muted/50 p-1 rounded-xl flex border border-border shadow-sm">
            <button
              onClick={() => setBilling("monthly")}
              className={cn(
                "px-6 py-2 rounded-lg text-sm font-bold transition-all",
                billing === "monthly" ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t('monthlyLabel')}
            </button>
            <button
              onClick={() => setBilling("yearly")}
              className={cn(
                "px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
                billing === "yearly" ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t('yearlyLabel')}
              <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full">{t('save20Label')}</span>
            </button>
          </div>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((p) => (
            <div
              key={p.name}
              className={cn(
                "card-farm p-6 flex flex-col relative transition-all duration-300 hover:translate-y-[-4px]",
                p.popular ? "border-accent border-4 ring-8 ring-accent/5" : "border-2"
              )}
            >
              {p.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent text-white text-[11px] font-bold px-4 py-1 rounded-full shadow-md z-10 whitespace-nowrap">
                  {t('popularLabel')}
                </div>
              )}
              
              <div className="text-center mb-6">
                <div className="text-4xl mb-2">{p.icon}</div>
                <h3 className="font-display font-bold text-2xl text-foreground leading-tight">{p.name}</h3>
                <p className="text-sm text-muted-foreground font-semibold">{p.nameEn}</p>
                <div className="mt-4 flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-display font-bold text-foreground">₹{billing === "yearly" ? Math.round(parseInt(p.price) * 10 * 0.8 / 12) : p.price}</span>
                  <span className="text-muted-foreground text-sm">{t('perMonth')}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">{p.description}</p>
              </div>

              <div className="flex-1 space-y-4 mb-8">
                {p.features.map((f) => (
                  <div key={f} className="flex items-start gap-3">
                    <CheckCircle2 className={cn("size-5 shrink-0 mt-0.5", p.popular ? "text-accent" : "text-primary")} />
                    <span className="text-sm font-medium text-foreground/80">{f}</span>
                  </div>
                ))}
              </div>

              <button
                disabled={!p.btnActive}
                className={cn(
                  "w-full font-bold text-base py-3.5 rounded-xl transition-all shadow-sm",
                  p.popular ? "btn-saffron" : p.btnActive ? "btn-primary-farm" : "bg-muted text-muted-foreground cursor-not-allowed border-2 border-border"
                )}
              >
                {p.btnText}
              </button>
            </div>
          ))}
        </div>

        {/* Trust features */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8">
          {[
            { icon: Zap, label: t('fastSupport'), sub: "Fast Support" },
            { icon: ShieldCheck, label: t('safePayment'), sub: "Safe Payment" },
            { icon: TrendingUp, label: t('moreProfit'), sub: "More Profit" },
            { icon: Star, label: t('expertAdvice'), sub: "Expert Advice" },
          ].map((item) => (
            <div key={item.label} className="text-center space-y-2">
              <div className="size-12 rounded-full bg-primary/5 text-primary flex items-center justify-center mx-auto border border-primary/10">
                <item.icon className="size-6" />
              </div>
              <div>
                <div className="font-bold text-foreground text-sm">{item.label}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
