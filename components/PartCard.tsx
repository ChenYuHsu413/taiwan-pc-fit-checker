import type { AnyPart } from "@/types/parts";

function summarizeDimensions(part: AnyPart): string {
  switch (part.category) {
    case "case":
      return `顯卡上限 ${part.maxGpuLengthMm}mm／塔散上限 ${part.maxCpuCoolerHeightMm}mm／電源上限 ${part.maxPsuLengthMm}mm／走線空間 ${part.cableManagementSpaceMm}mm`;
    case "motherboard":
      return `${part.formFactor}／${part.widthMm}×${part.heightMm}mm／${part.socket}／${part.chipset}`;
    case "gpu":
      return `長 ${part.lengthMm}mm／厚 ${part.thicknessMm}mm（${part.slotCount} 槽）／${part.powerConnectorType}`;
    case "cpuCooler":
      return `高 ${part.heightMm}mm／寬 ${part.widthMm}mm／記憶體淨空 ${part.ramClearanceMm}mm`;
    case "aioCooler":
      return `${part.radiatorSizeMm}mm 水冷排／厚度 ${part.totalThicknessMm}mm（含風扇）`;
    case "psu":
      return `${part.psuFormFactor}／長 ${part.lengthMm}mm／${part.modularType}／${part.wattage}W`;
    default:
      return "";
  }
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
        <p className="whitespace-nowrap text-sm font-bold text-accent-cyan">
          NT$ {part.priceTwd.toLocaleString("zh-TW")}
        </p>
      </div>
      <p className="mt-2 text-xs text-white/60">{summarizeDimensions(part)}</p>
      {part.notes && <p className="mt-1 text-xs text-status-warning">⚠ {part.notes}</p>}
      <div className="mt-2 flex items-center justify-between text-[11px] text-white/30">
        <span>
          來源：{part.sourceName}
          {part.sourceUrl ? "（參考連結）" : ""}
        </span>
        <span>更新於 {part.updatedAt}</span>
      </div>
    </Wrapper>
  );
}
