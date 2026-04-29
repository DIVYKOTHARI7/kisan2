import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sprout, Loader2, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [{ title: "Set up your farm — Krishi Samadhan" }],
  }),
  component: OnboardingPage,
});

const SOIL_TYPES = ["Loamy", "Black", "Clay", "Sandy", "Red", "Alluvial"];
const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिंदी" },
  { code: "mr", label: "मराठी" },
  { code: "pa", label: "ਪੰਜਾਬੀ" },
  { code: "te", label: "తెలుగు" },
];

function OnboardingPage() {
  const navigate = useNavigate();
  const { user, loading, profile, refreshProfile, updateProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);

  const [name, setName] = useState("");
  const [language, setLanguage] = useState("en");
  const [village, setVillage] = useState("");
  const [district, setDistrict] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [landAcres, setLandAcres] = useState("");
  const [soilType, setSoilType] = useState("Loamy");
  const [crops, setCrops] = useState("");

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
    if (profile) {
      setName(profile.name ?? "");
      setVillage(profile.village ?? "");
      setDistrict(profile.district ?? "");
      setState(profile.state ?? "");
      setPincode(profile.pincode ?? "");
      setLandAcres(profile.land_acres ? String(profile.land_acres) : "");
      setSoilType(profile.soil_type ?? "Loamy");
      setLanguage(profile.preferred_language ?? "en");
      setCrops((profile.primary_crops ?? []).join(", "));
    }
  }, [loading, user, profile, navigate]);

  async function save() {
    if (!user) return;
    setBusy(true);
    try {
      // Client-side validation
      const payload: any = {};
      payload.name = name || null;
      payload.preferred_language = language;
      payload.village = village || null;
      payload.district = district || null;
      payload.state = state || null;
      payload.pincode = pincode || null;

      // validate land acres
      let parsedLand: number | null = null;
      if (landAcres && landAcres !== "") {
        parsedLand = Number(landAcres);
        if (Number.isNaN(parsedLand) || parsedLand <= 0 || parsedLand > 10000) {
          throw new Error("Please enter a valid land size between 0.1 and 10000 acres");
        }
      }
      payload.land_acres = parsedLand;

      payload.soil_type = soilType;

      // validate crops
      const cropsArr = (crops || "")
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);
      if (cropsArr.length > 10) throw new Error("Please specify at most 10 primary crops");
      for (const c of cropsArr) {
        if (c.length > 40) throw new Error("Each crop name must be 40 characters or fewer");
        if (!/^[\p{L}\s''-]+$/u.test(c))
          throw new Error("Crop names may only contain letters, spaces and apostrophes");
      }
      payload.primary_crops = cropsArr;
      payload.onboarded = true;

      await updateProfile(payload);

      await refreshProfile();
      toast.success("Welcome to Krishi Samadhan 🌱");
      navigate({ to: "/" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save profile";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen banyan-pattern bg-background flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl">
        <div className="text-center mb-6">
          <div className="inline-flex size-12 rounded-2xl bg-primary text-primary-foreground items-center justify-center mb-3 shadow-banyan-sm">
            <Sprout className="size-6" />
          </div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold">Let's set up your farm</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Step {step} of 3 · We use this to personalize crop advice for you
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 md:p-8 shadow-banyan space-y-5">
          {step === 1 && (
            <>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Your name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full h-11 rounded-xl border border-input bg-background px-4 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Preferred language
                </label>
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => setLanguage(l.code)}
                      className={`h-11 rounded-xl border text-sm font-medium ${
                        language === l.code
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-input hover:bg-muted"
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    Village / town
                  </label>
                  <input
                    type="text"
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    placeholder="Khed"
                    className="mt-1 w-full h-11 rounded-xl border border-input bg-background px-4 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">District</label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="Pune"
                    className="mt-1 w-full h-11 rounded-xl border border-input bg-background px-4 text-sm"
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">State</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="Maharashtra"
                    className="mt-1 w-full h-11 rounded-xl border border-input bg-background px-4 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Pincode</label>
                  <input
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="410501"
                    maxLength={6}
                    className="mt-1 w-full h-11 rounded-xl border border-input bg-background px-4 text-sm"
                  />
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    Land size (acres)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="10000"
                    value={landAcres}
                    onChange={(e) => setLandAcres(e.target.value)}
                    placeholder="12.5"
                    className="mt-1 w-full h-11 rounded-xl border border-input bg-background px-4 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Soil type</label>
                  <select
                    value={soilType}
                    onChange={(e) => setSoilType(e.target.value)}
                    className="mt-1 w-full h-11 rounded-xl border border-input bg-background px-4 text-sm"
                  >
                    {SOIL_TYPES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Primary crops (comma separated)
                </label>
                <input
                  type="text"
                  value={crops}
                  onChange={(e) => setCrops(e.target.value)}
                  placeholder="Wheat, Sugarcane, Onion"
                  className="mt-1 w-full h-11 rounded-xl border border-input bg-background px-4 text-sm"
                />
              </div>
            </>
          )}

          <div className="flex gap-3 pt-2">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-5 h-11 rounded-xl border border-border text-sm font-medium hover:bg-muted"
              >
                Back
              </button>
            )}
            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 inline-flex items-center justify-center gap-2"
              >
                Continue <ArrowRight className="size-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={save}
                disabled={busy}
                className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {busy && <Loader2 className="size-4 animate-spin" />} Finish setup
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
