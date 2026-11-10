import type { AnyPart } from "@/types/parts";
import { getPrice, isPriceStale } from "@/lib/data/catalog";
import { defaultMm } from "@/lib/data/conditional";

const mm = (v: number | undefined) => (v === undefined ? "—" : `${v}mm`);

const MODULAR_LABEL = { non: "非模組化", semi: "半模組化", full: "全模組化" } as const;

function summarizeDimensions(part: AnyPart): string {
  switch (part.category) {
    case "case":
      return `顯卡上限 ${mm(part.gpuLength.unspecifiedMm ?? part.gpuLength.noFrontMm)}／塔散上限 ${mm(defaultMm(part.cpuCoolerHeightLimits))}／電源上限 ${mm(defaultMm(part.psu.lengthLimits))}／走線空間 ${mm(part.cableSpaceMm)}`;
    case "motherboard":
      return `${part.formFactor}／${part.dimensions.heightMm ?? "—"}×${part.dimensions.depthMm ?? "—"}mm／${part.socket}／${part.chipset}／${part.memoryType ?? "記憶體類型未確認"}`;
    case "cpu":
      return `${part.socket}／${part.hasIntegratedGraphics === undefined ? "內顯未確認" : part.hasIntegratedGraphics ? "有內顯" : "無內顯"}／${part.memoryTypes?.join("、") ?? "—"}`;
    case "ram":
      return `${part.memoryType}-${part.speedMts}／${part.moduleCapacityGb}GB × ${part.moduleCount}／高 ${mm(part.moduleHeightMm)}`;
    case "gpu":
      return `長 ${mm(part.lengthMm)}／厚 ${mm(part.thicknessMm)}（${part.slotWidth ?? "—"} 槽）／${part.powerConnectors?.map((c) => `${c.type} x${c.count}`).join(" + ") ?? "—"}`;
    case "airCooler":
      return `高 ${mm(part.heightMm)}／寬 ${mm(part.widthMm)}／記憶體淨空 ${mm(part.ramClearance?.defaultMm)}`;
    case "aio": {
      const total =
        part.radiatorThicknessMm !== undefined && part.fanThicknessMm !== undefined
          ? part.radiatorThicknessMm + part.fanThicknessMm
          : undefined;
      return `${part.radiatorSize}mm 水冷排／厚度 ${mm(total)}（含風扇）`;
    }
    case "psu":
      return `${part.formFactor}／長 ${mm(part.lengthMm)}／${part.modularType ? MODULAR_LABEL[part.modularType] : "—"}／${part.wattage}W`;
    case "m2Ssd":
      return `${part.formFactor}／${part.interface.kind === "pcie" ? part.interface.modes.map((m) => `PCIe ${m.gen}.0 x${m.lanes}`).join(" / ") : "SATA"}／${part.hasHeatsink === undefined ? "散熱片未確認" : part.hasHeatsink ? "附散熱片" : "無散熱片"}`;
  }
}

export function PriceTag({ partId }: { partId: string }) {
  const price = getPrice(partId);
  if (!price) return <span className="whitespace-nowrap text-xs text-white/30">無參考價</span>;
  return (
    <span className="whitespace-nowrap text-right">
      <span className="block text-sm font-bold text-accent-cyan">NT$ {price.priceTwd.toLocaleString("zh-TW")}</span>
      {isPriceStale(price.updatedAt) && (
        <span className="block text-[10px] text-status-tight">可能過時（{price.updatedAt}）</span>
      )}
    </span>
  );
}

export function PartCard({
  part,
  selected,
  onClick,
}: {
  part: AnyPart;
  selected?: boolean;
  onClick?: () => void;
}) {
  const Wrapper = onClick ? "button" : "div";
  const price = getPrice(part.id);

  return (
    <Wrapper
      onClick={onClick}
      className={`w-full rounded-lg border p-3 text-left transition ${
        selected
          ? "border-accent bg-accent/10"
          : "border-white/10 bg-bg-card hover:border-white/30"
      } ${onClick ? "cursor-pointer" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs text-white/50">
            {part.brand} · {part.model}
          </p>
          <p className="text-sm font-semibold">{part.twName}</p>
        </div>
        <PriceTag partId={part.id} />
      </div>
      <p className="mt-2 text-xs text-white/60">{summarizeDimensions(part)}</p>
      {part.notes && <p className="mt-1 text-xs text-status-warning">⚠ {part.notes}</p>}
      <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-white/30">
        <span>
          {part.sourceUrl ? (
            <a href={part.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-white/60">
              官方規格頁
            </a>
          ) : (
            "尚無官方規格來源（mock）"
          )}
          {part.specVerifiedAt ? `・規格驗證 ${part.specVerifiedAt}` : "・規格未驗證"}
        </span>
        {price && <span>價格更新 {price.updatedAt}</span>}
      </div>
    </Wrapper>
  );
}
