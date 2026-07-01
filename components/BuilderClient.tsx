"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { BuildSelection } from "@/types/parts";
import { buildCablePlanningSuggestions, evaluateBuild } from "@/lib/compatibility";
import { PartPicker } from "./PartPicker";
import { FitPreview2D } from "./FitPreview2D";
import { CompatibilityReport } from "./CompatibilityReport";
import { CablePlanningSuggestions } from "./CablePlanningSuggestions";

const FitPreview3D = dynamic(() => import("./FitPreview3D").then((m) => m.FitPreview3D), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center rounded-xl border border-white/10 bg-bg-panel text-sm text-white/40">
      3D 場景載入中…
    </div>
  ),
});

const INITIAL_SELECTION: BuildSelection = {
  cooler: { kind: "none" },
  overrides: {},
};

type ViewMode = "3d" | "2d";

export function BuilderClient() {
  const [selection, setSelection] = useState<BuildSelection>(INITIAL_SELECTION);
  const [viewMode, setViewMode] = useState<ViewMode>("3d");

  const results = useMemo(() => evaluateBuild(selection), [selection]);
  const suggestions = useMemo(
    () => buildCablePlanningSuggestions(selection, results),
    [selection, results]
  );

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-3" style={{ minHeight: 500 }}>
          <PartPicker selection={selection} setSelection={setSelection} />
        </div>
        <div className="flex flex-col lg:col-span-6" style={{ height: 500 }}>
          <div className="mb-2 flex shrink-0 justify-end gap-2 text-xs">
            {(["3d", "2d"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`rounded px-3 py-1 font-semibold ${
                  viewMode === mode ? "bg-accent text-bg" : "bg-white/5 text-white/60"
                }`}
              >
                {mode === "3d" ? "3D 視圖" : "2D 示意圖"}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1">
            {viewMode === "3d" ? (
              <FitPreview3D selection={selection} results={results} />
            ) : (
              <FitPreview2D selection={selection} results={results} />
            )}
          </div>
        </div>
        <div className="lg:col-span-3" style={{ minHeight: 500 }}>
          <CompatibilityReport results={results} />
        </div>
      </div>
      <div className="mt-4">
        <CablePlanningSuggestions suggestions={suggestions} />
      </div>
    </div>
  );
}
