import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#f6f7f5] px-4 py-12 text-center">
      <div className="max-w-md rounded-xl border border-[#d6ddd8] bg-white p-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#0f766e]">404</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Halaman tidak ditemukan</h1>
        <p className="mt-2 text-sm text-slate-600">
          Tautan yang Anda buka tidak tersedia di workspace EcoRoute SBY.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#0f766e] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#115e59]"
        >
          Kembali ke Peta Utama
        </Link>
      </div>
    </main>
  );
}
