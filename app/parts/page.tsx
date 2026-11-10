import type { Metadata } from "next";
import { catalog } from "@/lib/data/catalog";
import { PartCard } from "@/components/PartCard";
import type { AnyPart } from "@/types/parts";

export const metadata: Metadata = {
  title: "零件資料庫 | 台灣版 PC 組裝空間模擬器",
};

function CategorySection({
  title,
  parts,
}: {
  title: string;
  parts: AnyPart[];
}) {
  return (
    <section className="mb-10">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-white/50">{title}</h2>
      {parts.length === 0 ? (
        <p className="rounded-lg border border-white/10 bg-bg-card p-4 text-sm text-white/30">
          尚無資料，敬請期待後續版本。
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {parts.map((p) => (
            <PartCard key={p.id} part={p} />
          ))}
        </div>
      )}
    </section>
  );
}

export default function PartsPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="mb-2 text-2xl font-bold">零件資料庫 Local Parts Database</h1>
      <p className="mb-8 text-sm text-white/50">
        每筆零件附原廠官方規格來源與查證日期，官方未公開的欄位顯示「—」。目前沒有價格資料。實際規格與貨況請以原廠與通路公告為準。
      </p>

      <CategorySection title="機殼 Case" parts={catalog.case} />
      <CategorySection title="主機板 MB" parts={catalog.motherboard} />
      <CategorySection title="CPU 處理器" parts={catalog.cpu} />
      <CategorySection title="記憶體 RAM" parts={catalog.ram} />
      <CategorySection title="顯示卡 GPU" parts={catalog.gpu} />
      <CategorySection title="CPU 散熱器（空冷）" parts={catalog.airCooler} />
      <CategorySection title="水冷散熱器 AIO" parts={catalog.aio} />
      <CategorySection title="電源供應器 PSU" parts={catalog.psu} />
      <CategorySection title="M.2 SSD" parts={catalog.m2Ssd} />
    </main>
  );
}
