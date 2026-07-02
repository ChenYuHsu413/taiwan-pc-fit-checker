import type { Dispatch, SetStateAction } from "react";
import {
  mockAioCoolers,
  mockCases,
  mockCpuCoolers,
  mockGpus,
  mockMotherboards,
  mockPsus,
} from "@/data/taiwanMockParts";
import type { AnyPart, BuildSelection, DimensionOverrides } from "@/types/parts";
import { PartCard } from "./PartCard";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-white/40">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function PartDetails({ part }: { part: AnyPart }) {
  return (
    <details className="group">
      <summary className="cursor-pointer list-none text-[11px] text-white/40 hover:text-white/70">
        <span className="group-open:hidden">▸ 詳細資訊</span>
        <span className="hidden group-open:inline">▾ 收合資訊</span>
      </summary>
      <div className="mt-1">
        <PartCard part={part} />
      </div>
    </details>
  );
}

function PartSelect<T extends AnyPart>({
  parts,
  selectedId,
  placeholder,
  onSelect,
}: {
  parts: T[];
  selectedId?: string;
  placeholder: string;
  onSelect: (part: T) => void;
}) {
  return (
    <select
      value={selectedId ?? ""}
      onChange={(e) => {
        const part = parts.find((p) => p.id === e.target.value);
        if (part) onSelect(part);
      }}
      className="w-full rounded border border-white/10 bg-bg px-2 py-2 text-sm text-white"
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {parts.map((p) => (
        <option key={p.id} value={p.id}>
          {p.brand} · {p.model}（NT$ {p.priceTwd.toLocaleString("zh-TW")}）
        </option>
      ))}
    </select>
  );
}

function OverrideInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-2 text-xs text-white/60">
      <span>{label}</span>
      <input
        type="number"
        value={value ?? ""}
        placeholder="—"
        onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
        className="w-20 rounded border border-white/10 bg-bg px-2 py-1 text-right text-white"
      />
    </label>
  );
}

export function PartPicker({
  selection,
  setSelection,
}: {
  selection: BuildSelection;
  setSelection: Dispatch<SetStateAction<BuildSelection>>;
}) {
  const updateOverride = (key: keyof DimensionOverrides, value: number | undefined) => {
    setSelection((prev) => ({ ...prev, overrides: { ...prev.overrides, [key]: value } }));
  };

  const totalTwd = [
    selection.case,
    selection.motherboard,
    selection.gpu,
    selection.cooler.kind === "none" ? undefined : selection.cooler.cooler,
    selection.psu,
  ].reduce((sum, part) => sum + (part?.priceTwd ?? 0), 0);

  return (
    <div className="h-full overflow-y-auto rounded-xl border border-white/10 bg-bg-panel p-4">
      <h2 className="mb-4 text-sm font-bold">Part Picker 零件選擇</h2>

      <Section title="機殼 Case">
        <PartSelect
          parts={mockCases}
          selectedId={selection.case?.id}
          placeholder="請選擇機殼"
          onSelect={(c) => setSelection((prev) => ({ ...prev, case: c }))}
        />
        {selection.case && <PartDetails part={selection.case} />}
      </Section>

      <Section title="主機板 Motherboard">
        <PartSelect
          parts={mockMotherboards}
          selectedId={selection.motherboard?.id}
          placeholder="請選擇主機板"
          onSelect={(m) => setSelection((prev) => ({ ...prev, motherboard: m }))}
        />
        {selection.motherboard && <PartDetails part={selection.motherboard} />}
      </Section>

      <Section title="顯示卡 GPU">
        <PartSelect
          parts={mockGpus}
          selectedId={selection.gpu?.id}
          placeholder="請選擇顯示卡"
          onSelect={(g) => setSelection((prev) => ({ ...prev, gpu: g }))}
        />
        {selection.gpu && <PartDetails part={selection.gpu} />}
      </Section>

      <Section title="散熱器 CPU Cooler">
        <select
          value={selection.cooler.kind}
          onChange={(e) => {
            const kind = e.target.value as "none" | "air" | "aio";
            setSelection((prev) => ({
              ...prev,
              cooler:
                kind === "none"
                  ? { kind: "none" }
                  : kind === "air"
                  ? { kind: "air", cooler: mockCpuCoolers[0] }
                  : { kind: "aio", cooler: mockAioCoolers[0], mountLocation: "front" },
            }));
          }}
          className="w-full rounded border border-white/10 bg-bg px-2 py-2 text-sm text-white"
        >
          <option value="none">尚未選擇</option>
          <option value="air">空冷 Air</option>
          <option value="aio">水冷 AIO</option>
        </select>

        {selection.cooler.kind === "air" && (
          <>
            <PartSelect
              parts={mockCpuCoolers}
              selectedId={selection.cooler.cooler.id}
              placeholder="請選擇空冷散熱器"
              onSelect={(c) => setSelection((prev) => ({ ...prev, cooler: { kind: "air", cooler: c } }))}
            />
            <PartDetails part={selection.cooler.cooler} />
          </>
        )}

        {selection.cooler.kind === "aio" &&
          (() => {
            const aioState = selection.cooler;
            return (
              <>
                <select
                  value={aioState.mountLocation}
                  onChange={(e) =>
                    setSelection((prev) =>
                      prev.cooler.kind === "aio"
                        ? { ...prev, cooler: { ...prev.cooler, mountLocation: e.target.value as "front" | "top" } }
                        : prev
                    )
                  }
                  className="w-full rounded border border-white/10 bg-bg px-2 py-2 text-sm text-white"
                >
                  <option value="front">前置 Front</option>
                  <option value="top">頂置 Top</option>
                </select>
                <PartSelect
                  parts={mockAioCoolers}
                  selectedId={aioState.cooler.id}
                  placeholder="請選擇水冷排"
                  onSelect={(c) =>
                    setSelection((prev) =>
                      prev.cooler.kind === "aio"
                        ? { ...prev, cooler: { ...prev.cooler, cooler: c } }
                        : { ...prev, cooler: { kind: "aio", cooler: c, mountLocation: "front" } }
                    )
                  }
                />
                <PartDetails part={aioState.cooler} />
              </>
            );
          })()}
      </Section>

      <Section title="電源供應器 PSU">
        <PartSelect
          parts={mockPsus}
          selectedId={selection.psu?.id}
          placeholder="請選擇電源供應器"
          onSelect={(p) => setSelection((prev) => ({ ...prev, psu: p }))}
        />
        {selection.psu && <PartDetails part={selection.psu} />}
      </Section>

      <details className="mb-4">
        <summary className="cursor-pointer list-none text-xs font-bold uppercase tracking-wide text-white/40 hover:text-white/70">
          ▸ 手動覆蓋尺寸 Manual Overrides（選填）
        </summary>
        <div className="mt-2 space-y-2">
        <OverrideInput
          label="GPU length (mm)"
          value={selection.overrides.gpuLengthMm}
          onChange={(v) => updateOverride("gpuLengthMm", v)}
        />
        <OverrideInput
          label="GPU thickness (mm)"
          value={selection.overrides.gpuThicknessMm}
          onChange={(v) => updateOverride("gpuThicknessMm", v)}
        />
        <OverrideInput
          label="CPU cooler height (mm)"
          value={selection.overrides.cpuCoolerHeightMm}
          onChange={(v) => updateOverride("cpuCoolerHeightMm", v)}
        />
        <OverrideInput
          label="Case max GPU length (mm)"
          value={selection.overrides.caseMaxGpuLengthMm}
          onChange={(v) => updateOverride("caseMaxGpuLengthMm", v)}
        />
        <OverrideInput
          label="Case max cooler height (mm)"
          value={selection.overrides.caseMaxCpuCoolerHeightMm}
          onChange={(v) => updateOverride("caseMaxCpuCoolerHeightMm", v)}
        />
        <OverrideInput
          label="Case cable space (mm)"
          value={selection.overrides.caseCableManagementSpaceMm}
          onChange={(v) => updateOverride("caseCableManagementSpaceMm", v)}
        />
        <OverrideInput
          label="PSU length (mm)"
          value={selection.overrides.psuLengthMm}
          onChange={(v) => updateOverride("psuLengthMm", v)}
        />
        </div>
      </details>

      <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-3">
        <span className="text-xs text-white/50">預估總價（參考價）</span>
        <span className="text-base font-bold text-accent-cyan">
          NT$ {totalTwd.toLocaleString("zh-TW")}
        </span>
      </div>
    </div>
  );
}
