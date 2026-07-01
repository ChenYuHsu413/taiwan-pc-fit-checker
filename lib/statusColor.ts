import type { CompatibilityStatus } from "@/types/parts";

export const STATUS_COLOR: Record<CompatibilityStatus, string> = {
  safe: "#3ddc97",
  tight: "#eab308",
  warning: "#f97316",
  incompatible: "#ef4444",
};

export const NEUTRAL_COLOR = "#475569";
