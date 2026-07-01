import type { CompatibilityResult, CompatibilityStatus } from "@/types/parts";

const STATUS_LABEL: Record<CompatibilityStatus, string> = {
  safe: "Safe 安全",
  tight: "Tight 緊繃",
  warning: "Warning 注意",
  incompatible: "Incompatible 不相容",
};

const STATUS_STYLE: Record<CompatibilityStatus, string> = {
  safe: "border-status-safe/40 bg-status-safe/10 text-status-safe",
  tight: "border-status-tight/40 bg-status-tight/10 text-status-tight",
  warning: "border-status-warning/40 bg-status-warning/10 text-status-warning",
  incompatible: "border-status-incompatible/40 bg-status-incompatible/10 text-status-incompatible",
};

export function CompatibilityReport({ results }: { results: CompatibilityResult[] }) {
  return (
    <div className="h-full overflow-y-auto rounded-xl border border-white/10 bg-bg-panel p-4">
      <h2 className="mb-4 text-sm font-bold">Compatibility Report 相容性報告</h2>

      {results.length === 0 ? (
        <p className="text-sm text-white/40">請選擇零件以產生報告。</p>
      ) : (
        <div className="space-y-3">
          {results.map((r, i) => (
            <div key={i} className={`rounded-lg border p-3 ${STATUS_STYLE[r.status]}`}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-white">{r.item}</p>
                <span className="whitespace-nowrap rounded-full bg-black/30 px-2 py-0.5 text-[10px] font-bold">
                  {STATUS_LABEL[r.status]}
                </span>
              </div>
              <p className="mt-1 text-xs text-white/70">{r.message}</p>
              {r.suggestion && <p className="mt-1 text-xs text-white/50">建議：{r.suggestion}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
