import type { CompatibilityStatus } from "@/types/parts";

export const STATUS_COLOR: Record<CompatibilityStatus, string> = {
  safe: "#3ddc97",
  info: "#60a5fa",
  tight: "#eab308",
  warning: "#f97316",
  incompatible: "#ef4444",
  unknown: "#94a3b8",
};

export const NEUTRAL_COLOR = "#475569";
