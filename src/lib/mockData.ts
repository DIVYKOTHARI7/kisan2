// Mock data for KrishiSathi MVP — replace with real API calls when backend is wired up.

export const farmer = {
  name: "Rohan Patel",
  initials: "RP",
  village: "Khed, Pune",
  state: "Maharashtra",
  landAcres: 12.5,
  primaryCrops: ["Wheat", "Sugarcane", "Onion"],
};

export const weather = {
  current: {
    tempC: 28,
    condition: "Partly Cloudy",
    humidity: 64,
    wind: "15 km/h NE",
    rainProbability: 20,
  },
  forecast: [
    { day: "Today", high: 30, low: 22, icon: "☀️", rain: 10 },
    { day: "Tue", high: 29, low: 21, icon: "⛅", rain: 30 },
    { day: "Wed", high: 27, low: 20, icon: "🌧️", rain: 80 },
    { day: "Thu", high: 25, low: 19, icon: "🌧️", rain: 90 },
    { day: "Fri", high: 28, low: 21, icon: "⛅", rain: 20 },
    { day: "Sat", high: 30, low: 22, icon: "☀️", rain: 5 },
    { day: "Sun", high: 31, low: 23, icon: "☀️", rain: 0 },
  ],
  smartAlert: "Heavy rain expected Wed–Thu (80–90mm). Avoid fertilizer application until Friday.",
};

export const activeCrops = [
  {
    id: "1",
    name: "Wheat",
    field: "Field A",
    acres: 5,
    stage: "Flowering",
    progress: 75,
    daysSinceSowing: 92,
    totalDays: 120,
    nextTask: "Apply potassium top-dress",
    nextTaskDate: "in 2 days",
  },
  {
    id: "2",
    name: "Sugarcane",
    field: "Field C",
    acres: 4,
    stage: "Grand Growth",
    progress: 50,
    daysSinceSowing: 165,
    totalDays: 330,
    nextTask: "Earthing up & irrigation",
    nextTaskDate: "tomorrow",
  },
  {
    id: "3",
    name: "Onion",
    field: "Field B",
    acres: 2.5,
    stage: "Bulb Formation",
    progress: 60,
    daysSinceSowing: 75,
    totalDays: 130,
    nextTask: "Pest scouting",
    nextTaskDate: "today",
  },
];

export const alerts = [
  {
    id: "a1",
    severity: "warning" as const,
    icon: "🚨",
    title: "Pest infestation risk nearby",
    message: "Whitefly activity reported in 3 villages within 8 km. Scout your fields today.",
    cta: "View advisory",
  },
  {
    id: "a3",
    severity: "success" as const,
    icon: "🏛️",
    title: "PM-KISAN 16th installment released",
    message: "₹2,000 credited to eligible accounts. Check status in Schemes.",
    cta: "Check eligibility",
  },
];


// Crop recommendation engine — deterministic mock
export type CropRecInput = {
  n: number;
  p: number;
  k: number;
  ph: number;
  soilType: string;
  season: string;
  irrigation: string;
  budget: number;
  risk: "low" | "medium" | "high";
};

export type CropRecResult = {
  crop: string;
  emoji: string;
  matchScore: number; // 0-100
  expectedYield: string;
  expectedProfit: number;
  riskLevel: "low" | "medium" | "high";
  reason: string;
  tips: string[];
};

const CROP_LIBRARY: Omit<CropRecResult, "matchScore" | "reason">[] = [
  {
    crop: "Wheat",
    emoji: "🌾",
    expectedYield: "35–40 quintal/acre",
    expectedProfit: 42000,
    riskLevel: "low",
    tips: [
      "Sow before mid-November for best yield",
      "Apply DAP at sowing, urea in split doses",
      "First irrigation at crown root initiation (21 days)",
    ],
  },
  {
    crop: "Mustard",
    emoji: "🌼",
    expectedYield: "10–12 quintal/acre",
    expectedProfit: 28000,
    riskLevel: "medium",
    tips: ["Drought tolerant variety recommended", "Watch for aphids in flowering stage"],
  },
  {
    crop: "Chickpea",
    emoji: "🫘",
    expectedYield: "8–10 quintal/acre",
    expectedProfit: 35000,
    riskLevel: "low",
    tips: ["Nitrogen fixer — great for soil health", "Avoid waterlogging"],
  },
  {
    crop: "Rice (Basmati)",
    emoji: "🍚",
    expectedYield: "22–28 quintal/acre",
    expectedProfit: 38000,
    riskLevel: "medium",
    tips: ["Needs reliable water source", "SRI method can boost yield 20%"],
  },
  {
    crop: "Cotton (Bt)",
    emoji: "🌱",
    expectedYield: "12–15 quintal/acre",
    expectedProfit: 48000,
    riskLevel: "high",
    tips: ["High input cost — secure crop insurance", "Pink bollworm monitoring critical"],
  },
  {
    crop: "Soybean",
    emoji: "🫛",
    expectedYield: "12–15 quintal/acre",
    expectedProfit: 30000,
    riskLevel: "medium",
    tips: ["Inoculate seeds with rhizobium", "Sow with onset of monsoon"],
  },
];

export function recommendCrops(input: CropRecInput): CropRecResult[] {
  const { season, ph, n, risk } = input;
  // Simple deterministic scoring
  const scored = CROP_LIBRARY.map((c) => {
    let score = 70 + Math.round((ph - 6.5) * 4) + Math.round((n - 60) / 8);
    if (season === "Rabi" && ["Wheat", "Mustard", "Chickpea"].includes(c.crop)) score += 18;
    if (season === "Kharif" && ["Rice (Basmati)", "Cotton (Bt)", "Soybean"].includes(c.crop)) score += 18;
    if (risk === "low" && c.riskLevel === "low") score += 10;
    if (risk === "high" && c.riskLevel === "high") score += 8;
    if (risk === "low" && c.riskLevel === "high") score -= 15;
    score = Math.max(40, Math.min(98, score));
    return {
      ...c,
      matchScore: score,
      reason: `Suits your soil (pH ${ph.toFixed(1)}, N ${n}) and ${season.toLowerCase()} season.`,
    };
  });
  return scored.sort((a, b) => b.matchScore - a.matchScore).slice(0, 3);
}

// Disease detection mock
export type DiseaseResult = {
  disease: string;
  crop: string;
  confidence: number;
  severity: "low" | "medium" | "high";
  affectedArea: string;
  description: string;
  treatment: { step: string; detail: string }[];
  costEstimate: string;
};

const DISEASE_POOL: DiseaseResult[] = [
  {
    disease: "Bacterial Leaf Blight",
    crop: "Rice",
    confidence: 94.2,
    severity: "medium",
    affectedArea: "~30% of leaves",
    description: "Yellow lesions along leaf veins caused by Xanthomonas oryzae. Spreads in humid conditions.",
    treatment: [
      { step: "Remove infected leaves", detail: "Burn or bury away from field" },
      { step: "Spray copper oxychloride", detail: "3g per litre of water, foliar spray" },
      { step: "Reduce overhead irrigation", detail: "Switch to flood/basin irrigation" },
      { step: "Re-evaluate after 7 days", detail: "Repeat spray if lesions spread" },
    ],
    costEstimate: "₹800–1,200 / acre",
  },
  {
    disease: "Powdery Mildew",
    crop: "Wheat",
    confidence: 91.5,
    severity: "low",
    affectedArea: "~15% of leaves",
    description: "White powdery patches on upper leaf surface caused by Blumeria graminis. Common in cool, dry weather.",
    treatment: [
      { step: "Apply sulphur dust", detail: "20–25 kg/acre, early morning" },
      { step: "Increase plant spacing", detail: "Improves air circulation" },
      { step: "Avoid late nitrogen", detail: "Excess N worsens infection" },
    ],
    costEstimate: "₹500–700 / acre",
  },
  {
    disease: "Early Blight",
    crop: "Tomato",
    confidence: 88.7,
    severity: "high",
    affectedArea: "~50% of plants",
    description: "Concentric ring lesions on lower leaves caused by Alternaria solani. Can defoliate plants quickly.",
    treatment: [
      { step: "Remove infected debris", detail: "Sanitize tools after pruning" },
      { step: "Apply Mancozeb 75% WP", detail: "2g per litre, repeat every 10 days" },
      { step: "Mulch around plants", detail: "Prevents soil splash onto leaves" },
      { step: "Crop rotation next season", detail: "Avoid solanaceae for 2 years" },
    ],
    costEstimate: "₹1,400–1,800 / acre",
  },
];

export function detectDisease(): DiseaseResult {
  // Pseudo-random pick — in production this is the ML model output
  return DISEASE_POOL[Math.floor(Math.random() * DISEASE_POOL.length)];
}

// Chatbot mock responses
export const chatStarters = [
  "When should I sow wheat in Maharashtra?",
  "How do I treat yellow leaves in my rice crop?",
  "Am I eligible for PM-KISAN?",
];

export function mockBotReply(query: string): string {
  const q = query.toLowerCase();
  if (q.includes("wheat") && (q.includes("sow") || q.includes("plant"))) {
    return "🌾 In Maharashtra, the ideal wheat sowing window is **November 1–25**. Sowing earlier risks heat stress at grain-fill; later sowing reduces yield by ~1% per day delay.\n\n**Recommended varieties:** HD-2967, MACS-6478, NIAW-3170.\n\n**Seed rate:** 40 kg/acre. **Spacing:** 22 cm rows.\n\n💡 Pair with DAP at sowing + urea in 2 split doses (21 & 45 days).";
  }
  if (q.includes("yellow") && q.includes("rice")) {
    return "🌿 Yellow leaves in rice usually signal one of three issues:\n\n1. **Nitrogen deficiency** — apply 15 kg urea/acre\n2. **Bacterial leaf blight** — copper oxychloride spray\n3. **Iron toxicity** (in waterlogged soil) — drain field for 3 days\n\n📸 Upload a photo via *Disease Check* for an accurate diagnosis.";
  }
  if (q.includes("pm-kisan") || q.includes("eligible")) {
    return "🏛️ **PM-KISAN eligibility:**\n\n✅ Indian citizen farmer family\n✅ Owns cultivable land (no upper limit removed since 2019)\n❌ Income tax payers, govt employees, pensioners >₹10,000/month excluded\n\nYou'll receive **₹6,000/year** in 3 installments of ₹2,000.\n\n📝 Apply at pmkisan.gov.in or your nearest CSC. Documents needed: Aadhaar, land records, bank account.";
  }
  return `Got it — let me think about "${query}".\n\nBased on your farm profile (Khed, Pune · 12.5 acres · Wheat/Sugarcane/Onion), here's my best guidance:\n\n• Check the relevant module in the dashboard for tailored data\n• You can also book a 30-min expert consultation if you'd like a deeper review\n\nWant me to dig into a specific aspect?`;
}
