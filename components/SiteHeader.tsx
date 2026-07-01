import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-bg/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-wide">
          <span className="text-accent">◆</span>
          <span>
            台灣版 PC 組裝空間模擬器
            <span className="ml-2 text-xs font-normal text-white/40">Fit Checker</span>
          </span>
        </Link>
        <nav className="flex items-center gap-6 text-sm text-white/70">
          <Link href="/builder" className="hover:text-accent">
            Builder
          </Link>
          <Link href="/parts" className="hover:text-accent">
            零件資料庫
          </Link>
        </nav>
      </div>
    </header>
  );
}
