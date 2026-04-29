import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/lib/auth";

export const ROLES = [
  "farmer_basic",
  "farmer_premium",
  "expert",
  "input_dealer",
  "government_officer",
  "moderator",
  "admin",
] as const;

export type AppRole = (typeof ROLES)[number];
export type PlanTier = "basic" | "premium" | "expert" | "enterprise";
export type FeatureKey =
  | "crop_recommendation"
  | "disease_detection"
  | "chatbot"
  | "expert_call_booking"
  | "marketplace_buy"
  | "soil_report_upload"
  | "iot_dashboard"
  | "export_data";

export function resolveRole(profile: Profile | null, user: User | null): AppRole {
  const profileRole = normalizeRole(profile?.role);
  if (profileRole) return profileRole;

  const userMetaRole = normalizeRole(user?.user_metadata?.role as string | undefined);
  if (userMetaRole) return userMetaRole;

  return "farmer_basic";
}

export function roleLabel(role: AppRole): string {
  switch (role) {
    case "farmer_basic":
      return "Farmer (Basic)";
    case "farmer_premium":
      return "Farmer (Premium)";
    case "expert":
      return "Expert";
    case "input_dealer":
      return "Input Dealer";
    case "government_officer":
      return "Government Officer";
    case "moderator":
      return "Content Moderator";
    case "admin":
      return "Super Admin";
    default:
      return "Farmer";
  }
}

export function canAccess(role: AppRole, feature: "expert_panel" | "admin_panel"): boolean {
  if (feature === "expert_panel") return role === "expert" || role === "admin";
  if (feature === "admin_panel") return role === "admin" || role === "moderator";
  return false;
}

export function resolvePlan(profile: Profile | null, role: AppRole): PlanTier {
  const explicit = (profile?.subscription_plan ?? "").toLowerCase().trim();
  if (explicit === "premium") return "premium";
  if (explicit === "expert") return "expert";
  if (explicit === "enterprise") return "enterprise";
  if (role === "farmer_premium") return "premium";
  if (role === "expert") return "expert";
  if (role === "admin" || role === "moderator" || role === "government_officer") return "enterprise";
  return "basic";
}

export function getFeatureAccess(role: AppRole, plan: PlanTier, feature: FeatureKey): boolean {
  if (role === "admin" || role === "moderator") return true;
  if (plan === "enterprise" || plan === "expert") return true;
  if (plan === "premium") {
    return true;
  }
  // Basic plan restrictions
  if (feature === "expert_call_booking") return false;
  if (feature === "marketplace_buy") return false;
  if (feature === "soil_report_upload") return false;
  if (feature === "iot_dashboard") return false;
  if (feature === "export_data") return false;
  return true;
}

export function getDailyLimit(plan: PlanTier, feature: FeatureKey): number | null {
  if (plan !== "basic") return null;
  if (feature === "crop_recommendation") return 3;
  if (feature === "disease_detection") return 1;
  if (feature === "chatbot") return 5;
  return null;
}

function normalizeRole(role: string | null | undefined): AppRole | null {
  if (!role) return null;
  const normalized = role.toLowerCase().trim();
  if ((ROLES as readonly string[]).includes(normalized)) {
    return normalized as AppRole;
  }
  return null;
}
