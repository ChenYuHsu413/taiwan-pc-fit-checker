import Link from "next/link";

const FEATURES = [
  {
    title: "GPU Clearance",
    subtitle: "顯卡長度空間",
    desc: "比對顯卡長度與機殼可用空間，提前發現裝不下的問題。",
  },
  {
    title: "CPU Cooler Height",
    subtitle: "塔散高度檢查",
    desc: "確認空冷塔散高度是否會頂到側板玻璃或鋼板。",
  },
  {
    title: "Front Radiator Conflict",
    subtitle: "前置水冷與顯卡衝突",
    desc: "水冷排＋風扇厚度會吃掉顯卡安裝空間，提前試算剩餘長度。",
  },
  {
    title: "PSU Length",
    subtitle: "電源供應器長度",
    desc: "確認電源艙深度是否足夠，避免撞到前置風扇或硬碟架。",
  },
  {
    title: "Cable Management Space",
    subtitle: "背板走線空間",
    desc: "檢查背板走線空間是否足夠蓋上側板，並提醒理線注意事項。",
  },
  {
    title: "12VHPWR / 12V-2x6",
    subtitle: "顯卡供電線彎折空間",
    desc: "新款顯卡供電線材彎折半徑要求較高，提醒側板保留空間。",
  },
];

export default function HomePage() {
  return (
    <main>
      <section className="mx-auto max-w-5xl px-6 pb-16 pt-24 text-center">
        <p className="mb-4 text-sm font-medium uppercase tracking-[0.3em] text-accent-cyan">
          Build before you build.
        </p>
        <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
          台灣版 PC 組裝空間模擬器
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-white/70">
          先檢查顯卡、塔散、水冷、機殼與走線空間，再決定怎麼裝。
        </p>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-white/40">
          本工具提供參考級空間檢查，資料為簡化尺寸與參考價格，實際組裝仍建議以官方規格與現場丈量為準。
        </p>
        <div className="mt-10">
          <Link
            href="/builder"
            className="inline-block rounded-lg bg-accent px-8 py-3 font-semibold text-bg transition hover:opacity-90"
          >
            Start Building 開始檢查
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <h2 className="mb-8 text-center text-sm font-semibold uppercase tracking-[0.2em] text-white/40">
          這個工具可以幫你檢查
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-white/10 bg-bg-card p-6 transition hover:border-accent/40"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-accent-cyan">{f.title}</p>
              <h3 className="mt-2 text-lg font-bold">{f.subtitle}</h3>
              <p className="mt-2 text-sm text-white/60">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 pb-24">
        <div className="rounded-xl border border-white/10 bg-bg-panel p-8">
          <h2 className="text-lg font-bold">關於資料來源</h2>
          <p className="mt-3 text-sm leading-relaxed text-white/60">
            本工具第一版使用本地 mock data／參考級尺寸資料，不含即時爬蟲。所有價格皆標示為「參考價」並附上
            <span className="text-white/80">updatedAt</span> 更新時間與資料來源（例如原價屋參考、品牌官網、手動輸入）。
            實際價格與貨況請以通路現場公告為準。
          </p>
        </div>
      </section>
    </main>
  );
}
