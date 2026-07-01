export function CablePlanningSuggestions({ suggestions }: { suggestions: string[] }) {
  return (
    <div className="rounded-xl border border-white/10 bg-bg-panel p-4">
      <h2 className="mb-3 text-sm font-bold">Cable Planning Suggestions 走線建議</h2>
      {suggestions.length === 0 ? (
        <p className="text-sm text-white/40">目前沒有特別的走線注意事項。</p>
      ) : (
        <ul className="space-y-2">
          {suggestions.map((s, i) => (
            <li key={i} className="flex gap-2 text-sm text-white/70">
              <span className="text-accent-cyan">›</span>
              <span>{s}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
