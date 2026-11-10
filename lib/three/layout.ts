// 3D / 2D 共用佈局計算（規格：docs/3d-layout-spec.md）。
// 座標（mm）：x = 前後（後方內壁 x=0，往前面板為正）；y = 上下（內部底面 y=0）；z = 左右（托盤面 z=0，往側透玻璃為正）。
// 輸出每個零件的 bounding box（mm），3D / 2D 元件只負責畫出來。示意值全部在 ./constants.ts。

import type { BuildSelection, CompatibilityResult, CompatibilityStatus, MotherboardFormFactor } from "@/types/parts";
import { coolerHeightLimitMm, gpuHeightLimitMm, gpuLengthLimit, psuLengthLimitMm } from "@/lib/compatibility/limits";
import {
  BOARD_FEATURES,
  BOARD_REAR_X_MM,
  BOARD_STANDARD_MM,
  BOARD_STANDOFF_MM,
  BOARD_TOP_GAP_MM,
  CASE_WALL_MM,
  DEFAULT_FAN_THICKNESS_MM,
  DEFAULT_RAM_SLOTS,
  DIMM_LENGTH_MM,
  DIMM_SLOT_HEIGHT_MM,
  DIMM_THICKNESS_MM,
  FRONT_COOLING_TOP_GAP_MM,
  PCB_THICKNESS_MM,
  PSU_FORM_MM,
  PSU_SHROUD_HEIGHT_MM,
  PUMP_HEAD_MM,
  TOP_RADIATOR_REAR_GAP_MM,
  VERTICAL_GPU_BOTTOM_GAP_MM,
  VERTICAL_GPU_Z_MM,
  VISUAL_FALLBACK_MM,
  type FallbackKey,
} from "./constants";

export { FALLBACK_LABEL, VISUAL_FALLBACK_MM, type FallbackKey } from "./constants";

// ---------- 單位換算（全專案唯一的 mm → three.js 換算） ----------

const SCENE_UNITS_PER_MM = 0.01;
export function toSceneUnits(mm: number): number {
  return mm * SCENE_UNITS_PER_MM;
}

// ---------- 型別 ----------

export type Vec3 = [number, number, number];
export interface Box {
  min: Vec3;
  max: Vec3;
}

export type ItemKind =
  | "shell"
  | "shroud"
  | "board"
  | "socket"
  | "pcieSlot"
  | "ramSlot"
  | "ram"
  | "gpu"
  | "gpuFan"
  | "cooler"
  | "pump"
  | "radiator"
  | "caseFan"
  | "psu"
  | "limit"
  | "conflict";

export interface SceneItem {
  id: string;
  kind: ItemKind;
  box: Box;
  /** 依報告上色；undefined = 中性色 */
  status?: CompatibilityStatus;
  label?: string;
  /** 沒有選擇零件時的位置示意（半透明） */
  placeholder?: boolean;
}

export interface SceneLayout {
  shell: Box;
  interior: Box;
  /** 主機板後方上緣基準點（所有板型相同） */
  boardAnchor: { x: number; y: number };
  boardFrontZ: number;
  gpuOrientation: "horizontal" | "vertical";
  /** 官方上限面的位置（與報告採用的上限一致） */
  limits: {
    gpuLengthX?: number;
    gpuHeightZ?: number;
    coolerTopZ?: number;
    /** 電源長度上限面的 x */
    psuFrontX?: number;
    /** 電源長度上限值（由電源起點量起） */
    psuLengthFromStart?: number;
    /** 電源起點與末端的 x（一般機殼由後往前；ITX 機殼由前往後） */
    psuStartX?: number;
    psuEndX?: number;
  };
  /** 主要零件的 box（測試與 2D 使用） */
  parts: { board?: Box; gpu?: Box; cooler?: Box; psu?: Box; radiator?: Box; frontFans: Box[]; ram: Box[] };
  items: SceneItem[];
  fallbacks: FallbackKey[];
  bounds: Box;
}

// ---------- 小工具 ----------

const box = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number): Box => ({
  min: [Math.min(x0, x1), Math.min(y0, y1), Math.min(z0, z1)],
  max: [Math.max(x0, x1), Math.max(y0, y1), Math.max(z0, z1)],
});

export const size = (b: Box): Vec3 => [b.max[0] - b.min[0], b.max[1] - b.min[1], b.max[2] - b.min[2]];

function intersect(a: Box, b: Box): Box | undefined {
  const min = [0, 1, 2].map((i) => Math.max(a.min[i], b.min[i])) as Vec3;
  const max = [0, 1, 2].map((i) => Math.min(a.max[i], b.max[i])) as Vec3;
  return min.every((v, i) => v < max[i]) ? { min, max } : undefined;
}

function union(list: Box[]): Box {
  return {
    min: [0, 1, 2].map((i) => Math.min(...list.map((b) => b.min[i]))) as Vec3,
    max: [0, 1, 2].map((i) => Math.max(...list.map((b) => b.max[i]))) as Vec3,
  };
}

/** 取值；缺值時用視覺預設尺寸並記錄（畫面標示「示意尺寸」） */
export function visualMm(value: number | undefined, key: keyof typeof VISUAL_FALLBACK_MM, used: Set<FallbackKey>): number {
  if (value !== undefined) return value;
  used.add(key);
  return VISUAL_FALLBACK_MM[key];
}

const SEVERITY: CompatibilityStatus[] = ["incompatible", "warning", "tight", "info", "unknown", "safe"];
function worstOf(results: CompatibilityResult[], ids: string[]): CompatibilityStatus | undefined {
  const list = results.filter((r) => ids.includes(r.ruleId)).map((r) => r.status);
  return SEVERITY.find((s) => list.includes(s));
}

// ---------- 佈局 ----------

export function computeLayout(selection: BuildSelection, results: CompatibilityResult[] = []): SceneLayout | null {
  const { case: c, motherboard: mb, gpu, cooler, psu, ram, overrides } = selection;
  if (!c) return null;
  const used = new Set<FallbackKey>();
  const items: SceneItem[] = [];
  const parts: SceneLayout["parts"] = { frontFans: [], ram: [] };
  const limits: SceneLayout["limits"] = {};

  // 機殼：外觀扣掉示意壁厚 = 內部空間
  const extD = visualMm(c.external.depthMm, "caseExternalDepth", used);
  const extH = visualMm(c.external.heightMm, "caseExternalHeight", used);
  const extW = visualMm(c.external.widthMm, "caseExternalWidth", used);
  const cable = visualMm(overrides.caseCableManagementSpaceMm ?? c.cableSpaceMm, "caseCableSpace", used);
  const interior = box(0, extD - 2 * CASE_WALL_MM, 0, extH - 2 * CASE_WALL_MM, -cable, extW - 2 * CASE_WALL_MM - cable);
  const shell = box(
    -CASE_WALL_MM,
    interior.max[0] + CASE_WALL_MM,
    -CASE_WALL_MM,
    interior.max[1] + CASE_WALL_MM,
    interior.min[2] - CASE_WALL_MM,
    interior.max[2] + CASE_WALL_MM
  );
  const frontX = interior.max[0];
  const topY = interior.max[1];
  const midZ = (interior.min[2] + interior.max[2]) / 2;
  // 只支援 ITX 的機殼（NR200P、Terra）沒有傳統電源倉：不畫電源倉，電源改放前上方（示意）
  const itxOnly = c.supportedFormFactors.every((ff) => ff === "ITX");
  items.push({ id: "shell", kind: "shell", box: shell });
  if (!itxOnly)
    items.push({ id: "shroud", kind: "shroud", box: box(0, frontX, 0, PSU_SHROUD_HEIGHT_MM, interior.min[2], interior.max[2]) });

  // 主機板：後方上緣對齊同一基準點，往下、往前延伸
  const ff: MotherboardFormFactor = mb?.formFactor ?? "ATX";
  const std = BOARD_STANDARD_MM[ff];
  if (mb && (mb.dimensions.heightMm === undefined || mb.dimensions.depthMm === undefined)) used.add("motherboardSize");
  const boardH = mb?.dimensions.heightMm ?? std.heightMm;
  const boardD = mb?.dimensions.depthMm ?? std.depthMm;
  const ax = BOARD_REAR_X_MM;
  const ay = topY - BOARD_TOP_GAP_MM;
  const backZ = BOARD_STANDOFF_MM;
  const frontZ = backZ + PCB_THICKNESS_MM;
  const f = BOARD_FEATURES[ff];
  const boardBox = box(ax, ax + boardD, ay - boardH, ay, backZ, frontZ);
  parts.board = boardBox;
  items.push({ id: "board", kind: "board", box: boardBox, status: worstOf(results, ["R01"]), placeholder: !mb });

  const socketX = ax + f.socketDx;
  const socketY = ay - f.socketDy;
  const half = f.socketSizeMm / 2;
  items.push({ id: "socket", kind: "socket", box: box(socketX - half, socketX + half, socketY - half, socketY + half, frontZ, frontZ + 5) });

  const slotY = ay - f.slotDy;
  items.push({
    id: "pcie-slot-1",
    kind: "pcieSlot",
    box: box(ax + f.slotDx, ax + f.slotDx + f.slotLengthMm, slotY - 3.5, slotY + 3.5, frontZ, frontZ + 11),
  });

  const ramSlots = mb?.memorySlots ?? DEFAULT_RAM_SLOTS[ff];
  const ramTop = ay - f.ramTopDy;
  const ramCount = ram ? Math.min(ram.moduleCount, ramSlots) : 0;
  const ramHeight = ram ? visualMm(ram.moduleHeightMm, "ramHeight", used) : 0;
  for (let i = 0; i < ramSlots; i++) {
    const cx = ax + f.ramFirstDx + i * f.ramPitchMm;
    const x0 = cx - DIMM_THICKNESS_MM / 2;
    const x1 = cx + DIMM_THICKNESS_MM / 2;
    if (i < ramCount) {
      const b = box(x0, x1, ramTop - DIMM_LENGTH_MM, ramTop, frontZ, frontZ + ramHeight);
      parts.ram.push(b);
      items.push({ id: `ram-${i}`, kind: "ram", box: b, status: worstOf(results, ["R06", "R23", "R24"]) });
    } else {
      items.push({
        id: `ram-slot-${i}`,
        kind: "ramSlot",
        box: box(x0, x1, ramTop - DIMM_LENGTH_MM, ramTop, frontZ, frontZ + DIMM_SLOT_HEIGHT_MM),
      });
    }
  }

  // 前置水冷排 / 出廠前置風扇：R02 採用該條件時貼在顯卡長度上限面（官方上限由此量測），否則貼前面板內側
  const lengthLimit = gpuLengthLimit(selection);
  if (lengthLimit?.mm !== undefined) limits.gpuLengthX = lengthLimit.mm;
  const obstacles: Box[] = [];
  const frontAio = cooler.kind === "aio" && cooler.mountLocation === "front" ? cooler.cooler : undefined;
  if (cooler.kind === "aio") {
    const a = cooler.cooler;
    const t = visualMm(a.radiatorThicknessMm, "radiatorThickness", used) + visualMm(a.fanThicknessMm, "fanThickness", used);
    const len = visualMm(a.radiatorLengthMm, "radiatorLength", used);
    const wid = visualMm(a.radiatorWidthMm, "radiatorWidth", used);
    let rb: Box;
    if (frontAio) {
      const x0 = lengthLimit?.basis === "radiator" && limits.gpuLengthX !== undefined ? limits.gpuLengthX : frontX - t;
      const yTop = topY - FRONT_COOLING_TOP_GAP_MM;
      rb = box(x0, x0 + t, yTop - len, yTop, midZ - wid / 2, midZ + wid / 2);
      obstacles.push(rb);
    } else {
      const x0 = TOP_RADIATOR_REAR_GAP_MM;
      rb = box(x0, x0 + len, topY - t, topY, midZ - wid / 2, midZ + wid / 2);
    }
    parts.radiator = rb;
    items.push({ id: "radiator", kind: "radiator", box: rb, status: worstOf(results, ["R08"]) });
    const p = PUMP_HEAD_MM;
    items.push({
      id: "pump",
      kind: "pump",
      box: box(socketX - p.size / 2, socketX + p.size / 2, socketY - p.size / 2, socketY + p.size / 2, frontZ, frontZ + p.thickness),
      status: worstOf(results, ["R14"]),
    });
  }
  const frontFan = c.includedFans?.front;
  if (frontFan && !frontAio) {
    const t = frontFan.thicknessMm ?? DEFAULT_FAN_THICKNESS_MM;
    const x0 = lengthLimit?.basis === "fan" && limits.gpuLengthX !== undefined ? limits.gpuLengthX : frontX - t;
    const yTop = topY - FRONT_COOLING_TOP_GAP_MM;
    for (let i = 0; i < frontFan.count; i++) {
      const s = frontFan.sizeMm;
      const b = box(x0, x0 + t, yTop - (i + 1) * s, yTop - i * s, midZ - s / 2, midZ + s / 2);
      parts.frontFans.push(b);
      obstacles.push(b);
      items.push({ id: `front-fan-${i}`, kind: "caseFan", box: b });
    }
  }

  // 顯卡
  let orientation: "horizontal" | "vertical" = c.gpuMountOrientation === "vertical" ? "vertical" : "horizontal";
  if (gpu) {
    const L = visualMm(overrides.gpuLengthMm ?? gpu.lengthMm, "gpuLength", used);
    const H = visualMm(gpu.heightMm, "gpuHeight", used);
    const T = visualMm(overrides.gpuThicknessMm ?? gpu.thicknessMm, "gpuThickness", used);
    // 官方沒寫安裝方向、橫插又會超出機殼底面（例如 Terra 的 riser 三明治結構）→ 以直立示意
    if (orientation === "horizontal" && c.gpuMountOrientation === undefined && slotY - T < 0) {
      orientation = "vertical";
      used.add("gpuMount");
    }
    const n = L > 285 ? 3 : 2;
    const seg = L / n;
    const fanSize = Math.min(seg * 0.85, H * 0.8);
    const fans: Box[] = [];
    let gb: Box;
    if (orientation === "horizontal") {
      // PCB 與主機板垂直：長 → x（擋板 x=0）、厚 → y（由插槽往下）、高 → z（由主機板往玻璃），風扇朝下
      gb = box(0, L, slotY - T, slotY, frontZ, frontZ + H);
      const zc = frontZ + H / 2;
      for (let i = 0; i < n; i++) {
        const xc = seg * (i + 0.5);
        fans.push(box(xc - fanSize / 2, xc + fanSize / 2, slotY - T - 1, slotY - T, zc - fanSize / 2, zc + fanSize / 2));
      }
    } else {
      // 直立：大平面朝玻璃。長 → x、高 → y（由電源倉頂往上）、厚 → z（由示意支架面往玻璃），風扇朝玻璃
      const y0 = (itxOnly ? 0 : PSU_SHROUD_HEIGHT_MM) + VERTICAL_GPU_BOTTOM_GAP_MM;
      gb = box(0, L, y0, y0 + H, VERTICAL_GPU_Z_MM, VERTICAL_GPU_Z_MM + T);
      const yc = y0 + H / 2;
      for (let i = 0; i < n; i++) {
        const xc = seg * (i + 0.5);
        fans.push(box(xc - fanSize / 2, xc + fanSize / 2, yc - fanSize / 2, yc + fanSize / 2, gb.max[2], gb.max[2] + 1));
      }
    }
    parts.gpu = gb;
    items.push({ id: "gpu", kind: "gpu", box: gb, status: worstOf(results, ["R02", "R03", "R04"]) });
    fans.forEach((b, i) => items.push({ id: `gpu-fan-${i}`, kind: "gpuFan", box: b }));

    if (limits.gpuLengthX !== undefined) {
      const lx = limits.gpuLengthX;
      items.push({
        id: "limit-gpu-length",
        kind: "limit",
        label: "顯卡長度上限",
        box: box(lx, lx + 1, gb.min[1] - 10, gb.max[1] + 10, gb.min[2], gb.max[2]),
      });
      if (gb.max[0] > lx)
        items.push({ id: "conflict-gpu-length", kind: "conflict", box: box(lx, gb.max[0], gb.min[1], gb.max[1], gb.min[2], gb.max[2]) });
    }
    obstacles.forEach((o, i) => {
      const hit = intersect(gb, o);
      if (hit) items.push({ id: `conflict-gpu-front-${i}`, kind: "conflict", box: hit });
    });
    const hLimit = gpuHeightLimitMm(selection);
    if (hLimit !== undefined && orientation === "horizontal") {
      const hz = frontZ + hLimit;
      limits.gpuHeightZ = hz;
      items.push({ id: "limit-gpu-height", kind: "limit", label: "顯卡高度上限", box: box(gb.min[0], gb.max[0], gb.min[1], gb.max[1], hz, hz + 1) });
      if (gb.max[2] > hz)
        items.push({ id: "conflict-gpu-height", kind: "conflict", box: box(gb.min[0], gb.max[0], gb.min[1], gb.max[1], hz, gb.max[2]) });
    }
  }

  // 塔散：底座在 CPU 插槽上，高度往玻璃
  if (cooler.kind === "air") {
    const a = cooler.cooler;
    const h = visualMm(overrides.cpuCoolerHeightMm ?? a.heightMm, "coolerHeight", used);
    const d = visualMm(a.depthMm, "coolerDepth", used);
    const w = visualMm(a.widthMm, "coolerWidth", used);
    const cb = box(socketX - d / 2, socketX + d / 2, socketY - w / 2, socketY + w / 2, frontZ, frontZ + h);
    parts.cooler = cb;
    items.push({ id: "cooler", kind: "cooler", box: cb, status: worstOf(results, ["R05", "R06", "R14"]) });
    const lim = coolerHeightLimitMm(selection);
    if (lim !== undefined) {
      const lz = frontZ + lim;
      limits.coolerTopZ = lz;
      items.push({
        id: "limit-cooler",
        kind: "limit",
        label: "塔散高度上限",
        box: box(cb.min[0] - 10, cb.max[0] + 10, cb.min[1] - 10, cb.max[1] + 10, lz, lz + 1),
      });
      if (cb.max[2] > lz)
        items.push({ id: "conflict-cooler", kind: "conflict", box: box(cb.min[0], cb.max[0], cb.min[1], cb.max[1], lz, cb.max[2]) });
    }
  }

  // 電源：一般機殼放電源倉內，由後方內壁往前；只支援 ITX 的機殼放前上方，由前面板內側往後（示意）
  if (psu) {
    const len = visualMm(overrides.psuLengthMm ?? psu.lengthMm, "psuLength", used);
    const form = PSU_FORM_MM[psu.formFactor];
    const dir = itxOnly ? -1 : 1; // 長度延伸方向
    const start = itxOnly ? frontX : 0; // 電源接線端的對面（長度量測起點）
    const y0 = itxOnly ? topY - form.heightMm : 0;
    const pb = box(start, start + dir * len, y0, y0 + form.heightMm, midZ - form.widthMm / 2, midZ + form.widthMm / 2);
    parts.psu = pb;
    items.push({ id: "psu", kind: "psu", box: pb, status: worstOf(results, ["R10", "R15", "R33"]) });
    const lim = psuLengthLimitMm(selection);
    if (lim !== undefined) {
      const lx = start + dir * lim;
      limits.psuFrontX = lx;
      limits.psuLengthFromStart = lim;
      items.push({ id: "limit-psu", kind: "limit", label: "電源長度上限", box: box(lx, lx + dir, y0 - 5, y0 + form.heightMm + 5, pb.min[2], pb.max[2]) });
      if (len > lim)
        items.push({ id: "conflict-psu", kind: "conflict", box: box(lx, start + dir * len, pb.min[1], pb.max[1], pb.min[2], pb.max[2]) });
    }
    limits.psuEndX = start + dir * len;
    limits.psuStartX = start;
  }

  return {
    shell,
    interior,
    boardAnchor: { x: ax, y: ay },
    boardFrontZ: frontZ,
    gpuOrientation: orientation,
    limits,
    parts,
    items,
    fallbacks: [...used],
    bounds: union(items.map((i) => i.box)),
  };
}

/** 繪圖用到視覺預設尺寸的項目 */
export function collectFallbacks(selection: BuildSelection, results: CompatibilityResult[] = []): FallbackKey[] {
  return computeLayout(selection, results)?.fallbacks ?? [];
}
