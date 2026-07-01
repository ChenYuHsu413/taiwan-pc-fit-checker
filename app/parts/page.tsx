import type { Metadata } from "next";
import {
  mockAioCoolers,
  mockCases,
  mockCpuCoolers,
  mockGpus,
  mockMotherboards,
  mockPsus,
} from "@/data/taiwanMockParts";
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
        本頁為本地 mock data，價格為參考價，實際貨況與價格請以通路現場公告為準。第一版已完整支援機殼／主機板／顯示卡／散熱器／電源，其餘分類將於後續版本擴充。
      </p>

      <CategorySection title="機殼 Case" parts={mockCases} />
      <CategorySection title="主機板 MB" parts={mockMotherboards} />
      <CategorySection title="顯示卡 GPU" parts={mockGpus} />
      <CategorySection title="CPU 散熱器（空冷）" parts={mockCpuCoolers} />
      <CategorySection title="水冷散熱器 AIO" parts={mockAioCoolers} />
      <CategorySection title="電源供應器 PSU" parts={mockPsus} />
      <CategorySection title="CPU 處理器" parts={[]} />
      <CategorySection title="記憶體 RAM" parts={[]} />
      <CategorySection title="SSD / HDD" parts={[]} />
    </main>
  );
}
