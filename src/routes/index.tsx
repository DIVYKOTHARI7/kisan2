import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { activeCrops, alerts, farmer } from "@/lib/mockData";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import { Plus, Trash2, Camera, ChevronDown, X } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronRight } from "lucide-react";
import {
  getDailyLimit,
  getFeatureAccess,
  resolvePlan,
  resolveRole,
  type FeatureKey,
} from "@/lib/rbac";
import { getFeatureUsage, getRemainingForPlan, isQuotaExceeded } from "@/lib/usage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "डैशबोर्ड — Krishi Samadhan" },
      {
        name: "description",
        content: "आपका दैनिक फार्म कमांड सेंटर — मौसम, फसल स्थिति, अलर्ट और AI सिफारिशें।",
      },
    ],
  }),
  component: Dashboard,
});

const quickActions = [
  {
    to: "/community",
    emoji: "🤝",
    tKey: "community",
    feature: "crop_recommendation" as FeatureKey,
    color: "border-orange-200 bg-orange-50",
  },
  {
    to: "/crop-recommend",
    emoji: "🌱",
    tKey: "cropRec",
    feature: "crop_recommendation" as FeatureKey,
    color: "border-green-200 bg-green-50",
  },
  {
    to: "/disease-check",
    emoji: "🔬",
    tKey: "disease",
    feature: "disease_detection" as FeatureKey,
    color: "border-orange-200 bg-orange-50",
  },
  {
    to: "/chat",
    emoji: "🤖",
    tKey: "chat",
    feature: "chatbot" as FeatureKey,
    color: "border-blue-200 bg-blue-50",
  },
  {
    to: "/schemes",
    emoji: "🏛️",
    tKey: "schemes",
    feature: "crop_recommendation" as FeatureKey,
    color: "border-teal-200 bg-teal-50",
  },
  {
    to: "/profile",
    emoji: "👤",
    tKey: "profile",
    feature: "crop_recommendation" as FeatureKey,
    color: "border-yellow-200 bg-yellow-50",
  },
] as const;

const cropEmojis: Record<string, string> = {
  Wheat: "🌾",
  Sugarcane: "🎋",
  Onion: "🧅",
  Rice: "🍚",
  Cotton: "🌱",
};

const cropColors: Record<string, string> = {
  Wheat: "bg-amber-50 border-amber-300",
  Sugarcane: "bg-green-50 border-green-300",
  Onion: "bg-purple-50 border-purple-300",
};

type FarmTask = {
  id: string;
  task: string;
  crop: string;
  date: string;
  emoji: string;
  color: string;
};
const INITIAL_TASKS: FarmTask[] = [
  {
    id: "1",
    task: "कीटनाशक छिड़काव",
    crop: "प्याज",
    date: "आज",
    emoji: "🧅",
    color: "text-purple-600",
  },
  { id: "2", task: "यूरिया खाद", crop: "गेहूं", date: "कल", emoji: "🌾", color: "text-amber-600" },
  {
    id: "3",
    task: "सिंचाई (Field C)",
    crop: "गन्ना",
    date: "कल",
    emoji: "🎋",
    color: "text-green-600",
  },
];

type MyCropData = {
  id: string;
  name: string;
  englishName: string;
  image: string;
  status: string;
  subtitle: string;
  cost: number;
  income: number;
  progress: number;
  nextHarvest: string;
};

const DEFAULT_CROPS: MyCropData[] = [
  {
    id: "1",
    name: "मशरूम",
    englishName: "Oyster",
    image: "https://images.unsplash.com/photo-1518568814500-bf0f8d125f46?w=500&q=80",
    status: "सक्रिय",
    subtitle: "बैच - 3 • ग्रोइंग स्टेज",
    cost: 12500,
    income: 35000,
    progress: 75,
    nextHarvest: "2 दिन बाद",
  },
  {
    id: "2",
    name: "टमाटर",
    englishName: "Hybrid",
    image: "https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=500&q=80",
    status: "सक्रिय",
    subtitle: "खेती का क्षेत्र - 1 एकड़",
    cost: 15800,
    income: 42000,
    progress: 60,
    nextHarvest: "12 दिन बाद",
  },
  {
    id: "3",
    name: "खीरा",
    englishName: "Cucumber",
    image: "https://images.unsplash.com/photo-1604977042946-1eecc30f269e?w=500&q=80",
    status: "सक्रिय",
    subtitle: "खेती का क्षेत्र - 0.5 एकड़",
    cost: 7300,
    income: 18500,
    progress: 40,
    nextHarvest: "7 दिन बाद",
  },
];

function Dashboard() {
  const { profile, user, updateProfile } = useAuth();
  const role = resolveRole(profile, user);
  const plan = resolvePlan(profile, role);
  const firstName = profile?.name ? profile.name.split(" ")[0] : "किसान";
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [greeting, setGreeting] = useState(t("welcome"));
  const [avatarUrl] = useState<string | null>(() => {
    try {
      if (typeof window === "undefined") return null;
      return localStorage.getItem("krishisathi_profile_avatar");
    } catch {
      return null;
    }
  });
  const [city, setCity] = useState<string>(() => {
    try {
      if (typeof window === "undefined") return farmer.village.split(",")[0].trim();
      return localStorage.getItem("krishisathi_city") || farmer.village.split(",")[0].trim();
    } catch {
      return farmer.village.split(",")[0].trim();
    }
  });
  const [editingCity, setEditingCity] = useState(false);
  const [editingCityValue, setEditingCityValue] = useState<string>(city);

  const [liveWeather, setLiveWeather] = useState<any>({
    current: {
      tempC: "--",
      condition: "लोड हो रहा है...",
      humidity: 0,
      wind: "",
      rainProbability: 0,
    },
    forecast: Array.from({ length: 7 }).map(() => ({
      day: "",
      high: 0,
      low: 0,
      icon: "",
      rain: 0,
    })),
    smartAlert: "",
  });
  const [loadingWeather, setLoadingWeather] = useState(true);

  const [finance, setFinance] = useState({ income: 73000, expense: 13700 });

  const [tasks, setTasks] = useState<FarmTask[]>(() => {
    try {
      if (typeof window === "undefined") return INITIAL_TASKS;
      const saved = localStorage.getItem("krishisathi_tasks");
      return saved ? JSON.parse(saved) : INITIAL_TASKS;
    } catch {
      return INITIAL_TASKS;
    }
  });
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({ task: "", crop: "Wheat", date: "आज" });

  useEffect(() => {
    localStorage.setItem("krishisathi_tasks", JSON.stringify(tasks));
  }, [tasks]);

  const handleAddTask = () => {
    if (!newTask.task) return;
    const t: FarmTask = {
      id: crypto.randomUUID(),
      task: newTask.task,
      crop: newTask.crop,
      date: newTask.date,
      emoji: cropEmojis[newTask.crop] || "🌿",
      color: "text-primary",
    };
    setTasks([t, ...tasks]);
    setIsTaskDialogOpen(false);
    setNewTask({ task: "", crop: "Wheat", date: "आज" });
  };

  const handleDeleteTask = (id: string) => {
    setTasks(tasks.filter((t) => t.id !== id));
  };

  const [myCrops, setMyCrops] = useState<MyCropData[]>(() => {
    try {
      if (typeof window === "undefined") return DEFAULT_CROPS;
      const saved = localStorage.getItem("krishisathi_mycrops");
      return saved ? JSON.parse(saved) : DEFAULT_CROPS;
    } catch {
      return DEFAULT_CROPS;
    }
  });
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);
  const [showAllCrops, setShowAllCrops] = useState(false);
  const [newCrop, setNewCrop] = useState<Partial<MyCropData>>({
    name: "",
    englishName: "",
    subtitle: "",
    cost: 0,
    income: 0,
    progress: 0,
    nextHarvest: "",
    image: "",
  });

  // Sync profile.primary_crops to myCrops
  useEffect(() => {
    if (profile?.primary_crops && profile.primary_crops.length > 0) {
      const savedSync = localStorage.getItem("krishisathi_crops_synced");
      const currentCropsStr = JSON.stringify(profile.primary_crops);

      if (savedSync !== currentCropsStr) {
        setMyCrops((prevCrops) => {
          // Identify crops not currently in myCrops
          const newCrops = profile.primary_crops
            .filter(
              (pc: string) =>
                !prevCrops.some(
                  (c) =>
                    c.name.toLowerCase() === pc.toLowerCase() ||
                    c.englishName.toLowerCase() === pc.toLowerCase(),
                ),
            )
            .map((name: string, i: number) => ({
              id: `p-${Date.now()}-${i}`,
              name,
              englishName: name,
              image: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=500&q=80",
              status: "सक्रिय",
              subtitle: `खेती का क्षेत्र - ${profile.land_acres ? (profile.land_acres / profile.primary_crops.length).toFixed(1) : 1} एकड़`,
              cost: 15000,
              income: 40000,
              progress: 50,
              nextHarvest: "अज्ञात",
            }));

          const isDefault = JSON.stringify(prevCrops) === JSON.stringify(DEFAULT_CROPS);
          return isDefault ? newCrops : [...newCrops, ...prevCrops];
        });
        localStorage.setItem("krishisathi_crops_synced", currentCropsStr);
      }
    }
  }, [profile?.primary_crops, profile?.land_acres]);

  // Fix broken mushroom image in localStorage if it exists
  useEffect(() => {
    setMyCrops((prev) => {
      const fixed = prev.map((c) =>
        c.image === "https://images.unsplash.com/photo-1543888362-e610d061ea15?w=500&q=80" ||
        c.image === "https://images.unsplash.com/photo-1611075389657-3f309a96eec5?w=500&q=80"
          ? {
              ...c,
              image: "https://images.unsplash.com/photo-1518568814500-bf0f8d125f46?w=500&q=80",
            }
          : c,
      );
      return JSON.stringify(fixed) !== JSON.stringify(prev) ? fixed : prev;
    });
  }, []);

  useEffect(() => {
    localStorage.setItem("krishisathi_mycrops", JSON.stringify(myCrops));
  }, [myCrops]);

  const handleAddCrop = () => {
    if (!newCrop.name) return;
    const c: MyCropData = {
      id: crypto.randomUUID(),
      name: newCrop.name,
      englishName: newCrop.englishName || "General",
      image:
        newCrop.image || "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=500&q=80",
      status: "सक्रिय",
      subtitle: newCrop.subtitle || "खेती का क्षेत्र - 1 एकड़",
      cost: Number(newCrop.cost) || 0,
      income: Number(newCrop.income) || 0,
      progress: Number(newCrop.progress) || 0,
      nextHarvest: newCrop.nextHarvest || "अज्ञात",
    };
    setMyCrops([c, ...myCrops]);
    setIsCropDialogOpen(false);
    setNewCrop({
      name: "",
      englishName: "",
      subtitle: "",
      cost: 0,
      income: 0,
      progress: 0,
      nextHarvest: "",
      image: "",
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Compress image using canvas to save localStorage space
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 500;
        const MAX_HEIGHT = 500;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        // Save as compressed JPEG
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        setNewCrop({ ...newCrop, image: dataUrl });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteCrop = (id: string) => {
    if (confirm("क्या आप वाकई इस फसल को हटाना चाहते हैं?")) {
      setMyCrops(myCrops.filter((c) => c.id !== id));
    }
  };

  // Load finance data from Profit Tracker
  useEffect(() => {
    try {
      const saved = localStorage.getItem("krishisathi_ledger");
      if (saved) {
        const ledger = JSON.parse(saved);
        const income = ledger
          .filter((l: any) => l.type === "income")
          .reduce((s: number, l: any) => s + l.amount, 0);
        const expense = ledger
          .filter((l: any) => l.type === "expense")
          .reduce((s: number, l: any) => s + l.amount, 0);
        setFinance({ income, expense });
      } else {
        const initialLedger = [
          { type: "income", amount: 45000 },
          { type: "expense", amount: 3200 },
          { type: "expense", amount: 1800 },
          { type: "income", amount: 28000 },
          { type: "expense", amount: 2500 },
          { type: "expense", amount: 6000 },
        ];
        const income = initialLedger
          .filter((l: any) => l.type === "income")
          .reduce((s: number, l: any) => s + l.amount, 0);
        const expense = initialLedger
          .filter((l: any) => l.type === "expense")
          .reduce((s: number, l: any) => s + l.amount, 0);
        setFinance({ income, expense });
      }
    } catch (e) {
      console.error("Failed to load finance data", e);
    }
  }, []);

  // Personalize active crops and alerts from profile when available
  const displayedActiveCrops =
    profile && profile.primary_crops && profile.primary_crops.length
      ? profile.primary_crops.map((name: string, i: number) => {
          const total = profile.land_acres || farmer.landAcres || 1;
          const perCrop = Math.max(
            0.1,
            Math.round((total / profile.primary_crops.length) * 10) / 10,
          );
          return {
            id: `p-${i}`,
            name,
            field: "मुख्य खेत",
            acres: perCrop,
            stage: "विकास",
            daysSinceSowing: 12,
            totalDays: 90,
            progress: Math.min(100, Math.round((12 / 90) * 100)),
            nextTask: "स्थिति जाँचें",
            nextTaskDate: "कल",
          };
        })
      : activeCrops;

  const computedAlerts =
    profile && profile.primary_crops && profile.primary_crops.length
      ? alerts.filter((a: any) =>
          profile.primary_crops.some((pc: string) =>
            a.message.toLowerCase().includes(pc.toLowerCase()),
          ),
        ).length
        ? alerts.filter((a: any) =>
            profile.primary_crops.some((pc: string) =>
              a.message.toLowerCase().includes(pc.toLowerCase()),
            ),
          )
        : alerts
      : alerts;

  const [activeAlertsState, setActiveAlertsState] = useState<any[]>(() => {
    try {
      if (typeof window === "undefined") return null;
      const saved = localStorage.getItem("krishisathi_alerts");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const displayedAlerts = activeAlertsState || computedAlerts;

  useEffect(() => {
    if (activeAlertsState) {
      localStorage.setItem("krishisathi_alerts", JSON.stringify(activeAlertsState));
    }
  }, [activeAlertsState]);

  const handleDismissAlert = (id: string) => {
    const updated = displayedAlerts.filter((a: any) => a.id !== id);
    setActiveAlertsState(updated);
  };

  const handleAlertCta = (cta: string) => {
    if (cta.toLowerCase().includes("advisory") || cta.toLowerCase().includes("सलाह"))
      navigate({ to: "/disease-check" });
    else if (cta.toLowerCase().includes("eligibility") || cta.toLowerCase().includes("योजना"))
      navigate({ to: "/schemes" });
    else navigate({ to: "/" });
  };

  const [isSmsSubscribed, setIsSmsSubscribed] = useState(() => {
    try {
      if (typeof window === "undefined") return false;
      return localStorage.getItem("krishisathi_sms_optin") === "true";
    } catch {
      return false;
    }
  });

  const handleSmsOptIn = () => {
    setIsSmsSubscribed(true);
    localStorage.setItem("krishisathi_sms_optin", "true");
    toast.success("WhatsApp / SMS अलर्ट सफलतापूर्वक चालू हो गए हैं!");
  };

  // Sync profile village -> city when profile loads (do not override while user is editing)
  useEffect(() => {
    if (!editingCity && profile && profile.village) {
      const v = String(profile.village);
      if (v && v !== city) {
        setCity(v);
        setEditingCityValue(v);
        try {
          localStorage.setItem("krishisathi_city", v);
        } catch {}
      }
    }
  }, [profile]);

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "सुप्रभात" : h < 17 ? "नमस्ते" : "शुभ संध्या");

    // Fetch real weather data using Open-Meteo (runs on mount and whenever `city` changes)
    const fetchWeather = async () => {
      setLoadingWeather(true);
      try {
        // 1. Geocode the city name
        const geoRes = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
            city,
          )}&count=1&language=en&format=json`,
        );
        if (!geoRes.ok) throw new Error("Geocoding API error");
        const geoData = await geoRes.json();

        let latitude = 28.14; // fallback to Palwal
        let longitude = 77.32;
        if (geoData.results && geoData.results.length > 0) {
          latitude = geoData.results[0].latitude;
          longitude = geoData.results[0].longitude;
        }

        // 2. Fetch forecast
        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`,
        );
        if (!weatherRes.ok) throw new Error("Weather API error");
        const w = await weatherRes.json();

        const getWeatherDetails = (code: number) => {
          if (code === 0 || code === 1) return { icon: "☀️", text: "साफ" };
          if (code === 2 || code === 3) return { icon: "⛅", text: "बादल" };
          if (code >= 45 && code <= 48) return { icon: "🌫️", text: "धुंध" };
          if (code >= 51 && code <= 67) return { icon: "🌧️", text: "बारिश" };
          if (code >= 71 && code <= 77) return { icon: "❄️", text: "बर्फबारी" };
          if (code >= 80 && code <= 82) return { icon: "🌦️", text: "रिमझिम" };
          if (code >= 95 && code <= 99) return { icon: "⛈️", text: "आंधी-तूफान" };
          return { icon: "⛅", text: "सामान्य" };
        };

        const getWindDir = (deg: number) => {
          const dirs = [
            "N",
            "NNE",
            "NE",
            "ENE",
            "E",
            "ESE",
            "SE",
            "SSE",
            "S",
            "SSW",
            "SW",
            "WSW",
            "W",
            "WNW",
            "NW",
            "NNW",
          ];
          return dirs[Math.round((deg % 360) / 22.5) % 16];
        };

        const currentDetails = getWeatherDetails(w.current.weather_code);
        const rainProb = w.daily.precipitation_probability_max?.[0] || 0;

        const mappedWeather = {
          current: {
            tempC: Math.round(w.current.temperature_2m),
            condition: currentDetails.text,
            humidity: Math.round(w.current.relative_humidity_2m),
            wind: `${Math.round(w.current.wind_speed_10m)} km/h ${getWindDir(w.current.wind_direction_10m)}`,
            rainProbability: rainProb,
          },
          forecast: w.daily.time.slice(0, 7).map((dateStr: string, idx: number) => {
            const details = getWeatherDetails(w.daily.weather_code[idx]);
            return {
              day: new Date(dateStr)
                .toLocaleDateString("en-US", { weekday: "short" })
                .toUpperCase(),
              high: Math.round(w.daily.temperature_2m_max[idx]),
              low: Math.round(w.daily.temperature_2m_min[idx]),
              icon: details.icon,
              rain: w.daily.precipitation_probability_max?.[idx] || 0,
            };
          }),
          smartAlert:
            rainProb > 50
              ? "बारिश की संभावना है — आज उर्वरक न डालें (Rain expected — avoid fertilizer today)"
              : "मौसम साफ है — सिंचाई के लिए अच्छा समय है (Clear weather — good time for irrigation)",
        };
        setLiveWeather(mappedWeather);
      } catch (err) {
        console.error("Failed to fetch live weather:", err);
      } finally {
        setLoadingWeather(false);
      }
    };
    fetchWeather();
  }, [city]);

  // Auto-detect location on first load if not explicitly set
  useEffect(() => {
    if (!localStorage.getItem("krishisathi_city") && navigator.geolocation) {
      useMyLocation();
    }
  }, []);

  const saveCity = () => {
    const newCity = (editingCityValue || city).trim();
    if (newCity) {
      setCity(newCity);
      try {
        localStorage.setItem("krishisathi_city", newCity);
      } catch {}
    }
    setEditingCity(false);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      console.warn("Geolocation not supported");
      return;
    }
    setLoadingWeather(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        // Try reverse geocode for a friendly name
        let resolved: string | null = null;
        try {
          const r = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
          );
          if (r.ok) {
            const j = await r.json();
            const addr = j.address || {};
            resolved = addr.city || addr.town || addr.village || addr.county || j.display_name;
          }
        } catch (e) {
          console.warn("Reverse geocode failed", e);
        }
        const label =
          (resolved && String(resolved)) || `${latitude.toFixed(3)},${longitude.toFixed(3)}`;
        setCity(label);
        try {
          localStorage.setItem("krishisathi_city", label);
        } catch {}

        // If logged in, save to profile.village
        try {
          if (profile) {
            await updateProfile({ village: label });
          }
        } catch (e) {
          console.warn("Saving profile location failed", e);
        }

        setLoadingWeather(false);
      },
      (err) => {
        console.warn("Geolocation error", err);
        setLoadingWeather(false);
      },
      { enableHighAccuracy: false, timeout: 10000 },
    );
  };

  const rainHigh = liveWeather.current.rainProbability > 60;

  return (
    <AppShell>
      <div className="max-w-[1600px] w-full mx-auto space-y-6">
        {/* === GREETING HEADER === */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
              {greeting}, {firstName} 👋
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">{t("dashboardSubtitle")}</p>
          </div>

          <div className="hidden lg:flex items-center gap-3 shrink-0">
            <button className="flex items-center gap-2 px-3 py-2 bg-white border border-border rounded-xl text-sm font-bold shadow-sm hover:bg-muted/50 transition-colors">
              हिंदी <ChevronDown className="size-4 text-muted-foreground" />
            </button>
            <Link
              to="/notifications"
              className="relative size-10 rounded-full bg-white border border-border flex items-center justify-center hover:bg-muted/50 transition-colors shadow-sm text-xl"
            >
              🔔
              <span className="absolute -top-1 -right-1 size-4 bg-destructive rounded-full border border-background text-[9px] text-white flex items-center justify-center font-bold">
                3
              </span>
            </Link>
            <Link
              to="/profile"
              className="size-10 rounded-full bg-primary text-white flex items-center justify-center font-bold shadow-sm hover:opacity-90 transition-opacity overflow-hidden border border-border"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${firstName}`}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              )}
            </Link>
          </div>
        </div>

        {/* === SMART ALERT (if needed) === */}
        <div className="alert-warning rounded-xl p-4 flex gap-3 items-start">
          <div className="text-2xl shrink-0 mt-0.5">⚠️</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-display font-bold text-base text-foreground">
                {t("smartAlertTitle")}
              </span>
              <span className="badge-action text-xs">⚡ {t("actionRequired")}</span>
            </div>
            <p className="text-sm text-foreground/90">
              {loadingWeather ? "मौसम की जानकारी लोड हो रही है..." : liveWeather.smartAlert}
            </p>
          </div>
        </div>

        {/* === WEATHER CARD === */}
        <div className="card-farm overflow-hidden">
          <div className="bg-primary px-5 pt-5 pb-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-7xl font-display font-bold text-white leading-none">
                  {liveWeather.current.tempC}°
                </div>
                <div className="text-white/90 text-lg font-semibold mt-1">
                  {liveWeather.current.condition}
                </div>
                <div className="text-white/70 text-sm mt-1">📍 {city}</div>
              </div>
              <div className="text-6xl">
                {liveWeather.current.condition.toLowerCase().includes("sun")
                  ? "☀️"
                  : liveWeather.current.condition.toLowerCase().includes("cloud")
                    ? "⛅"
                    : "🌧️"}
              </div>
            </div>

            <div className="flex gap-5 mt-4 pt-4 border-t border-white/20">
              <div className="text-center">
                <div className="text-white/80 text-xs uppercase tracking-wider">
                  {t("humidity")}
                </div>
                <div className="text-white font-bold text-lg">{liveWeather.current.humidity}%</div>
              </div>
              <div className="text-center">
                <div className="text-white/80 text-xs uppercase tracking-wider">{t("wind")}</div>
                <div className="text-white font-bold text-lg">{liveWeather.current.wind}</div>
              </div>
              <div className="text-center">
                <div
                  className={cn(
                    "text-xs uppercase tracking-wider",
                    rainHigh ? "rain-warning" : "text-white/80",
                  )}
                >
                  {rainHigh ? `⚠️ ${t("rain")}` : t("rain")}
                </div>
                <div className={cn("font-bold text-lg", rainHigh ? "rain-warning" : "text-white")}>
                  {liveWeather.current.rainProbability}%
                </div>
              </div>
            </div>
          </div>

          {/* 7-day forecast */}
          <div className="px-4 py-4 bg-white">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
              {t("forecast7Days")}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {liveWeather.forecast.map((d: any) => (
                <div
                  key={d.day}
                  className="flex flex-col items-center gap-1.5 min-w-[52px] bg-muted/50 rounded-xl py-3 px-2 shrink-0"
                >
                  <span className="text-[11px] font-bold text-muted-foreground uppercase">
                    {d.day}
                  </span>
                  <span className="text-2xl">{d.icon}</span>
                  <span className="text-xs font-bold text-foreground">{d.high}°</span>
                  <span className="text-[10px] text-muted-foreground">{d.low}°</span>
                  <span
                    className={cn(
                      "text-[10px] font-bold",
                      d.rain > 60 ? "rain-warning" : "text-info",
                    )}
                  >
                    {d.rain}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* === LIVE MARKET TICKER === */}
        <div className="bg-primary/10 border border-primary/20 rounded-xl py-3 px-4 overflow-hidden relative">
          <div className="flex gap-8 animate-scroll whitespace-nowrap">
            {[
              "🚀 गेहूं के भाव में ₹50 की तेजी",
              "🌦️ परसों बारिश की 80% संभावना",
              "🏛️ PM-KISAN की नई लिस्ट जारी",
              "💊 नई जैविक कीटनाशक तकनीक उपलब्ध",
              "📉 सोयाबीन के भाव में मामूली गिरावट",
            ].map((news, i) => (
              <span key={i} className="text-sm font-bold text-primary flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-primary" /> {news}
              </span>
            ))}
            {/* Duplicate for seamless loop */}
            {[
              "🚀 गेहूं के भाव में ₹50 की तेजी",
              "🌦️ परसों बारिश की 80% संभावना",
              "🏛️ PM-KISAN की नई लिस्ट जारी",
              "💊 नई जैविक कीटनाशक तकनीक उपलब्ध",
              "📉 सोयाबीन के भाव में मामूली गिरावट",
            ].map((news, i) => (
              <span key={i + 10} className="text-sm font-bold text-primary flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-primary" /> {news}
              </span>
            ))}
          </div>
        </div>

        {/* === FINANCE & TASKS GRID === */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Finance Widget */}
          <div className="card-farm p-5 bg-gradient-to-br from-white to-primary/5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-base text-foreground flex items-center gap-2">
                💰 {t("financeSummary")}
              </h3>
              <Link to="/profit-tracker" className="text-xs font-bold text-primary hover:underline">
                {t("seeAll")} →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-success/10 rounded-xl p-3 border border-success/20">
                <div className="text-[10px] font-bold text-success uppercase">{t("income")}</div>
                <div className="text-xl font-display font-bold text-success">
                  ₹{finance.income.toLocaleString("en-IN")}
                </div>
              </div>
              <div className="bg-destructive/10 rounded-xl p-3 border border-destructive/20">
                <div className="text-[10px] font-bold text-destructive uppercase">
                  {t("expense")}
                </div>
                <div className="text-xl font-display font-bold text-destructive">
                  ₹{finance.expense.toLocaleString("en-IN")}
                </div>
              </div>
            </div>
            <div className="mt-3 p-3 bg-white rounded-xl border border-border flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase">
                  {t("netProfit")}
                </div>
                <div
                  className={cn(
                    "text-lg font-display font-bold",
                    finance.income - finance.expense >= 0 ? "text-primary" : "text-destructive",
                  )}
                >
                  ₹{(finance.income - finance.expense).toLocaleString("en-IN")}
                </div>
              </div>
              <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                📈
              </div>
            </div>
          </div>

          {/* Upcoming Tasks Widget */}
          <div className="card-farm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-base text-foreground flex items-center gap-2">
                📅 {t("upcomingTasks")}
              </h3>

              <div className="flex items-center gap-2">
                <span className="badge-action text-[10px]">{tasks.length} कार्य</span>
                <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
                  <DialogTrigger asChild>
                    <button className="size-6 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors">
                      <Plus className="size-4" />
                    </button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>{t("addNewTask")}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="task" className="text-right">
                          {t("task")}
                        </Label>
                        <Input
                          id="task"
                          placeholder="उदा. कीटनाशक छिड़काव"
                          className="col-span-3"
                          value={newTask.task}
                          onChange={(e) => setNewTask({ ...newTask, task: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="task_crop" className="text-right">
                          {t("crop")}
                        </Label>
                        <Select
                          value={newTask.crop}
                          onValueChange={(v) => setNewTask({ ...newTask, crop: v })}
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="फसल चुनें" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Wheat">गेहूं (Wheat)</SelectItem>
                            <SelectItem value="Sugarcane">गन्ना (Sugarcane)</SelectItem>
                            <SelectItem value="Onion">प्याज (Onion)</SelectItem>
                            <SelectItem value="Rice">धान (Rice)</SelectItem>
                            <SelectItem value="Cotton">कपास (Cotton)</SelectItem>
                            <SelectItem value="Other">अन्य (Other)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="task_date" className="text-right">
                          {t("date")}
                        </Label>
                        <Input
                          id="task_date"
                          placeholder="उदा. आज, कल, 2 दिन बाद"
                          className="col-span-3"
                          value={newTask.date}
                          onChange={(e) => setNewTask({ ...newTask, date: e.target.value })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsTaskDialogOpen(false)}>
                        रद्द करें
                      </Button>
                      <Button className="btn-saffron" onClick={handleAddTask}>
                        जोड़ें
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            <div className="space-y-3">
              {tasks.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground p-4 bg-muted/20 rounded-xl">
                  {t("noTasks")}
                </div>
              ) : (
                tasks.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <span className="text-xl">{t.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-foreground">{t.task}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {t.crop === "Wheat"
                          ? "गेहूं"
                          : t.crop === "Onion"
                            ? "प्याज"
                            : t.crop === "Sugarcane"
                              ? "गन्ना"
                              : t.crop}
                      </div>
                    </div>
                    <div className="text-[10px] font-bold px-2 py-1 bg-muted rounded-md shrink-0">
                      {t.date}
                    </div>
                    <button
                      onClick={() => handleDeleteTask(t.id)}
                      className="opacity-0 group-hover:opacity-100 size-6 flex items-center justify-center text-muted-foreground hover:text-destructive shrink-0 transition-opacity"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* === QUICK ACTIONS === */}
        <div>
          <h2 className="font-display font-bold text-lg text-foreground mb-3">
            ⚡ {t("quickLinks")}
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {quickActions.map((a) => {
              const hasAccess = getFeatureAccess(role, plan, a.feature);
              const exhausted = isQuotaExceeded(a.feature, plan);
              return (
                <Link
                  key={a.to}
                  to={!hasAccess || exhausted ? "/upgrade" : a.to}
                  className={cn(
                    "quick-action-btn border-2",
                    a.color,
                    (!hasAccess || exhausted) && "opacity-60",
                  )}
                >
                  <span className="text-3xl">{a.emoji}</span>
                  <span className="text-[11px] font-bold text-foreground leading-tight text-center">
                    {t(a.tKey as any)}
                  </span>
                  {!hasAccess && <span className="text-[9px] font-bold text-accent">Premium</span>}
                </Link>
              );
            })}
          </div>
        </div>

        {/* === MY FARM (Premium Design) === */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
              🌿 {t("myCropsTitle")}
            </h2>

            <Dialog open={isCropDialogOpen} onOpenChange={setIsCropDialogOpen}>
              <DialogTrigger asChild>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-white text-sm font-bold text-foreground hover:bg-muted/50 transition-colors shadow-sm">
                  <Plus className="size-4" /> {t("addNewCrop")}
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>नई फसल जोड़ें</DialogTitle>
                </DialogHeader>
                <div className="grid gap-3 py-4 max-h-[60vh] overflow-y-auto pr-2">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">नाम</Label>
                    <Input
                      placeholder="उदा. मशरूम"
                      className="col-span-3"
                      value={newCrop.name}
                      onChange={(e) => setNewCrop({ ...newCrop, name: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">किस्म (English)</Label>
                    <Input
                      placeholder="उदा. Oyster"
                      className="col-span-3"
                      value={newCrop.englishName}
                      onChange={(e) => setNewCrop({ ...newCrop, englishName: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">विवरण</Label>
                    <Input
                      placeholder="उदा. खेती का क्षेत्र - 1 एकड़"
                      className="col-span-3"
                      value={newCrop.subtitle}
                      onChange={(e) => setNewCrop({ ...newCrop, subtitle: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">लागत (₹)</Label>
                    <Input
                      type="number"
                      placeholder="12500"
                      className="col-span-3"
                      value={newCrop.cost}
                      onChange={(e) => setNewCrop({ ...newCrop, cost: Number(e.target.value) })}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">आय (₹)</Label>
                    <Input
                      type="number"
                      placeholder="35000"
                      className="col-span-3"
                      value={newCrop.income}
                      onChange={(e) => setNewCrop({ ...newCrop, income: Number(e.target.value) })}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">कटाई</Label>
                    <Input
                      placeholder="उदा. 2 दिन बाद"
                      className="col-span-3"
                      value={newCrop.nextHarvest}
                      onChange={(e) => setNewCrop({ ...newCrop, nextHarvest: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label className="text-right mt-3">फोटो</Label>
                    <div className="col-span-3 space-y-3">
                      <label className="flex w-full items-center justify-center gap-2 px-3 py-2.5 border border-dashed border-primary bg-primary/5 text-primary rounded-xl cursor-pointer hover:bg-primary/10 transition-colors text-sm font-bold">
                        <Camera className="size-5" /> कैमरा / गैलरी से चुनें
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                        />
                      </label>

                      <div className="flex items-center gap-2">
                        <div className="h-px bg-border flex-1" />
                        <span className="text-[10px] text-muted-foreground font-bold">
                          या इंटरनेट लिंक (URL) डालें
                        </span>
                        <div className="h-px bg-border flex-1" />
                      </div>
                      <Input
                        placeholder="फोटो का लिंक (वैकल्पिक)"
                        value={newCrop.image}
                        onChange={(e) => setNewCrop({ ...newCrop, image: e.target.value })}
                      />

                      {newCrop.image && newCrop.image.length > 0 && (
                        <div className="mt-2 rounded-xl overflow-hidden border border-border shadow-sm">
                          <img
                            src={newCrop.image}
                            alt="Preview"
                            className="w-full h-32 object-cover"
                            onError={(e) => (e.currentTarget.style.display = "none")}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCropDialogOpen(false)}>
                    {t("cancel")}
                  </Button>
                  <Button className="btn-saffron" onClick={handleAddCrop}>
                    {t("add")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {myCrops.length === 0 ? (
              <div className="card-farm p-8 text-center text-muted-foreground">{t("noCrops")}</div>
            ) : (
              (showAllCrops ? myCrops : myCrops.slice(0, 2)).map((c) => {
                const profit = c.income - c.cost;
                const profitPercent = c.cost > 0 ? Math.round((profit / c.cost) * 100) : 0;

                // Auto calculate growth progress based on profit/loss
                // Maps 0% profit to 0% progress, and 200% profit to 100% progress
                const dynamicProgress = Math.max(0, Math.min(100, Math.round(profitPercent / 2)));

                return (
                  <div
                    key={c.id}
                    className="bg-white rounded-2xl border border-border shadow-sm flex flex-col sm:flex-row overflow-hidden hover:border-primary/30 transition-colors group"
                  >
                    <div className="p-3 shrink-0 flex justify-center sm:block border-b sm:border-b-0 border-border/50">
                      <img
                        src={c.image}
                        alt={c.name}
                        onError={(e) => {
                          e.currentTarget.src =
                            "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=500&q=80";
                        }}
                        className="w-full sm:w-28 h-40 sm:h-28 object-cover rounded-xl bg-muted"
                      />
                    </div>

                    <div className="flex-1 p-4 sm:py-4 sm:pr-0 sm:pl-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-base text-foreground flex items-center gap-1.5">
                              {c.name}{" "}
                              <span className="font-normal text-muted-foreground text-sm">
                                ({c.englishName})
                              </span>
                            </h3>
                            <span className="px-2 py-0.5 rounded-full bg-success/15 text-success text-[10px] font-bold">
                              {c.status}
                            </span>
                          </div>
                          <button
                            onClick={() => handleDeleteCrop(c.id)}
                            className="size-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0 mr-2"
                            title="फसल हटाएं"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                        <div className="text-xs text-muted-foreground mb-4">{c.subtitle}</div>
                      </div>

                      <div className="flex flex-wrap sm:flex-nowrap gap-2 sm:gap-4">
                        <div className="bg-muted/30 rounded-lg p-2.5 flex-1 min-w-[80px]">
                          <div className="text-[10px] text-muted-foreground mb-1">{t("cost")}</div>
                          <div className="font-bold text-sm text-foreground">
                            ₹ {c.cost.toLocaleString("en-IN")}
                          </div>
                        </div>
                        <div className="bg-success/5 rounded-lg p-2.5 flex-1 min-w-[90px]">
                          <div className="text-[10px] text-muted-foreground mb-1">
                            {t("estIncome")}
                          </div>
                          <div className="font-bold text-sm text-foreground">
                            ₹ {c.income.toLocaleString("en-IN")}
                          </div>
                        </div>
                        <div className="bg-primary/5 rounded-lg p-2.5 flex-1 min-w-[120px]">
                          <div className="text-[10px] text-primary/70 mb-1">{t("estProfit")}</div>
                          <div
                            className={cn(
                              "font-bold text-sm",
                              profit >= 0 ? "text-primary" : "text-destructive",
                            )}
                          >
                            ₹ {profit.toLocaleString("en-IN")}{" "}
                            <span
                              className={cn(
                                "text-[10px] font-normal",
                                profit >= 0 ? "text-primary/70" : "text-destructive/70",
                              )}
                            >
                              ({profitPercent}%)
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="sm:w-48 p-4 border-t sm:border-t-0 sm:border-l border-border/50 flex flex-col justify-center relative">
                      <div className="text-[11px] text-muted-foreground mb-1">
                        {t("growthProgress")}
                      </div>
                      <div className="font-display font-bold text-xl text-foreground mb-2">
                        {dynamicProgress}%
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden mb-4">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            profit >= 0 ? "bg-primary" : "bg-destructive",
                          )}
                          style={{ width: `${dynamicProgress}%` }}
                        />
                      </div>

                      <div className="text-[11px] text-muted-foreground mb-0.5">
                        {t("nextHarvest")}
                      </div>
                      <div className="text-sm font-bold text-foreground">{c.nextHarvest}</div>

                      <button className="absolute right-4 top-1/2 -translate-y-1/2 size-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors opacity-0 group-hover:opacity-100 hidden sm:flex">
                        <ChevronRight className="size-5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}

            {myCrops.length > 2 && (
              <div className="text-center pt-2">
                <button
                  onClick={() => setShowAllCrops(!showAllCrops)}
                  className="text-sm font-bold text-primary hover:underline"
                >
                  {showAllCrops ? t("showLess") : t("seeAllCrops")}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* === ALERTS === */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-lg text-foreground">🔔 {t("alerts")}</h2>
            <span className="text-sm text-accent font-bold">{displayedAlerts.length} नए</span>
          </div>
          <div className="space-y-3">
            {displayedAlerts.length === 0 ? (
              <div className="card-farm p-6 text-center text-muted-foreground">{t("noAlerts")}</div>
            ) : (
              displayedAlerts.map((a: any) => (
                <div
                  key={a.id}
                  className={cn(
                    "card-farm border-l-4 p-4 relative group",
                    a.severity === "warning"
                      ? "border-l-accent"
                      : a.severity === "success"
                        ? "border-l-success"
                        : "border-l-info",
                  )}
                >
                  <button
                    onClick={() => handleDismissAlert(a.id)}
                    className="absolute top-2 right-2 p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full opacity-0 group-hover:opacity-100 sm:opacity-100 transition-opacity"
                    title="हटाएं"
                  >
                    <X className="size-4" />
                  </button>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl leading-none shrink-0">{a.icon}</span>
                    <div className="flex-1 min-w-0 pr-6">
                      <div className="font-bold text-base text-foreground">{a.title}</div>
                      <p className="text-sm text-muted-foreground mt-1">{a.message}</p>
                      <button
                        onClick={() => handleAlertCta(a.cta)}
                        className="text-sm font-bold text-primary mt-2 hover:underline text-left"
                      >
                        {a.cta} →
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* === SMS ALERT OPT-IN === */}
        {!isSmsSubscribed && (
          <div className="card-farm border-2 border-primary/20 bg-primary/5 p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="text-3xl shrink-0 hidden sm:block">📱</div>
            <div className="flex-1">
              <div className="font-bold text-base text-foreground flex items-center gap-2">
                <span className="sm:hidden">📱</span> {t("smsAlertTitle")}
              </div>
              <div className="text-sm text-muted-foreground">{t("smsAlertDesc")}</div>
            </div>
            <button
              onClick={handleSmsOptIn}
              className="btn-saffron px-4 py-2 text-sm shrink-0 w-full sm:w-auto mt-2 sm:mt-0"
            >
              {t("turnOn")}
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
