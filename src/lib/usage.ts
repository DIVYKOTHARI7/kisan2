import type { FeatureKey, PlanTier } from "@/lib/rbac";
import { getDailyLimit } from "@/lib/rbac";

type UsageState = Record<string, number>;

const STORAGE_KEY = "krishisathi_daily_usage_v1";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function usageMap(): UsageState {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as UsageState;
  } catch {
    return {};
  }
}

function saveUsage(state: UsageState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function key(feature: FeatureKey) {
  return `${todayKey()}::${feature}`;
}

export function getFeatureUsage(feature: FeatureKey): number {
  return usageMap()[key(feature)] ?? 0;
}

export function incrementFeatureUsage(feature: FeatureKey): number {
  const state = usageMap();
  const usageKey = key(feature);
  const next = (state[usageKey] ?? 0) + 1;
  state[usageKey] = next;
  saveUsage(state);
  return next;
}

export function getRemainingForPlan(feature: FeatureKey, plan: PlanTier): number | null {
  const limit = getDailyLimit(plan, feature);
  if (limit === null) return null;
  return Math.max(0, limit - getFeatureUsage(feature));
}

export function isQuotaExceeded(feature: FeatureKey, plan: PlanTier): boolean {
  const remaining = getRemainingForPlan(feature, plan);
  return remaining !== null && remaining <= 0;
}
