import type { CompatibilityReportData, CompatibilityResult, CompatibilityStatus } from "@/types/parts";
import { RULES, TIGHT_NOT_IMPLEMENTED_REASON, type RuleGroup } from "@/lib/compatibility/rules";
import { STATUS_LABEL } from "@/lib/compatibility/messages";

const STATUS_STYLE: Record<CompatibilityStatus, string> = {
  safe: "border-status-safe/40 bg-status-safe/10 text-status-safe",
  info: "border-status-info/40 bg-status-info/10 text-status-info",
  tight: "border-status-tight/40 bg-status-tight/10 text-status-tight",
  warning: "border-status-warning/40 bg-status-warning/10 text-status-warning",
  incompatible: "border-status-incompatible/40 bg-status-incompatible/10 text-status-incompatible",
  unknown: "border-status-unknown/40 bg-status-unknown/10 text-status-unknown",
};

const GROUPS: { group: RuleGroup; title: string }[] = [
  { group: "spatial", title: "空間 Spatial" },
  { group: "platform", title: "平台 Platform" },
];

function ResultCard({ r }: { r: CompatibilityResult }) {
  return (
    <div className={`rounded-lg border p-3 ${STATUS_STYLE[r.status]}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-white">{RULES[r.ruleId].title}</p>
        <span className="whitespace-nowrap rounded-full bg-black/30 px-2 py-0.5 text-[10px] font-bold">
          {STATUS_LABEL[r.status]}
        </span>
      </div>
      <p className="mt-1 text-xs text-white/70">{r.message}</p>
      {r.conditions?.map((c, i) => (
        <p key={i} className="mt-1 text-xs text-white/50">
          ・{c}
        </p>
      ))}
      {r.suggestion && <p className="mt-1 text-xs text-white/50">建議：{r.suggestion}</p>}
      {r.link && (
        <a
          href={r.link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-block text-xs text-accent-cyan underline"
        >
          {r.link.label}
        </a>
      )}
    </div>
  );
}

export function CompatibilityReport({ report }: { report: CompatibilityReportData }) {
  const { results, unchecked } = report;
  return (
    <div className="h-full overflow-y-auto rounded-xl border border-white/10 bg-bg-panel p-4">
      <h2 className="mb-4 text-sm font-bold">Compatibility Report 相容性報告</h2>

      {results.length === 0 ? (
        <p className="text-sm text-white/40">請選擇零件以產生報告。</p>
      ) : (
        GROUPS.map(({ group, title }) => {
          const list = results.filter((r) => RULES[r.ruleId].group === group);
          if (list.length === 0) return null;
          return (
            <section key={group} className="mb-4">
              <h3 className="mb-2 text-xs font-bold text-white/60">{title}</h3>
              <div className="space-y-3">
                {list.map((r) => (
                  <ResultCard key={r.ruleId} r={r} />
                ))}
              </div>
            </section>
          );
        })
      )}

      <section className="mt-6 border-t border-white/10 pt-4">
        <h3 className="mb-2 text-xs font-bold text-white/60">尚未檢查的項目</h3>
        <p className="mb-2 text-[11px] text-white/40">
          以下項目沒有可靠的官方數據或門檻，本工具不做判斷，請自行確認。
        </p>
        <ul className="space-y-2">
          {unchecked.map((u) => (
            <li key={u.ruleId} className="text-xs text-white/60">
              <span className="font-semibold text-white/80">{RULES[u.ruleId].title}</span>：{u.reason}
            </li>
          ))}
          <li className="text-xs text-white/60">
            <span className="font-semibold text-white/80">緊繃程度 Tight</span>：{TIGHT_NOT_IMPLEMENTED_REASON}
          </li>
        </ul>
      </section>
    </div>
  );
}
