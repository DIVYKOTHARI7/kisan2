import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { recommendCrops, type CropRecResult } from "@/lib/mockData";
import { ArrowRight, CheckCircle2, ChevronRight, Info, Plus, Leaf, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { api, getApiTokens } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/crop-recommend")({
  head: () => ({
    meta: [
      { title: "फसल सलाह — KrishiSathi" },
      { name: "description", content: "अपनी मिट्टी और मौसम के आधार पर सही फसल चुनें।" },
    ],
  }),
  component: CropRecommend,
});
function CropRecommend() {
  const [step, setStep] = useState(0);
  const [soil, setSoil] = useState("alluvial");
  const [season, setSeason] = useState("rabi");
  const [ph, setPh] = useState(6.5);
  const [n, setN] = useState(60);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [expandedCrop, setExpandedCrop] = useState<string | null>(null);
  const { t } = useTranslation();

  const steps = [t('step1'), t('step2'), t('step3'), t('step4')];

  const soilTypes = [
    { 
      id: "alluvial", 
      label: t('soilAlluvial'), 
      desc: "पोषक तत्वों से भरपूर, खेती के लिए उत्तम", 
      color: "bg-[#D2B48C]",
      bgImg: "https://img.freepik.com/free-vector/landscape-nature-scene-with-river-hill_1308-55230.jpg?w=300" 
    },
    { 
      id: "black", 
      label: t('soilBlack'), 
      desc: "कपास और तिलहन फसलों के लिए उपयुक्त", 
      color: "bg-[#333333]",
      bgImg: "https://img.freepik.com/free-vector/desert-landscape-scene-with-cactus-mountains_1308-56230.jpg?w=300" // Placeholder, will adjust
    },
    { 
      id: "red", 
      label: t('soilRed'), 
      desc: "मध्यम उर्वरता, दलहन और तिलहन के लिए अच्छी", 
      color: "bg-[#CD5C5C]",
      bgImg: "https://img.freepik.com/free-vector/autumn-landscape-nature-scene_1308-54320.jpg?w=300"
    },
    { 
      id: "sandy", 
      label: t('soilSandy'), 
      desc: "जल निकास उत्तम, मूंगफली और सब्जियों के लिए उपयुक्त", 
      color: "bg-[#F4A460]",
      bgImg: "https://img.freepik.com/free-vector/desert-landscape-scene-with-cactus-mountains_1308-56230.jpg?w=300"
    },
  ];

  async function handleNext() {
    if (step < 2) {
      setStep(step + 1);
    } else if (step === 2) {
      setLoading(true);
      try {
        const tokens = getApiTokens();
        const resp = await api.crop.recommend(tokens?.access_token || "", {
          n, 
          p: 40, 
          k: 30, 
          ph,
          soilType: soil,
          season: season === 'rabi' ? 'Rabi' : 'Kharif',
          irrigation: "Canal", // Default
          budget: 50000.0, // Default
          risk: "medium", // Default
        });
        
        if (resp && (resp as any).recommendations) {
          setResults((resp as any).recommendations);
          setStep(3);
        } else {
          toast.error("सिफारिश प्राप्त करने में विफल।");
        }
      } catch (error: any) {
        console.error("Crop recommendation error:", error);
        toast.error(`सर्वर त्रुटि: ${error?.message || "Unknown error"}`);
      } finally {
        setLoading(false);
      }
    }
  }

  return (
    <AppShell>
      <div className="max-w-[1600px] w-full mx-auto space-y-6">
        {/* Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-accent bg-accent/10 px-3 py-1.5 rounded-full mb-3 border border-accent/20">
            {t('cropSelectionGuide')}
          </div>
          <h1 className="font-display font-bold text-3xl text-foreground">{t('cropRecTitle')}</h1>
          <p className="text-muted-foreground mt-1">{t('cropRecSubtitle')}</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8 relative">
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-border -translate-y-1/2 -z-10" />
          {steps.map((s, i) => (
            <div key={s} className="flex flex-col items-center gap-2">
              <div
                className={cn(
                  "size-10 rounded-full flex items-center justify-center font-bold border-2 transition-all duration-300",
                  step >= i ? "bg-accent border-accent text-white scale-110 shadow-md" : "bg-white border-border text-muted-foreground"
                )}
              >
                {step > i ? <CheckCircle2 className="size-5" /> : i + 1}
              </div>
              <span className={cn("text-[11px] font-bold uppercase tracking-wider", step >= i ? "text-accent" : "text-muted-foreground")}>
                {s}
              </span>
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="card-farm p-6 mb-20 min-h-[400px] flex flex-col">
          {step === 0 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <h2 className="font-display font-bold text-xl text-foreground mb-2">{t('chooseSoilType')}</h2>
                <p className="text-muted-foreground">{t('chooseSoilTypeEn')}</p>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {soilTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setSoil(type.id)}
                    className={cn(
                      "relative flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all duration-300 overflow-hidden group h-32",
                      soil === type.id 
                        ? "border-primary bg-primary/5 shadow-lg ring-1 ring-primary/20" 
                        : "border-border hover:border-primary/40 bg-white"
                    )}
                  >
                    {/* Background Illustration */}
                    <div className="absolute bottom-0 right-0 w-32 h-20 opacity-20 group-hover:opacity-30 transition-opacity">
                       <div className={cn("w-full h-full bg-cover bg-no-repeat bg-bottom", type.id === 'alluvial' ? 'grayscale-0' : 'grayscale')} style={{ backgroundImage: `url(${type.bgImg})` }} />
                    </div>

                    <div className={cn("size-14 rounded-full shadow-md shrink-0 flex items-center justify-center border-4 border-white", type.color)}>
                       {soil === type.id && <CheckCircle2 className="size-6 text-white" />}
                    </div>
                    <div className="relative z-10 flex-1">
                      <div className="font-bold text-base text-foreground mb-1">
                        {type.label} ({type.id.charAt(0).toUpperCase() + type.id.slice(1)})
                      </div>
                      <p className="text-xs text-muted-foreground leading-snug max-w-[160px]">
                        {type.desc}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
              
              {/* Custom pH Slider */}
              <div className="bg-muted/30 rounded-2xl p-6 border border-border mt-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <Info className="size-5" />
                    </div>
                    <div>
                      <div className="font-bold text-foreground">
                        मिट्टी का pH स्तर: <span className="text-primary text-lg">{ph.toFixed(1)}</span>
                      </div>
                      <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                        {ph >= 6 && ph <= 7.5 ? 'सामान्य' : 'असामान्य'}
                      </span>
                    </div>
                  </div>
                  <div className="bg-green-50 text-green-700 px-3 py-1.5 rounded-lg text-xs font-medium border border-green-200 flex items-center gap-2">
                    <CheckCircle2 className="size-3" /> {ph >= 6 && ph <= 7.5 ? '6.5 pH स्तर अधिकांश फसलों के लिए उपयुक्त है।' : 'pH स्तर का ध्यान रखें।'}
                  </div>
                </div>

                <div className="relative pt-6 pb-2">
                  <div className="h-3 w-full rounded-full bg-gradient-to-r from-orange-400 via-yellow-400 to-green-500 relative">
                    <div 
                      className="absolute top-1/2 -translate-y-1/2 size-6 bg-white border-[4px] border-primary rounded-full shadow-lg cursor-pointer transition-all"
                      style={{ left: `${((ph - 4) / 5) * 100}%` }}
                    />
                  </div>
                  <input
                    type="range"
                    min="4"
                    max="9"
                    step="0.1"
                    value={ph}
                    onChange={(e) => setPh(parseFloat(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="flex justify-between text-[11px] font-bold text-muted-foreground mt-4 px-1">
                    <div className="flex flex-col items-center gap-1">
                      <span>अम्लीय (4.0)</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <span>सामान्य (7.0)</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <span>क्षारीय (9.0)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-start gap-4 p-4 bg-muted/20 rounded-xl border border-border">
                 <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Plus className="size-6" /> 
                 </div>
                 <div>
                    <h2 className="font-display font-bold text-xl text-foreground mb-1">मौसम और नाइट्रोजन</h2>
                    <p className="text-xs text-muted-foreground">सटीक सलाह के लिए मौसम और पोषक तत्वों की जानकारी दें</p>
                 </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { id: 'rabi', label: 'रबी (Rabi)', desc: 'अक्टूबर - मार्च के बीच बुवाई', icon: '🌾' },
                  { id: 'kharif', label: 'खरीफ (Kharif)', desc: 'जून - अक्टूबर के बीच बुवाई', icon: '🌽' }
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSeason(s.id)}
                    className={cn(
                      "flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all duration-300 group",
                      season === s.id
                        ? "border-primary bg-primary/5 shadow-md" : "border-border hover:border-primary/40 bg-white"
                    )}
                  >
                    <div className="size-12 rounded-xl bg-orange-50 flex items-center justify-center text-2xl border border-orange-100 group-hover:scale-110 transition-transform">
                      {s.icon}
                    </div>
                    <div className="flex-1">
                       <div className="font-bold text-base text-foreground">{s.label}</div>
                       <div className="text-xs text-muted-foreground">{s.desc}</div>
                    </div>
                    <div className={cn("size-6 rounded-full border-2 flex items-center justify-center", season === s.id ? "border-primary bg-primary" : "border-border")}>
                       {season === s.id && <div className="size-2 rounded-full bg-white" />}
                    </div>
                  </button>
                ))}
              </div>

              <div className="bg-muted/30 rounded-2xl p-6 border border-border">
                <div className="flex items-center gap-2 mb-6">
                  <div className="font-bold text-foreground">नाइट्रोजन (N) स्तर: <span className="text-primary">{n} mg/kg</span></div>
                  <Info className="size-4 text-muted-foreground" />
                </div>
                
                <div className="relative pt-6 pb-2">
                  <div className="h-3 w-full rounded-full bg-gradient-to-r from-orange-200 via-orange-400 to-orange-600 relative">
                    <div 
                      className="absolute top-1/2 -translate-y-1/2 size-7 bg-white border-[5px] border-primary rounded-full shadow-lg cursor-pointer transition-all"
                      style={{ left: `${(n / 140) * 100}%` }}
                    />
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="140"
                    value={n}
                    onChange={(e) => setN(parseInt(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="flex justify-between text-[11px] font-bold text-muted-foreground mt-4 px-1">
                    <span>कम (0 mg/kg)</span>
                    <span>मध्यम (60 mg/kg)</span>
                    <span>उच्च (120 mg/kg)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300 py-4">
              <div className="text-center space-y-4">
                <div className="relative inline-block">
                  <div className="size-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto relative z-10">
                    <div className="size-16 bg-white rounded-xl shadow-lg flex items-center justify-center border border-primary/20">
                      <div className="size-10 bg-primary/10 rounded flex items-center justify-center">
                        <Leaf className="size-6 text-primary" />
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-0 right-0 size-4 bg-yellow-400 rounded-full animate-ping opacity-50" />
                </div>
                
                <div className="space-y-2">
                  <h2 className="font-display font-bold text-2xl text-foreground">आपकी फसल सिफारिश तैयार हो रही है...</h2>
                  <p className="text-sm text-muted-foreground">हम आपकी मिट्टी, मौसम और पोषक तत्वों का विश्लेषण कर रहे हैं।</p>
                  <p className="text-xs font-bold text-accent">बस कुछ ही सेकंड...</p>
                </div>
              </div>

              {/* Progress Steps */}
              <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
                  {[
                    { label: 'मिट्टी का विश्लेषण', sub: 'पूरा हुआ', done: true },
                    { label: 'मौसम का चयन', sub: 'पूरा हुआ', done: true },
                    { label: 'पोषक तत्व जाँच', sub: 'पूरा हुआ', done: true },
                    { label: 'सिफारिश तैयार...', sub: 'कृपया प्रतीक्षा करें', done: false, loading: true },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center gap-3 w-full md:w-auto">
                      <div className={cn(
                        "size-10 rounded-full flex items-center justify-center shrink-0 border-2",
                        s.done ? "bg-primary/10 border-primary text-primary" : "bg-muted border-border text-muted-foreground"
                      )}>
                        {s.done ? <CheckCircle2 className="size-5" /> : (s.loading ? <div className="size-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /> : i + 1)}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-foreground leading-none mb-1">{s.label}</div>
                        <div className={cn("text-[10px]", s.done ? "text-primary font-medium" : "text-muted-foreground")}>{s.sub}</div>
                      </div>
                      {i < 3 && <div className="hidden md:block w-8 h-px bg-border mx-2" />}
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-bold text-foreground">प्रगति:</span>
                    <span className="text-sm font-bold text-primary">78%</span>
                  </div>
                  <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full w-[78%] animate-pulse" />
                  </div>
                </div>
              </div>

              <button
                onClick={handleNext}
                disabled={loading}
                className="w-full btn-saffron flex items-center justify-center gap-3 py-4 text-lg shadow-xl hover:scale-[1.02] transition-transform disabled:opacity-70"
              >
                {loading ? (
                  <div className="size-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>📊 मेरी फसल सिफारिश देखें <ArrowRight className="size-5" /></>
                )}
              </button>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: "👥", text: "5000+ किसानों द्वारा उपयोग" },
                  { icon: "🔬", text: "वैज्ञानिक डेटा आधारित सुझाव" },
                  { icon: "📍", text: "आपके क्षेत्र के अनुसार सिफारिश" },
                ].map((b, i) => (
                  <div key={i} className="bg-success/5 border border-success/10 rounded-xl p-3 flex flex-col items-center text-center gap-1">
                    <span className="text-xl">{b.icon}</span>
                    <span className="text-[10px] font-bold text-foreground/70 leading-tight">{b.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h2 className="font-display font-bold text-xl text-foreground mb-2">{t('topCropRecs')}</h2>
                <p className="text-muted-foreground">{t('bestCropsEn')}</p>
              </div>
              <div className="space-y-4">
                {results.map((r, i) => (
                  <div key={r.crop} className="card-farm border-2 border-primary/10 bg-white p-5 relative overflow-hidden group transition-all duration-300">
                    <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold px-4 py-1.5 rounded-bl-xl shadow-md z-10">
                      #{i + 1} {t('matchLabel')}
                    </div>
                    
                    <div className="flex items-start gap-5">
                      <div className="size-20 rounded-3xl bg-primary/5 shadow-inner border border-primary/10 flex items-center justify-center text-5xl shrink-0 group-hover:scale-110 transition-transform">
                        {r.emoji}
                      </div>
                      <div className="flex-1 pt-1">
                        <h3 className="font-display font-bold text-2xl text-primary leading-tight">{r.crop}</h3>
                        <div className="text-base font-bold text-success flex items-center gap-1 mt-1">
                          {t('expectedProfitLabel')} <span className="text-lg">₹{r.expectedProfit.toLocaleString("en-IN")}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mt-4">
                          <span className={cn(
                            "text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-tight border shadow-sm",
                            r.riskLevel === "low" ? "bg-green-100 text-green-700 border-green-300" : "bg-orange-100 text-orange-700 border-orange-300"
                          )}>
                            {t(r.riskLevel as any)} {t('riskLabel')}
                          </span>
                          <span className="text-sm font-medium text-muted-foreground bg-muted/50 px-3 py-1 rounded-full border border-border/30">
                            🌾 {r.expectedYield}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-5 border-t border-border/50">
                      <div className="flex items-start gap-3 text-sm text-foreground/80 bg-primary/5 p-4 rounded-xl border border-primary/5">
                        <Info className="size-5 text-primary shrink-0 mt-0.5" />
                        <p className="leading-relaxed">{r.reason}</p>
                      </div>

                      {/* Expandable Section */}
                      <div className={cn(
                        "mt-5 space-y-5 overflow-hidden transition-all duration-500 ease-in-out",
                        expandedCrop === r.crop ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
                      )}>
                        {r.tips && r.tips.length > 0 && (
                          <div className="space-y-3 bg-white/40 p-4 rounded-xl border border-border/50">
                            <div className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                              <Leaf className="size-4" /> {t('expertTips')}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {r.tips.map((tip: string, idx: number) => (
                                <div key={idx} className="text-sm text-foreground/70 flex items-start gap-3 bg-white p-3 rounded-lg border border-border/30 shadow-sm">
                                  <div className="size-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                                    {idx + 1}
                                  </div>
                                  <p>{tip}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-200/50">
                          <div className="text-xs font-bold text-orange-700 uppercase tracking-widest mb-3">{t('farmDetails')}</div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-[10px] text-muted-foreground uppercase">{t('nitrogenLabel')}</div>
                              <div className="text-sm font-bold text-foreground">60 kg/ha</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-muted-foreground uppercase">{t('phLabel')}</div>
                              <div className="text-sm font-bold text-foreground">{ph} (Ideal)</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={() => setExpandedCrop(expandedCrop === r.crop ? null : r.crop)}
                        className="w-full mt-4 flex items-center justify-center gap-2 text-primary font-bold text-sm bg-primary/5 hover:bg-primary/10 py-3 rounded-xl transition-colors border border-primary/10 group"
                      >
                        {expandedCrop === r.crop ? "कम दिखाएं ↑" : t('learnMore')} 
                        <ChevronRight className={cn("size-4 transition-transform", expandedCrop === r.crop ? "-rotate-90" : "rotate-90")} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setStep(0)}
                className="w-full text-center text-sm font-bold text-muted-foreground hover:text-primary transition-colors py-2"
              >
                {t('checkAgain')}
              </button>
            </div>
          )}

          <div className="mt-auto pt-8">
            {step < 3 && (
              <button
                onClick={handleNext}
                className="btn-saffron w-full flex items-center justify-center gap-3 text-lg shadow-lg group"
              >
                {step === 2 ? t('seeRecommendation') : t('nextBtn')}
                <ArrowRight className="size-5 group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </div>
        </div>

        {/* Action Help */}
        <div className="bg-[#FEF3E2] border-2 border-accent/20 rounded-xl p-4 flex gap-4 items-center">
          <div className="size-12 rounded-full bg-accent/20 flex items-center justify-center text-2xl shrink-0">💡</div>
          <p className="text-sm text-foreground/80 leading-relaxed">
            <b>{t('noteLabel')}</b> {t('soilTestNote')}
          </p>
        </div>
      </div>
    </AppShell>
  );
}
