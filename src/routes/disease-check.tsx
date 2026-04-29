import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { AppShell } from "@/components/AppShell";
import { detectDisease, type DiseaseResult } from "@/lib/mockData";
import { ArrowLeft, ExternalLink, Phone, Shield, Clock, Leaf, Search, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { resolvePlan, resolveRole } from "@/lib/rbac";
import { incrementFeatureUsage, isQuotaExceeded } from "@/lib/usage";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";
import { api, type DiseaseInfo } from "@/lib/api";

export const Route = createFileRoute("/disease-check")({
  head: () => ({
    meta: [
      { title: "रोग जाँच — KrishiSathi" },
      { name: "description", content: "पत्ती की फोटो लेकर फसल रोग की पहचान करें।" },
    ],
  }),
  component: DiseaseCheck,
});

function DiseaseCheck() {
  const { profile, user } = useAuth();
  const role = resolveRole(profile, user);
  const plan = resolvePlan(profile, role);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiseaseInfo | DiseaseResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  async function handleFiles(files: FileList | null) {
    if (isQuotaExceeded("disease_detection", plan)) {
      toast.error(t('quotaExceeded'));
      return;
    }
    if (!files?.[0]) return;
    const file = files[0];
    const url = URL.createObjectURL(file);
    setImgUrl(url);
    setLoading(true);
    setResult(null);
    
    try {
      const resp = await api.disease.analyze(file);
      if (resp.success && resp.disease) {
        setResult(resp.disease);
        incrementFeatureUsage("disease_detection");
      } else {
        toast.error(resp.error || "पहचान नहीं हो सकी, कृपया साफ़ फोटो लें");
        setImgUrl(null);
      }
    } catch (err) {
      console.error(err);
      toast.error("सर्वर से संपर्क नहीं हो सका");
      setImgUrl(null);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setImgUrl(null);
    setResult(null);
  }

  const examples = [
    { img: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Late_blight_on_potato_leaf_2.jpg/500px-Late_blight_on_potato_leaf_2.jpg", labelKey: "exampleBlight" },
    { img: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Gurkenmosaikvirus.JPG/500px-Gurkenmosaikvirus.JPG", labelKey: "exampleYellowMosaic" },
    { img: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Aphids_September_2008-1.jpg/500px-Aphids_September_2008-1.jpg", labelKey: "exampleAphids" },
    { img: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Alternaria_solani_-_leaf_lesions.jpg/500px-Alternaria_solani_-_leaf_lesions.jpg", labelKey: "exampleLeafBlight" },
    { img: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/Sclerotinia_sclerotiorum.jpg/500px-Sclerotinia_sclerotiorum.jpg", labelKey: "exampleStemRot" },
  ];

  return (
    <AppShell>
      <div className="max-w-[1600px] w-full mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold text-accent bg-accent/10 px-3 py-1.5 rounded-full mb-3 border border-accent/20">
              🤖 {t('aiVisionTech')}
            </div>
            <h1 className="font-display font-bold text-3xl text-foreground">{t('diseaseTitle')}</h1>
            <p className="text-muted-foreground mt-1">{t('diseaseSubtitle')}</p>
          </div>
          <button className="flex items-center gap-2 bg-white border border-border px-4 py-2 rounded-lg font-bold text-sm text-foreground shadow-sm hover:bg-muted/50 transition-colors">
            <ExternalLink className="size-4" /> {t('myCheckReport')}
          </button>
        </div>

        {!imgUrl ? (
          <div className="space-y-4">
            {/* Main Upload and Tips Card */}
            <div className="card-farm p-6">
              <div className="grid lg:grid-cols-2 gap-8 mb-8">
                {/* Upload zone */}
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
                  onClick={() => fileRef.current?.click()}
                  className="border-[3px] border-dashed border-primary/30 rounded-2xl p-10 flex flex-col items-center justify-center text-center hover:border-primary hover:bg-primary/5 transition-all duration-300 cursor-pointer group bg-muted/30"
                >
                  <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 relative">
                    <div className="size-10 bg-[#2b3a36] rounded text-white flex items-center justify-center relative shadow-md">
                      <div className="size-4 rounded-full border-2 border-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                      <div className="w-2 h-1 bg-white absolute top-1 left-1/2 -translate-x-1/2 rounded-full" />
                    </div>
                    <Leaf className="size-6 text-primary absolute -bottom-1 -right-1 fill-primary" />
                  </div>
                  <div className="font-bold text-xl text-foreground mb-1">{t('takePhoto')}</div>
                  <div className="text-sm text-muted-foreground mb-1">{t('takePhotoEn')}</div>
                  <div className="text-sm text-muted-foreground mb-6">{t('dragDropPhoto')}</div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => handleFiles(e.target.files)}
                  />
                  <button
                    onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
                    className="bg-[#2b3a36] text-white font-bold inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm shadow-md hover:bg-[#1a2522] transition-colors"
                  >
                    📱 {t('choosePhoto')}
                  </button>
                  <div className="text-[11px] text-muted-foreground mt-4 font-medium uppercase tracking-wider">
                    JPG, PNG, WebP (Max 10MB)
                  </div>
                </div>

                {/* Tips */}
                <div className="bg-muted/30 rounded-2xl p-6 border border-border">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-1 h-5 bg-accent rounded-full" />
                    <h3 className="font-bold text-lg text-foreground">{t('photoTipsTitle')}</h3>
                  </div>
                  <div className="space-y-4">
                    {[
                      { icon: "☀️", title: t('tip1'), desc: t('tip1En') },
                      { icon: "🔍", title: t('tip2'), desc: t('tip2En') },
                      { icon: "📏", title: t('tip3'), desc: t('tip3En') },
                    ].map((t, i) => (
                      <div key={i} className="flex gap-4 p-4 bg-white rounded-xl shadow-sm border border-border/50 hover:border-primary/30 transition-colors">
                        <div className="text-3xl shrink-0">{t.icon}</div>
                        <div>
                          <div className="font-bold text-sm text-foreground mb-0.5">{t.title}</div>
                          <div className="text-xs text-muted-foreground leading-relaxed">{t.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Example Photos Divider */}
              <div className="relative flex items-center justify-center my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative bg-white px-4 text-sm font-bold text-muted-foreground">
                  {t('tryExamplePhotos')}
                </div>
              </div>

              {/* Example Photos */}
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {examples.map((ex, i) => (
                  <button 
                    key={i} 
                    onClick={() => {
                      setImgUrl(ex.img);
                      setLoading(true);
                      setTimeout(() => {
                        setResult(detectDisease());
                        setLoading(false);
                      }, 1600);
                    }}
                    className="flex flex-col items-center gap-2 group text-left"
                  >
                    <div className="aspect-[4/3] w-full rounded-xl overflow-hidden border border-border shadow-sm group-hover:border-primary group-hover:shadow-md transition-all">
                      <img src={ex.img} alt={t(ex.labelKey as any)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <span className="text-xs font-bold text-foreground/80 group-hover:text-primary transition-colors text-center">
                      {t(ex.labelKey as any)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Features Row */}
            <div className="card-farm flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-border">
              {[
                { icon: Shield, iconColor: "text-blue-500", bg: "bg-blue-50", title: t('featureAccurateTitle'), desc: t('featureAccurateDesc') },
                { icon: Clock, iconColor: "text-primary", bg: "bg-primary/10", title: t('featureFastTitle'), desc: t('featureFastDesc') },
                { icon: Leaf, iconColor: "text-primary", bg: "bg-primary/10", title: t('featureTreatmentTitle'), desc: t('featureTreatmentDesc') },
              ].map((f, i) => (
                <div key={i} className="flex-1 p-5 flex items-center gap-4">
                  <div className={cn("size-12 rounded-full flex items-center justify-center shrink-0", f.bg, f.iconColor)}>
                    <f.icon className="size-6" />
                  </div>
                  <div>
                    <div className="font-bold text-foreground text-sm mb-0.5">{f.title}</div>
                    <div className="text-xs text-muted-foreground">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Emergency helpline */}
            <div className="bg-[#c2413a]/10 border border-[#c2413a]/20 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-full bg-white flex items-center justify-center text-2xl shadow-sm shrink-0">🚨</div>
                <div>
                  <div className="font-bold text-[#c2413a] text-lg mb-0.5">{t('agriHelpline')}</div>
                  <div className="text-sm text-[#c2413a]/80 font-medium">{t('callForHelp')}</div>
                </div>
              </div>
              <a
                href="tel:18001801551"
                className="flex items-center gap-2 bg-[#c2413a] text-white font-bold text-sm px-6 py-3 rounded-lg shadow-md hover:bg-[#a6352f] transition-colors whitespace-nowrap"
              >
                <Phone className="size-4" /> 1800-180-1551
              </a>
            </div>

            <p className="text-center text-xs text-muted-foreground font-medium pt-2">
              आपकी जानकारी सुरक्षित है और किसी के साथ साझा नहीं की जाती
            </p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[1fr_1.3fr] gap-5">
            {/* Image preview */}
            <div className="card-farm overflow-hidden">
              <div className="aspect-square bg-muted relative overflow-hidden">
                <img src={imgUrl} alt="अपलोड की गई पत्ती" className="w-full h-full object-cover" />
                {loading && (
                  <div className="absolute inset-0 bg-primary/70 flex flex-col items-center justify-center gap-4">
                    <div className="text-5xl animate-bounce">🔬</div>
                    <div className="text-white font-bold text-lg">{t('analyzing')}</div>
                    <div className="text-white/80 text-sm">{t('analyzingEn')}</div>
                  </div>
                )}
              </div>
              <div className="p-4 flex justify-between items-center bg-white border-t border-border">
                <span className="text-sm font-medium text-muted-foreground">{t('uploadedPhotoLabel')}</span>
                <button
                  onClick={reset}
                  className="flex items-center gap-1.5 text-sm font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors"
                >
                  <ArrowLeft className="size-4" /> {t('anotherPhoto')}
                </button>
              </div>
            </div>

            {/* Result */}
            <div>
              {loading && <LoadingSkeleton />}
              {result && <ResultPanel result={result} />}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function LoadingSkeleton() {
  return (
    <div className="card-farm p-6 space-y-4">
      <div className="skeleton h-6 w-1/2 rounded" />
      <div className="skeleton h-8 w-3/4 rounded" />
      <div className="skeleton h-4 w-full rounded" />
      <div className="skeleton h-4 w-2/3 rounded" />
      <div className="grid grid-cols-3 gap-3">
        <div className="skeleton h-16 rounded" />
        <div className="skeleton h-16 rounded" />
        <div className="skeleton h-16 rounded" />
      </div>
      <div className="skeleton h-5 w-1/2 rounded" />
      <div className="space-y-2">
        <div className="skeleton h-12 rounded" />
        <div className="skeleton h-12 rounded" />
        <div className="skeleton h-12 rounded" />
      </div>
    </div>
  );
}

const SEVERITY = {
  low: { label: "कम", labelEn: "Low", bg: "bg-success/10", border: "border-success", text: "text-success", badge: "🟢" },
  medium: { label: "मध्यम", labelEn: "Medium", bg: "bg-warning/10", border: "border-warning", text: "text-warning", badge: "🟡" },
  high: { label: "अधिक", labelEn: "High", bg: "bg-destructive/10", border: "border-destructive", text: "text-destructive", badge: "🔴" },
  critical: { label: "अत्यधिक", labelEn: "Critical", bg: "bg-destructive/20", border: "border-destructive", text: "text-destructive", badge: "💀" },
} as const;

function ResultPanel({ result }: { result: DiseaseResult | DiseaseInfo }) {
  const { t, lang } = useTranslation();
  const isApiResult = 'disease_name' in result;
  
  const diseaseName = isApiResult 
    ? (lang === 'hi' ? result.disease_name_hindi : result.disease_name) 
    : result.disease;
    
  const cropName = isApiResult 
    ? (lang === 'hi' ? result.crop_name_hindi : result.crop_name) 
    : result.crop;

  const description = isApiResult 
    ? (lang === 'hi' ? result.description_hindi : result.description) 
    : result.description;

  const sevKey = (isApiResult ? result.severity.toLowerCase() : result.severity) as keyof typeof SEVERITY;
  const sev = SEVERITY[sevKey] || SEVERITY.medium;
  
  const confidence = isApiResult ? result.confidence : result.confidence;
  const affected = isApiResult ? `${result.affected_area_percent}%` : result.affectedArea;
  const cost = isApiResult ? result.estimated_cost_inr : result.costEstimate;

  return (
    <div className="card-farm p-5 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
      {/* Disease name */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-sm font-bold text-destructive">
            {t('diseaseDetected')}
          </div>
          {isApiResult && result.scientific_name && (
            <div className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
              {result.scientific_name}
            </div>
          )}
        </div>
        <h2 className="font-display font-bold text-2xl text-foreground leading-tight">{diseaseName}</h2>
        <p className="text-muted-foreground mt-1 font-medium">{cropName} {t('inCrop')}</p>
        <p className="text-sm text-foreground/80 mt-4 leading-relaxed bg-muted/30 p-3 rounded-lg border border-border/50">
          {description}
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: t('confidence'), value: `${confidence}%`, sub: t('confidenceEn') },
          { label: t('severityLabel'), value: `${sev.badge} ${t(sevKey as any)}`, sub: t(`${sevKey}En` as any), highlight: true },
          { label: t('affected'), value: affected, sub: t('affectedEn') },
        ].map((m) => (
          <div key={m.label} className={cn(
            "rounded-xl p-3 text-center border-2 transition-all", 
            m.highlight ? `${sev.bg} ${sev.border} ${sev.text}` : "bg-muted/50 border-border"
          )}>
            <div className="text-[10px] font-bold opacity-70 uppercase tracking-wider mb-1">{m.label}</div>
            <div className="font-display font-bold text-base">{m.value}</div>
            <div className="text-[9px] opacity-60 font-medium">{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Symptoms & Prevention (New for API results) */}
      {isApiResult && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              {t('symptomsLabel')}
            </h3>
            <ul className="space-y-2">
              {(lang === 'hi' ? result.symptoms_hindi : result.symptoms).map((s, i) => (
                <li key={i} className="text-xs text-muted-foreground flex gap-2">
                  <span className="text-primary">•</span> {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              {t('preventionLabel')}
            </h3>
            <ul className="space-y-2">
              {(lang === 'hi' ? result.prevention_tips_hindi : result.prevention_tips).map((p, i) => (
                <li key={i} className="text-xs text-muted-foreground flex gap-2">
                  <Shield className="size-3 text-success shrink-0 mt-0.5" /> {p}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Treatment */}
      <div className="space-y-4">
        <h3 className="font-display font-bold text-lg text-foreground flex items-center gap-2 border-b border-border pb-2">
          {t('treatmentPlan')}
        </h3>
        
        {isApiResult ? (
          <div className="space-y-6">
            {/* Organic */}
            {result.organic_treatment.length > 0 && (
              <div className="space-y-3">
                <div className="text-sm font-bold text-primary flex items-center gap-2 bg-primary/5 px-3 py-1 rounded-full w-fit">
                  {t('organicTreatment')}
                </div>
                <div className="space-y-3 pl-2">
                  {(lang === 'hi' ? result.organic_treatment : result.organic_treatment).map((step) => (
                    <div key={step.step} className="flex gap-3">
                      <div className="size-6 rounded-full bg-primary/10 text-primary font-bold text-[10px] flex items-center justify-center shrink-0 border border-primary/20">
                        {step.step}
                      </div>
                      <div className="text-xs text-foreground/90 leading-relaxed">{step.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Chemical */}
            {result.chemical_treatment.length > 0 && (
              <div className="space-y-3">
                <div className="text-sm font-bold text-[#c2413a] flex items-center gap-2 bg-[#c2413a]/5 px-3 py-1 rounded-full w-fit">
                  {t('chemicalTreatment')}
                </div>
                <div className="space-y-3 pl-2">
                  {(lang === 'hi' ? result.chemical_treatment : result.chemical_treatment).map((step) => (
                    <div key={step.step} className="flex gap-3">
                      <div className="size-6 rounded-full bg-[#c2413a]/10 text-[#c2413a] font-bold text-[10px] flex items-center justify-center shrink-0 border border-[#c2413a]/20">
                        {step.step}
                      </div>
                      <div className="text-xs text-foreground/90 leading-relaxed">{step.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <ol className="space-y-3">
            {result.treatment.map((t, i) => (
              <li key={i} className="flex gap-3">
                <span className="size-8 rounded-full bg-primary text-white font-bold text-sm flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <div>
                  <div className="font-bold text-sm text-foreground">{t.step}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{t.detail}</div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Cost & Risk */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 bg-muted/50 rounded-xl px-4 py-3 flex items-center justify-between border border-border">
          <span className="text-xs text-muted-foreground font-bold uppercase tracking-tighter">{t('estCost')}</span>
          <span className="font-display font-bold text-base text-foreground">{cost}</span>
        </div>
        {isApiResult && (
          <div className="flex-1 bg-muted/50 rounded-xl px-4 py-3 flex items-center justify-between border border-border">
            <span className="text-xs text-muted-foreground font-bold uppercase tracking-tighter">{t('spreadRiskLabel')}</span>
            <span className={cn(
              "font-bold text-sm px-2 py-0.5 rounded",
              result.spread_risk === 'high' ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"
            )}>
              {result.spread_risk.toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* CTAs */}
      <div className="flex gap-3 pt-2">
        <button className="flex-1 bg-[#2b3a36] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-sm shadow-md hover:bg-[#1a2522] transition-all">
          <CheckCircle2 className="size-4" /> {t('treated')}
        </button>
        <a
          href="tel:18001801551"
          className="flex-1 bg-[#e67e22] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-sm shadow-md hover:bg-[#d35400] transition-all"
        >
          <Phone className="size-4" /> {t('callExpert')}
        </a>
      </div>
    </div>
  );
}
