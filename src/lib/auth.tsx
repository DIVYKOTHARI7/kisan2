import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, getApiTokens, clearApiTokens } from "./api";

export type Profile = {
  id: string;
  name: string | null;
  village: string | null;
  district: string | null;
  state: string | null;
  pincode: string | null;
  land_acres: number | null;
  soil_type: string | null;
  primary_crops: string[] | null;
  preferred_language: string | null;
  onboarded: boolean;
  notifications_enabled?: boolean;
  role?: string | null;
  subscription_plan?: string | null;
  phone?: string | null;
};

// Define a simplified User matching our FastAPI token
export type User = {
  id: string;
  role: string;
  phone: string;
};

type AuthContextValue = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
  setUserAndProfile: (u: User, p: Profile) => void;
  updateProfile: (p: Partial<Profile>) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile() {
    const tokens = getApiTokens();
    console.debug("AuthProvider.loadProfile: tokens=", tokens);
    if (!tokens) {
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }
    try {
      // Decode user from token or use profile endpoint
      // Assuming api.auth.profile returns { user, profile }
      const data = await api.auth.profile(tokens.access_token) as any;
      console.debug("AuthProvider.loadProfile: profile data=", data);
      setUser(data.user);
      setProfile(data.profile);
    } catch (e) {
      // Token might be invalid or expired without refresh
      clearApiTokens();
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
    
    // Listen for storage changes in case login happens in another tab
    const onStorage = (e: StorageEvent) => {
      if (e.key === "krishisathi_api_tokens") {
        loadProfile();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  async function refreshProfile() {
    await loadProfile();
  }

  async function signOut() {
    clearApiTokens();
    setUser(null);
    setProfile(null);
    // Optionally hit a backend logout endpoint if implemented
  }

  function setUserAndProfile(u: User, p: Profile) {
    setUser(u);
    setProfile(p);
  }

  async function updateProfile(payload: Partial<Profile>) {
    const tokens = getApiTokens();
    if (!tokens) return;
    try {
      const res = await api.auth.updateProfile(tokens.access_token, payload) as any;
      if (res && res.profile) {
        setProfile(res.profile);
        if (res.user) setUser(res.user);
      } else {
        setProfile(res);
      }
    } catch (e) {
      console.error("Profile update failed:", e);
      throw e;
    }
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile, signOut: signOut, setUserAndProfile, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
