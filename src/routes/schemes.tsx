import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { CheckCircle2, ExternalLink, Clock, Bookmark, BookmarkCheck, Share2, Filter, ChevronRight, ChevronDown, Bot, Zap } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";

export const Route = createFileRoute("/schemes")({
  head: () => ({
    meta: [
      { title: "सरकारी योजनाएं — Krishi Samadhan" },
      { name: "description", content: "आपके प्रोफाइल के अनुसार चुनिंदा सरकारी योजनाएं और अनुदान जानें।" },
    ],
  }),
  component: Schemes,
});

type Scheme = {
  id: string;
  name: string;
  nameEn: string;
  category: string;
  categoryIcon: string;
  benefit: string;
  type: string;
  fee: string;
  eligibility: number;
  deadline: string | null;
  deadlineDaysLeft: number | null;
  docs: string[];
  matched: boolean;
  applied: boolean;
  color: string;
  headerColor: string;
  badgeColor: string;
  url: string;
};

const ALL_SCHEMES: Scheme[] = [
  {
    id: "pmkisan",
    name: "PM-KISAN सम्मान निधि",
    nameEn: "PM-KISAN Samman Nidhi",
    category: "केंद्र सरकार योजना",
    categoryIcon: "🏛️",
    benefit: "₹6,000 / साल — 3 किस्तों में सीधा बैंक ट्रांसफर",
    type: "आय सहायता",
    fee: "नि:शुल्क",
    eligibility: 95,
    deadline: "31 जुलाई 2024 तक",
    deadlineDaysLeft: 5,
    docs: ["आधार कार्ड", "भूमि/भूखंड विवरण", "बैंक पासबुक"],
    matched: true,
    applied: false,
    color: "bg-green-50",
    headerColor: "bg-green-700",
    badgeColor: "bg-green-100 text-green-700",
    url: "https://pmkisan.gov.in/",
  },
  {
    id: "pmfby",
    name: "PM फसल बीमा योजना",
    nameEn: "PM Fasal Bima Yojana",
    category: "केंद्र सरकार योजना",
    categoryIcon: "🌾",
    benefit: "फसल नुकसान पर बीमा — 2% प्रीमियम पर पूरी बीमा",
    type: "बीमा योजना",
    fee: "2% प्रीमियम",
    eligibility: 90,
    deadline: "31 दिसंबर 2024 तक",
    deadlineDaysLeft: 158,
    docs: ["आधार कार्ड", "बुआई का घोषणा पत्र", "जमीन के कागजात"],
    matched: true,
    applied: false,
    color: "bg-blue-50",
    headerColor: "bg-blue-700",
    badgeColor: "bg-blue-100 text-blue-700",
    url: "https://pmfby.gov.in/",
  },
  {
    id: "kusum",
    name: "PM-KUSUM योजना (सोलर पंप)",
    nameEn: "PM-KUSUM (Solar Pump)",
    category: "नवीकरणीय ऊर्जा",
    categoryIcon: "☀️",
    benefit: "60% से 90% तक सब्सिडी — सोलर पंप लगाने पर",
    type: "सब्सिडी योजना",
    fee: "नि:शुल्क",
    eligibility: 85,
    deadline: "30 जून 2024 तक",
    deadlineDaysLeft: 4,
    docs: ["आधार कार्ड", "भूमि स्वामित्व प्रमाण", "बैंक खाता विवरणी"],
    matched: true,
    applied: false,
    color: "bg-orange-50",
    headerColor: "bg-orange-600",
    badgeColor: "bg-orange-100 text-orange-700",
    url: "https://pmkusum.mnre.gov.in/",
  },
  {
    id: "kcc",
    name: "किसान क्रेडिट कार्ड (KCC)",
    nameEn: "Kisan Credit Card",
    category: "बैंकिंग योजना",
    categoryIcon: "💳",
    benefit: "₹3 लाख तक सस्ता लोन — 4% ब्याज दर पर",
    type: "ऋण योजना",
    fee: "नि:शुल्क",
    eligibility: 80,
    deadline: null,
    deadlineDaysLeft: null,
    docs: ["आधार कार्ड", "पैन कार्ड", "खसरा-खतौनी"],
    matched: true,
    applied: false,
    color: "bg-purple-50",
    headerColor: "bg-purple-700",
    badgeColor: "bg-purple-100 text-purple-700",
    url: "https://sbi.co.in/web/agri-rural/agriculture-banking/crop-loan/kisan-credit-card",
  },
  {
    id: "soil",
    name: "मृदा स्वास्थ्य कार्ड",
    nameEn: "Soil Health Card",
    category: "कृषि विभाग",
    categoryIcon: "🧪",
    benefit: "मिट्टी की जांच और खाद की सटीक सलाह — मुफ्त",
    type: "सेवा",
    fee: "नि:शुल्क",
    eligibility: 100,
    deadline: "15 जून 2024 तक",
    deadlineDaysLeft: 2,
    docs: ["आधार कार्ड", "मिट्टी का नमूना"],
    matched: true,
    applied: true,
    color: "bg-amber-50",
    headerColor: "bg-amber-700",
    badgeColor: "bg-amber-100 text-amber-700",
    url: "https://soilhealth.dac.gov.in/",
  },
  {
    id: "pkvy",
    name: "परंपरागत कृषि विकास योजना",
    nameEn: "Organic Farming (PKVY)",
    category: "जैविक खेती",
    categoryIcon: "🌿",
    benefit: "₹50,000/हेक्टेयर — जैविक खेती अपनाने पर",
    type: "अनुदान",
    fee: "नि:शुल्क",
    eligibility: 70,
    deadline: "अगस्त 2026",
    deadlineDaysLeft: null,
    docs: ["किसान समूह सदस्य", "आधार कार्ड"],
    matched: false,
    applied: false,
    color: "bg-teal-50",
    headerColor: "bg-teal-700",
    badgeColor: "bg-teal-100 text-teal-700",
    url: "https://pgsindia-ncof.gov.in/pkvy/index.aspx",
  },
];

function Schemes() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "matched" | "applied" | "expiring" | "saved">("all");
  const [saved, setSaved] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("krishisathi_saved_schemes") || "[]"); }
    catch { return []; }
  });
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const { t } = useTranslation();

  const expiring = ALL_SCHEMES.filter(s => s.deadlineDaysLeft !== null && s.deadlineDaysLeft <= 10);
  const applied = ALL_SCHEMES.filter(s => s.applied);

  const toggleSave = (id: string, name: string) => {
    setSaved(prev => {
      const next = prev.includes(id) ? prev.filter(n => n !== id) : [...prev, id];
      localStorage.setItem("krishisathi_saved_schemes", JSON.stringify(next));
      toast.success(prev.includes(id) ? t('bookmarkRemoved') : t('schemeSaved'));
      return next;
    });
  };

  const handleShare = (s: Scheme) => {
    if (navigator.share) {
      navigator.share({ title: s.name, text: s.benefit, url: s.url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(s.url);
      toast.success(t('linkCopied'));
    }
  };

  const filteredSchemes = useMemo(() => {
    const q = search.toLowerCase();
    return ALL_SCHEMES.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(q) || s.nameEn.toLowerCase().includes(q) || s.category.toLowerCase().includes(q);
      if (activeTab === "all") return matchesSearch;
      if (activeTab === "matched") return matchesSearch && s.matched;
      if (activeTab === "applied") return matchesSearch && s.applied;
      if (activeTab === "expiring") return matchesSearch && s.deadlineDaysLeft !== null && s.deadlineDaysLeft <= 10;
      if (activeTab === "saved") return matchesSearch && saved.includes(s.id);
      return matchesSearch;
    });
  }, [search, activeTab, saved]);

  const displayedSchemes = showAll ? filteredSchemes : filteredSchemes.slice(0, 3);

  return (
    <AppShell>
      <div className="max-w-[1600px] w-full mx-auto pb-24 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full mb-2 border border-primary/20">
              ✅ {t('personalizedForYou')}
            </div>
            <h1 className="font-display font-bold text-3xl text-foreground">{t('schemesTitle')}</h1>
            <p className="text-muted-foreground text-sm mt-1">{t('schemesSubtitle')}</p>
          </div>
          <Link to="/chat" className="flex items-center gap-2 bg-primary text-white font-bold text-sm px-4 py-2.5 rounded-xl shadow-md hover:bg-primary/90 transition-colors shrink-0 mt-2">
            <Bot className="size-4" /> {t('askAI')}
          </Link>
        </div>

        {/* Search + Filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder={t('searchSchemesPlaceholder')}
              className="w-full h-12 bg-white border-2 border-border rounded-xl px-11 text-sm focus:outline-none focus:border-primary transition-all shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">🔍</div>
          </div>
          <button className="h-12 px-4 bg-white border-2 border-border rounded-xl flex items-center gap-2 text-sm font-bold text-muted-foreground hover:border-primary hover:text-primary transition-colors shadow-sm">
            <Filter className="size-4" /> {t('filter')}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: "all", label: `${t('all')} (${ALL_SCHEMES.length})` },
            { id: "matched", label: `${t('forYou')} (${ALL_SCHEMES.filter(s=>s.matched).length})` },
            { id: "applied", label: `${t('applied')} (${applied.length})` },
            { id: "expiring", label: `${t('expiring')} (${expiring.length})` },
            { id: "saved", label: `${t('saved')} (${saved.length})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex-shrink-0 py-2 px-4 rounded-full text-sm font-bold transition-all border-2",
                activeTab === tab.id
                  ? "bg-primary text-white border-primary shadow-md"
                  : "bg-white text-muted-foreground border-border hover:border-primary/40"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Recommended Horizontal Scroll */}
        {(activeTab === "all" || activeTab === "matched") && !search && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
                <Zap className="size-5 text-orange-500" /> {t('recommendedForYou')}
              </h2>
              <button className="text-primary text-sm font-bold flex items-center gap-1 hover:underline">
                {t('seeAll')} <ChevronRight className="size-4" />
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1">
              {ALL_SCHEMES.filter(s => s.matched).map(s => (
                <div key={s.id} className="flex-shrink-0 w-52 flex flex-col bg-white rounded-2xl border-2 border-border shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <div className={cn("px-4 py-3 text-white", s.headerColor)}>
                    <div className="flex items-start justify-between">
                      <div className="text-2xl">{s.categoryIcon}</div>
                      <button onClick={() => toggleSave(s.id, s.name)} className="p-1 rounded-full bg-white/20 hover:bg-white/40 transition-colors">
                        {saved.includes(s.id) ? <BookmarkCheck className="size-3.5 text-yellow-300" /> : <Bookmark className="size-3.5 text-white" />}
                      </button>
                    </div>
                    <h3 className="font-bold text-sm leading-tight mt-2">{s.name}</h3>
                    <p className="text-white/70 text-[11px]">{s.category}</p>
                  </div>
                  <div className="p-3 flex flex-col flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", s.badgeColor)}>{s.eligibility}% {t('percentEligible')}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-snug mb-3">{s.benefit.split("—")[0]}</p>
                    {s.deadline && (
                      <div className={cn("flex items-center gap-1 text-[11px] font-bold rounded-lg px-2 py-1 mb-2",
                        s.deadlineDaysLeft && s.deadlineDaysLeft <= 10 ? "bg-red-50 text-red-600" : "bg-orange-50 text-orange-600"
                      )}>
                        <Clock className="size-3 shrink-0" />
                        <span className="truncate">{s.deadline}</span>
                        {s.deadlineDaysLeft && (
                          <span className="ml-auto font-extrabold shrink-0">{s.deadlineDaysLeft} {t('daysLeft')}</span>
                        )}
                      </div>
                    )}
                    <button onClick={() => window.open(s.url, "_blank")} className="mt-auto w-full bg-primary text-white text-xs font-bold py-2 rounded-lg hover:bg-primary/90 transition-colors">
                      {t('applyNowArrow')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expiring Soon Section */}
        {(activeTab === "all" || activeTab === "expiring") && !search && expiring.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
                ⏰ {t('expiringSchemes')}
              </h2>
              <button className="text-primary text-sm font-bold flex items-center gap-1 hover:underline">
                {t('seeAll')} <ChevronRight className="size-4" />
              </button>
            </div>
            <div className="bg-white rounded-2xl border-2 border-border shadow-sm overflow-hidden divide-y divide-border">
              {expiring.map(s => (
                <button
                  key={s.id}
                  onClick={() => window.open(s.url, "_blank")}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors text-left group"
                >
                  <div className={cn("size-10 rounded-xl flex items-center justify-center text-xl shrink-0", s.headerColor.replace("bg-", "bg-") + "/10")}>
                    {s.categoryIcon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-foreground truncate">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{t('applyBefore')} {s.deadline}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn("text-xs font-extrabold px-2 py-0.5 rounded-full",
                      s.deadlineDaysLeft! <= 5 ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600"
                    )}>
                      {s.deadlineDaysLeft} {t('daysLeft')}
                    </span>
                    <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* All Schemes List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-lg text-foreground">
              📋 {t('allSchemes')}
            </h2>
          </div>

          {filteredSchemes.length === 0 ? (
            <div className="text-center py-20 bg-muted/30 rounded-2xl border-2 border-dashed border-border">
              <div className="text-5xl mb-4">😕</div>
              <p className="text-muted-foreground font-bold">{t('noSchemesFound')}</p>
              <button onClick={() => { setSearch(""); setActiveTab("all"); }} className="text-primary font-bold mt-2 hover:underline">
                {t('clearAll')}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {displayedSchemes.map(s => (
                <div key={s.id} className="bg-white rounded-2xl border-2 border-border shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  {/* Row header */}
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50">
                    <div className={cn("size-9 rounded-xl flex items-center justify-center text-lg shrink-0 text-white", s.headerColor)}>
                      {s.categoryIcon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm text-foreground leading-tight">{s.name}</h3>
                      <p className="text-xs text-muted-foreground">{s.category}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", s.badgeColor)}>{s.eligibility}% {t('percentEligible')}</span>
                      {s.deadline && s.deadlineDaysLeft && (
                        <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1",
                          s.deadlineDaysLeft <= 10 ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600"
                        )}>
                          <Clock className="size-3" /> {s.deadlineDaysLeft} {t('daysLeft')}
                        </span>
                      )}
                      <button onClick={() => handleShare(s)} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                        <Share2 className="size-4" />
                      </button>
                    </div>
                  </div>

                  {/* Info Grid */}
                  <div className="px-4 py-3 grid grid-cols-4 gap-2 bg-muted/20 border-b border-border/50">
                    {[
                      { label: t('benefitLabel'), val: s.benefit.split("—")[0].trim() },
                      { label: t('typeLabel'), val: s.type },
                      { label: t('feeLabel'), val: s.fee },
                      { label: t('requiredDocsLabel'), val: s.docs.join(" • ") },
                    ].map(item => (
                      <div key={item.label}>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-0.5">{item.label}</p>
                        <p className="text-xs font-bold text-foreground leading-tight line-clamp-2">{item.val}</p>
                      </div>
                    ))}
                  </div>

                  {/* Eligibility Bar */}
                  <div className="px-4 py-3 border-b border-border/50">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-muted-foreground">{t('eligibilityScoreLabel')}</span>
                      <span className="font-extrabold text-primary">{s.eligibility}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all duration-700", s.eligibility >= 90 ? "bg-green-500" : s.eligibility >= 80 ? "bg-blue-500" : "bg-orange-500")}
                        style={{ width: `${s.eligibility}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="px-4 py-3 flex items-center gap-2">
                    <button
                      onClick={() => window.open(s.url, "_blank")}
                      className="flex-1 btn-saffron flex items-center justify-center gap-2 py-2.5 text-sm"
                    >
                      {t('applyLabel')} <ExternalLink className="size-3.5" />
                    </button>
                    <button
                      onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold border-2 border-primary/30 text-primary rounded-xl hover:bg-primary/5 transition-colors"
                    >
                      {t('viewDetailsLabel')} <ChevronDown className={cn("size-4 transition-transform", expanded === s.id && "rotate-180")} />
                    </button>
                    <button
                      onClick={() => toggleSave(s.id, s.name)}
                      className={cn("p-2.5 rounded-xl border-2 transition-colors", saved.includes(s.id) ? "border-yellow-400 bg-yellow-50 text-yellow-600" : "border-border text-muted-foreground hover:border-primary hover:text-primary")}
                    >
                      {saved.includes(s.id) ? <BookmarkCheck className="size-5" /> : <Bookmark className="size-5" />}
                    </button>
                  </div>

                  {/* Expanded Details */}
                  {expanded === s.id && (
                    <div className={cn("px-4 pb-4 pt-2 border-t border-border/50", s.color)}>
                      <p className="text-sm font-bold text-foreground mb-2">📄 {t('requiredDocsLabel')}:</p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {s.docs.map(d => (
                          <span key={d} className="flex items-center gap-1.5 bg-white text-foreground text-xs font-bold px-3 py-1.5 rounded-lg border border-border shadow-sm">
                            ✅ {d}
                          </span>
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        <span className="font-bold text-foreground">{t('benefitLabel')}:</span> {s.benefit}
                      </p>
                      {s.deadline && (
                        <p className="text-sm font-bold text-destructive mt-2 flex items-center gap-1.5">
                          <Clock className="size-4" /> {t('lastDateLabel')}: {s.deadline}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {filteredSchemes.length > 3 && (
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold text-primary border-2 border-primary/30 rounded-2xl hover:bg-primary/5 transition-colors bg-white"
                >
                  {showAll ? t('showLess') : `${t('seeMoreSchemesLabel')} (${filteredSchemes.length - 3} ${t('more')})`} <ChevronDown className={cn("size-4 transition-transform", showAll && "rotate-180")} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* AI Help Card */}
        <div className="bg-primary/10 border-2 border-primary/20 rounded-2xl p-4 flex gap-4 items-center">
          <div className="size-12 rounded-full bg-primary flex items-center justify-center text-2xl shadow-md shrink-0">🤖</div>
          <div className="flex-1">
            <div className="font-bold text-foreground">{t('needHelpSchemesLabel')}</div>
            <p className="text-sm text-muted-foreground">{t('askAIAssistantLabel')}</p>
          </div>
          <Link to="/chat" className="bg-primary text-white font-bold text-sm px-4 py-2.5 rounded-xl shrink-0 hover:bg-primary/90 transition-colors flex items-center gap-1.5">
            <Bot className="size-4" /> {t('askAI')}
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
