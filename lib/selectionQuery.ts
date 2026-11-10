// URL query ↔ 零件選擇（/builder?case=...&gpu=...）。截圖腳本與之後的分享連結共用。
// 參數：case、mb、cpu、ram、gpu、air（塔散 id）、aio（水冷 id）、mount（front / top，預設 top）、psu、ssd（逗號分隔）、view（3d / 2d）。
// 找不到的 id 直接忽略。

import { catalog } from "@/lib/data/catalog";
import type { BuildSelection, PartByCategory, PartCategory } from "@/types/parts";

function find<C extends PartCategory>(category: C, id: string | null): PartByCategory[C] | undefined {
  if (!id) return undefined;
  return (catalog[category] as PartByCategory[C][]).find((p) => p.id === id);
}

export function selectionFromQuery(search: string, base: BuildSelection): BuildSelection {
  const q = new URLSearchParams(search);
  const air = find("airCooler", q.get("air"));
  const aio = find("aio", q.get("aio"));
  const mount = q.get("mount") === "front" ? "front" : "top";
  return {
    ...base,
    case: find("case", q.get("case")) ?? base.case,
    motherboard: find("motherboard", q.get("mb")) ?? base.motherboard,
    cpu: find("cpu", q.get("cpu")) ?? base.cpu,
    ram: find("ram", q.get("ram")) ?? base.ram,
    gpu: find("gpu", q.get("gpu")) ?? base.gpu,
    psu: find("psu", q.get("psu")) ?? base.psu,
    cooler: aio ? { kind: "aio", cooler: aio, mountLocation: mount } : air ? { kind: "air", cooler: air } : base.cooler,
    m2Ssds: (q.get("ssd") ?? "")
      .split(",")
      .map((id) => find("m2Ssd", id))
      .filter((p): p is PartByCategory["m2Ssd"] => p !== undefined),
  };
}

export function viewFromQuery(search: string): "3d" | "2d" | undefined {
  const v = new URLSearchParams(search).get("view");
  return v === "2d" || v === "3d" ? v : undefined;
}
