import { toast } from "sonner";

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  token?: string | null;
};

export const API_BASE =
  import.meta.env.VITE_API_BASE_URL ?? 
  (import.meta.env.DEV ? "http://localhost:8000/v1" : "https://api.krishisathi.in/v1");
const TOKEN_KEY = "krishisathi_api_tokens";
const OTP_SESSION_KEY = "krishisathi_otp_session";
export const SHOULD_MOCK = import.meta.env.DEV;

if (import.meta.env.DEV) {
  console.log("API_BASE configured to:", API_BASE);
}


type ApiTokens = {
  access_token: string;
  refresh_token: string;
};

export type CommunityComment = {
  id: number;
  post_id: number;
  user_id?: number | null;
  content: string;
  author: string;
  created_at: string;
};

export type CommunityPost = {
  id: number;
  user_id?: number | null;
  author: string;
  location: string;
  content: string;
  media_url?: string | null;
  post_type: string;
  tags?: string[];
  crop_tags?: string[];
  moderation_status?: string;
  views_count?: number;
  likes_count: number;
  comments_count: number;
  is_pinned?: boolean;
  created_at: string;
  comments: CommunityComment[];
};

export type TreatmentStep = {
  step: number;
  description: string;
  type: string;
};

export type DiseaseInfo = {
  disease_name: string;
  disease_name_hindi: string;
  crop_name: string;
  crop_name_hindi: string;
  confidence: number;
  severity: string;
  severity_hindi: string;
  affected_area_percent: number;
  description: string;
  description_hindi: string;
  symptoms: string[];
  symptoms_hindi: string[];
  organic_treatment: TreatmentStep[];
  chemical_treatment: TreatmentStep[];
  prevention_tips: string[];
  prevention_tips_hindi: string[];
  estimated_cost_inr: string;
  recovery_time: string;
  spread_risk: string;
  scientific_name?: string;
};

export type DiseaseAnalysisResponse = {
  success: boolean;
  disease?: DiseaseInfo;
  error?: string;
  analysis_id?: string;
};

export function getApiTokens(): ApiTokens | null {
  const raw = localStorage.getItem(TOKEN_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ApiTokens;
  } catch {
    return null;
  }
}

export function setApiTokens(tokens: ApiTokens) {
  localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
}

export function clearApiTokens() {
  localStorage.removeItem(TOKEN_KEY);
}

export function setOtpSession(session: { phone: string; role: string }) {
  localStorage.setItem(OTP_SESSION_KEY, JSON.stringify(session));
}

export function hasOtpSession(): boolean {
  return Boolean(localStorage.getItem(OTP_SESSION_KEY) && getApiTokens()?.access_token);
}

export function clearOtpSession() {
  localStorage.removeItem(OTP_SESSION_KEY);
  clearApiTokens();
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const isFormData = typeof FormData !== "undefined" && opts.body instanceof FormData;
  const makeRequest = async (token: string | null | undefined) =>
    fetch(`${API_BASE}${path}`, {
      method: opts.method ?? "GET",
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: opts.body
        ? isFormData
          ? (opts.body as FormData)
          : JSON.stringify(opts.body)
        : undefined,
    });

  const providedToken = opts.token ?? getApiTokens()?.access_token ?? null;
  let res;
  // Enable mock mode during local development so auth flows work without a backend.
  // Change to `false` to use the live APIs.
  let useMock = SHOULD_MOCK;

  // Bypass mock for disease analysis and crop recommendation if we want real results
  const isDiseaseAnalyze = path.includes("/disease/analyze");
  const isCropRecommend = path.includes("/crop/recommend");
  
  if (useMock && !isDiseaseAnalyze && !isCropRecommend) {
    console.log("Forcing mock data for path:", path);
    if (path.includes("/auth/send-otp")) {
      return { success: true, message: "OTP sent" } as any;
    }
    if (path.includes("/auth/verify-otp")) {
      return {
        access_token: "mock_access_token",
        refresh_token: "mock_refresh_token",
        user: { id: "1", role: "farmer", phone: (opts.body as any)?.phone || "unknown" },
      } as any;
    }
    if (path.includes("/auth/profile") && opts.method === "PUT") {
      const current = JSON.parse(localStorage.getItem("krishisathi_mock_profile") || "{}");
      const updatedProfile = { ...(current.profile || {}), ...((opts.body as any) || {}) };
      const updated = { ...current, profile: updatedProfile };
      localStorage.setItem("krishisathi_mock_profile", JSON.stringify(updated));
      return updated.profile as any; // updateProfile expects the profile object
    }
    if (path.includes("/auth/profile")) {
      const saved = localStorage.getItem("krishisathi_mock_profile");
      if (saved) return JSON.parse(saved) as any;

      const defaultProfile = {
        user: { id: "1", role: "farmer", phone: "+919876543210" },
        profile: {
          id: "1",
          name: "Ramesh Kumar",
          village: "Palwal",
          district: "Faridabad",
          state: "Haryana",
          pincode: "121102",
          land_acres: 5.5,
          soil_type: "Loam",
          primary_crops: ["Wheat", "Mustard"],
          preferred_language: "en",
          onboarded: true,
          role: "farmer",
          subscription_plan: "premium",
        },
      };
      localStorage.setItem("krishisathi_mock_profile", JSON.stringify(defaultProfile));
      return defaultProfile as any;
    }
    if (path.includes("/weather/current")) {
      return {
        current: {
          tempC: 28.5,
          condition: "Partly Cloudy",
          humidity: 62,
          wind: "12 km/h NE",
          rainProbability: 20,
        },
        forecast: [
          { day: "Mon", icon: "⛅", high: 30, low: 22, rain: 10 },
          { day: "Tue", icon: "🌧️", high: 28, low: 21, rain: 80 },
          { day: "Wed", icon: "🌧️", high: 27, low: 21, rain: 60 },
          { day: "Thu", icon: "⛅", high: 29, low: 22, rain: 20 },
          { day: "Fri", icon: "☀️", high: 31, low: 23, rain: 0 },
          { day: "Sat", icon: "☀️", high: 32, low: 24, rain: 0 },
          { day: "Sun", icon: "⛅", high: 31, low: 23, rain: 10 },
        ],
        smartAlert: "Heavy rain expected tomorrow — avoid fertilizer today",
      } as any;
    }
    if (path.includes("/disease/detect")) {
      return {
        detections: [
          {
            disease_name: "Leaf Blight (Bacterial)",
            confidence: 94.2,
            severity: "MEDIUM",
            treatment_plan: [
              { step: 1, description: "Remove infected leaves immediately" },
              { step: 2, description: "Apply Copper Oxychloride 3g/L (spray)" },
              { step: 3, description: "Avoid overhead irrigation" },
              { step: 4, description: "Re-check after 7 days" },
            ],
            estimated_cost: "₹800-1200/acre",
          },
        ],
      } as any;
    }
    if (path.includes("/crop/recommend")) {
      return {
        recommendations: [
          {
            crop: "Wheat",
            emoji: "🌾",
            matchScore: 94,
            expectedYield: "35-40 quintal/acre",
            expectedProfit: 42000.0,
            riskLevel: "low",
            reason: "Perfect for your soil pH 7.2, rabi season suits your area",
            tips: [
              "Ensure proper irrigation at tillering stage",
              "Apply zinc sulfate if deficiency observed",
            ],
          },
          {
            crop: "Mustard",
            emoji: "🌼",
            matchScore: 82,
            expectedYield: "8-10 quintal/acre",
            expectedProfit: 28000.0,
            riskLevel: "medium",
            reason: "Good alternative with lower water requirement",
            tips: ["Watch out for aphids"],
          },
        ],
      } as any;
    }
    if (path.includes("/community/feed")) {
      return {
        page: 1,
        size: 20,
        total: 3,
        posts: [
          {
            id: 1,
            user_id: 1,
            author: "Ramesh Kumar",
            location: "पुणे, महाराष्ट्र",
            content: "आज गेहूं की फसल में पहली सिंचाई पूरी हुई। फसल बहुत अच्छी दिख रही है! 🌾",
            media_url:
              "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80",
            post_type: "photo",
            tags: ["wheat"],
            crop_tags: ["wheat"],
            moderation_status: "approved",
            views_count: 120,
            likes_count: 124,
            comments_count: 2,
            is_pinned: false,
            created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            comments: [
              {
                id: 1,
                post_id: 1,
                user_id: 11,
                content: "बहुत बढ़िया!",
                author: "Mahesh",
                created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
              },
              {
                id: 2,
                post_id: 1,
                user_id: 12,
                content: "कौन सा बीज इस्तेमाल किया?",
                author: "Pooja",
                created_at: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
              },
            ],
          },
          {
            id: 2,
            user_id: 2,
            author: "Sunita Deshmukh",
            location: "नाशिक, महाराष्ट्र",
            content: "यह प्याज फसल पर कीट नियंत्रण का छोटा वीडियो है।",
            media_url: "https://samplelib.com/lib/preview/mp4/sample-5s.mp4",
            post_type: "video",
            tags: ["onion", "organic"],
            crop_tags: ["onion"],
            moderation_status: "approved",
            views_count: 56,
            likes_count: 41,
            comments_count: 1,
            is_pinned: false,
            created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            comments: [
              {
                id: 3,
                post_id: 2,
                user_id: 16,
                content: "बहुत उपयोगी जानकारी",
                author: "Amit",
                created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
              },
            ],
          },
          {
            id: 3,
            user_id: 3,
            author: "Arjun Singh",
            location: "इंदौर, मध्य प्रदेश",
            content: "ड्रिप सिंचाई के बाद खेत की तस्वीर। पानी की अच्छी बचत हो रही है।",
            media_url:
              "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=800&q=80",
            post_type: "photo",
            tags: ["drip", "water-saving"],
            crop_tags: ["vegetables"],
            moderation_status: "approved",
            views_count: 90,
            likes_count: 77,
            comments_count: 0,
            is_pinned: false,
            created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            comments: [],
          },
        ],
      } as any;
    }
    if (path.includes("/community/upload")) {
      const file = opts.body instanceof FormData ? opts.body.get("file") : null;
      const isVideo = file instanceof File && file.type.startsWith("video/");
      return {
        media_url: isVideo
          ? "https://samplelib.com/lib/preview/mp4/sample-5s.mp4"
          : "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80",
        media_type: isVideo ? "video" : "photo",
      } as any;
    }
    if (path.includes("/community/posts/") && path.includes("/like")) {
      const postId = Number(path.split("/").slice(-2)[0]) || 1;
      return {
        id: postId,
        user_id: 1,
        author: "Anonymous Farmer",
        location: "भारत",
        content: "Post liked",
        media_url: null,
        post_type: "text",
        tags: [],
        crop_tags: [],
        moderation_status: "approved",
        views_count: 0,
        likes_count: 1,
        comments_count: 0,
        is_pinned: false,
        created_at: new Date().toISOString(),
        comments: [],
      } as any;
    }
    if (path.includes("/community/posts/") && path.includes("/comments")) {
      const postId = Number(path.split("/").slice(-2)[0]) || 1;
      return {
        id: Date.now(),
        post_id: postId,
        user_id: 1,
        content: (opts.body as any)?.content ?? "",
        author: (opts.body as any)?.author ?? "Anonymous Farmer",
        created_at: new Date().toISOString(),
      } as any;
    }
    if (path.includes("/community/posts")) {
      return {
        id: Date.now(),
        user_id: 1,
        author: (opts.body as any)?.author ?? "Anonymous Farmer",
        location: (opts.body as any)?.location ?? "भारत",
        content: (opts.body as any)?.content ?? "",
        media_url: (opts.body as any)?.media_url ?? null,
        post_type: (opts.body as any)?.post_type ?? "text",
        tags: (opts.body as any)?.tags ?? [],
        crop_tags: (opts.body as any)?.crop_tags ?? [],
        moderation_status: "approved",
        views_count: 0,
        likes_count: 0,
        comments_count: 0,
        is_pinned: false,
        created_at: new Date().toISOString(),
        comments: [],
      } as any;
    }

    // Fallback for any other unmocked path to prevent 500 error
    console.warn(`No mock implemented for ${path}, returning empty fallback.`);
    return (
      path.includes("list") || path.includes("feed") || path.includes("history") ? [] : {}
    ) as any;
  }

  // perform the real network request
  try {
    res = await makeRequest(providedToken);
  } catch (e) {
    // Network error or backend down
    if (useMock && !isDiseaseAnalyze && !isCropRecommend) {
      console.warn("Backend unreachable, returning mock fallback for:", path, e);
      if (path.includes("/auth/send-otp")) {
        return { success: true, message: "OTP sent (offline fallback)" } as any;
      }
      if (path.includes("/auth/verify-otp")) {
        return {
          access_token: "mock_access_token",
          refresh_token: "mock_refresh_token",
          user: { id: "1", role: "farmer", phone: (opts.body as any)?.phone || "unknown" },
        } as any;
      }
      if (path.includes("/auth/profile") && opts.method === "GET") {
        const saved = localStorage.getItem("krishisathi_mock_profile");
        if (saved) return JSON.parse(saved) as any;

        const defaultProfile = {
          user: { id: "1", role: "farmer", phone: "+919876543210" },
          profile: {
            id: "1",
            name: "Ramesh Kumar",
            village: localStorage.getItem("krishisathi_city") || "Palwal",
            district: "",
            state: "",
            pincode: "",
            land_acres: 0,
            soil_type: "",
            primary_crops: [],
            preferred_language: "en",
            onboarded: true,
            role: "farmer",
            subscription_plan: "premium",
          },
        };
        localStorage.setItem("krishisathi_mock_profile", JSON.stringify(defaultProfile));
        return defaultProfile as any;
      }
    } else {
      console.error(`Backend connection failed for ${path}:`, e);
      if (!useMock) {
        toast.error("सर्वर से संपर्क नहीं हो सका (Backend connection failed). कृपया सुनिश्चित करें कि आपका बैकएंड चल रहा है।");
      }
    }

    return (
      path.includes("list") || path.includes("feed") || path.includes("history") ? [] : {}
    ) as any;
  }

  if (res.status === 401) {
    const refreshToken = getApiTokens()?.refresh_token;
    if (refreshToken) {
      try {
        const refreshed = await fetch(`${API_BASE}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
        if (refreshed.ok) {
          const refreshedPayload = (await refreshed.json()) as { access_token?: string };
          if (refreshedPayload.access_token) {
            setApiTokens({
              access_token: refreshedPayload.access_token,
              refresh_token: refreshToken,
            });
            res = await makeRequest(refreshedPayload.access_token);
          }
        }
      } catch (e) {
        if (useMock && !isDiseaseAnalyze && !isCropRecommend) {
          console.warn("Request failed but using mock data fallback:", e);
        } else {
          console.error(`API request failed for ${path}:`, e);
          toast.error("सर्वर से संपर्क नहीं हो सका (Backend connection failed)");
        }
        return (path.includes("list") || path.includes("feed") || path.includes("history") ? [] : {}) as any;
      }
    }
  }

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      (payload && typeof payload.message === "string" && payload.message) || "API request failed";
    throw new Error(message);
  }
  return payload as T;
}

export type SendOtpResponse = {
  success: boolean;
  message: string;
  expires_in_sec?: number;
};

export type VerifyOtpResponse = {
  access_token: string;
  refresh_token: string;
  user: { id: string; role: string; phone: string };
};

export const api = {
  auth: {
    sendOtp: (phone: string) =>
      request<SendOtpResponse>("/auth/send-otp", {
        method: "POST",
        body: { phone },
      }),
    verifyOtp: (phone: string, otp: string) =>
      request<VerifyOtpResponse>("/auth/verify-otp", {
        method: "POST",
        body: { phone, otp },
      }),
    refresh: (refreshToken: string) =>
      request<{ access_token: string }>("/auth/refresh", {
        method: "POST",
        body: { refresh_token: refreshToken },
      }),
    profile: (token: string) =>
      request("/auth/profile", {
        method: "GET",
        token,
      }),
    updateProfile: (token: string, payload: Partial<Profile>) =>
      request<Profile>("/auth/profile", {
        method: "PUT",
        token,
        body: payload,
      }),
  },
  crop: {
    recommend: (token: string, input: Record<string, unknown>) =>
      request("/crop/recommend", {
        method: "POST",
        body: input,
        token,
      }),
    history: (token: string) =>
      request("/crop/history", {
        method: "GET",
        token,
      }),
  },
  disease: {
    detect: (token: string, payload: Record<string, unknown>) =>
      request("/disease/detect", {
        method: "POST",
        token,
        body: payload,
      }),
    analyze: (file: File) => {
      const form = new FormData();
      form.append("file", file);
      return request<DiseaseAnalysisResponse>("/disease/analyze", {
        method: "POST",
        body: form,
      });
    },
  },
  chat: {
    message: (token: string, payload: Record<string, unknown>) =>
      request("/chat/message", {
        method: "POST",
        token,
        body: payload,
      }),
  },
  community: {
    feed: (page = 1, size = 20) =>
      request<{ posts: CommunityPost[]; page: number; size: number; total: number }>(
        `/community/feed?page=${page}&size=${size}`,
      ),
    getPost: (postId: number) => request<CommunityPost>(`/community/posts/${postId}`),
    createPost: (payload: {
      content: string;
      author?: string;
      location?: string;
      media_url?: string;
      post_type?: string;
      tags?: string[];
      crop_tags?: string[];
    }) =>
      request<CommunityPost>("/community/posts", {
        method: "POST",
        body: payload,
      }),
    uploadMedia: (file: File) => {
      const form = new FormData();
      form.append("file", file);
      return request<{ media_url: string; media_type: "photo" | "video" }>("/community/upload", {
        method: "POST",
        body: form,
      });
    },
    updatePost: (
      postId: number,
      payload: {
        content?: string;
        media_url?: string | null;
        tags?: string[];
        crop_tags?: string[];
      },
    ) =>
      request<CommunityPost>(`/community/posts/${postId}`, {
        method: "PUT",
        body: payload,
      }),
    deletePost: (postId: number) =>
      request<{ success: boolean; message: string }>(`/community/posts/${postId}`, {
        method: "DELETE",
      }),
    likePost: (postId: number) =>
      request<CommunityPost>(`/community/posts/${postId}/like`, {
        method: "POST",
      }),
    addComment: (postId: number, payload: { content: string; author?: string }) =>
      request<CommunityComment>(`/community/posts/${postId}/comments`, {
        method: "POST",
        body: payload,
      }),
    reportPost: (postId: number, payload: { reason: string; details?: string }) =>
      request<{ success: boolean; message: string }>(`/community/posts/${postId}/report`, {
        method: "POST",
        body: payload,
      }),
  },
};
