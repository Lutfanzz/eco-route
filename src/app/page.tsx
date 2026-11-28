'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import RouteControlPanel from '@/components/map/RouteControlPanel';
import { useEcoStore } from '@/store/useEcoStore';

const EcoMap = dynamic(() => import('@/components/map/EcoMap'), {
  ssr: false,
  loading: () => (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[400px] items-center justify-center rounded-xl border border-[#d6ddd8] bg-white text-sm font-medium text-slate-600 md:min-h-[520px] xl:min-h-[580px]"
    >
      Memuat peta koridor Surabaya...
    </div>
  ),
});

const toRadians = (deg: number) => (deg * Math.PI) / 180;

const distanceMeters = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const earthRadiusM = 6371000;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * earthRadiusM * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const LEGEND_ITEMS = [
  { label: 'Central Tong Aman (<50%)', swatchClass: 'rounded-full bg-[#15803d]' },
  { label: 'Central Tong Siaga (50-74%)', swatchClass: 'rounded-full bg-[#b45309]' },
  { label: 'Central Tong Penuh (>=75%)', swatchClass: 'rounded-full bg-[#b91c1c]' },
  { label: 'Gang Sempit Terlayani (150 m)', swatchClass: 'rounded-full border-2 border-[#0f766e] bg-[#14b8a6]/30' },
  { label: 'Gang Sempit Butuh Tong (150 m)', swatchClass: 'rounded-full border-2 border-[#c2410c] bg-[#fb923c]/30' },
  { label: 'TPS Penampungan', swatchClass: 'rounded bg-[#1d4ed8]' },
  { label: 'Pembeli Industri', swatchClass: 'rounded-full bg-[#6d28d9]' },
  { label: 'TPA Benowo', swatchClass: 'rounded bg-[#1e293b]' },
] as const;

export default function HomePage() {
  const nodes = useEcoStore((state) => state.nodes);
  const regularRoute = useEcoStore((state) => state.regularRoute);
  const ecoRoute = useEcoStore((state) => state.ecoRoute);
  const carbonSummary = useEcoStore((state) => state.carbonSummary);
  const isCityScaleMode = useEcoStore((state) => state.isCityScaleMode);
  const setCityScaleMode = useEcoStore((state) => state.setCityScaleMode);

  const stats = useMemo(() => {
    const centralBins = nodes.filter((n) => n.type === 'CENTRAL_BIN');
    const alleys = nodes.filter((n) => n.type === 'NARROW_ALLEY');
    const servedAlleys = alleys.filter((alley) =>
      centralBins.some(
        (bin) => distanceMeters(alley.lat, alley.lng, bin.lat, bin.lng) <= (alley.alleyRadiusMeter ?? 150)
      )
    ).length;

    const redNodes = nodes.filter(
      (n) => (n.type === 'CENTRAL_BIN' || n.type === 'TPS') && n.fillPercentage >= 75
    );
    const redPayloadKg = redNodes.reduce((sum, n) => sum + n.currentLoadKg, 0);

    return {
      totalAlleys: alleys.length,
      servedAlleys,
      redCount: redNodes.length,
      redPayloadKg,
    };
  }, [nodes]);

  const scaleFactor = isCityScaleMode ? 12.6 : 1;
  const hasRoutes = Boolean(regularRoute && ecoRoute);
  const savedEmissionKg = carbonSummary.truckEmissionSavedKg * scaleFactor;
  const savedFuelLiter =
    regularRoute && ecoRoute
      ? Math.max(0, (regularRoute.fuelConsumedLiter - ecoRoute.fuelConsumedLiter) * scaleFactor)
      : 0;

  return (
    <>
      <a href="#main-content" className="skip-link">
        Langsung ke konten utama
      </a>

      <div className="flex min-h-screen flex-col bg-[#f6f7f5]">
        <header className="border-b border-[#d6ddd8] bg-white">
          <div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 28 28"
                  fill="none"
                  className="h-7 w-7 shrink-0"
                >
                  <rect width="28" height="28" rx="7" fill="#0f766e" />
                  <path
                    d="M8 19.5C8 15.5 11.5 14 14.5 11.5C16.5 9.8 18 8.5 19.5 8.5"
                    stroke="#ffffff"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                  <circle cx="8" cy="19.5" r="2.2" fill="#ffffff" />
                  <circle cx="19.5" cy="8.5" r="2.2" fill="#fb923c" />
                </svg>
                <span className="text-sm font-bold tracking-tight text-[#0f766e]">EcoRoute SBY</span>
              </div>
              <h1 className="mt-1.5 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                Perencanaan Infrastruktur &amp; Eco-Routing Sampah
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-slate-600">
                Koridor Keputih, Sukolilo, dan Rungkut SIER menuju TPA Benowo dengan cakupan gang sempit 150 meter.
              </p>
            </div>

            <div className="flex shrink-0 items-center">
              <button
                type="button"
                role="switch"
                aria-checked={isCityScaleMode}
                onClick={() => setCityScaleMode(!isCityScaleMode)}
                className={`inline-flex min-h-[44px] items-center gap-3 rounded-lg border px-4 py-2 text-left text-sm transition-colors ${
                  isCityScaleMode
                    ? 'border-[#0f766e] bg-[#f0fdfa] text-[#115e59]'
                    : 'border-[#d6ddd8] bg-[#f6f7f5] text-slate-800 hover:bg-[#eef1ee]'
                }`}
              >
                <span className="font-semibold">Proyeksi Skala Kota (189 TPS)</span>
                <span
                  className={`rounded-md px-2 py-0.5 text-xs font-bold ${
                    isCityScaleMode
                      ? 'bg-[#0f766e] text-white'
                      : 'border border-[#d6ddd8] bg-white text-slate-700'
                  }`}
                >
                  {isCityScaleMode ? '12,6x Aktif' : 'Pilot 1x'}
                </span>
              </button>
            </div>
          </div>
        </header>

        <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <section
            aria-label="Ringkasan operasional koridor"
            className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3"
          >
            <div className="rounded-xl border border-[#d6ddd8] bg-white px-4 py-3.5">
              <p className="text-xs font-semibold text-slate-600">Cakupan Gang Sempit (150 m)</p>
              <p className="mt-1 text-xl font-bold text-slate-900">
                {stats.servedAlleys} / {stats.totalAlleys}{' '}
                <span className="text-sm font-medium text-slate-600">area terlayani</span>
              </p>
            </div>

            <div className="rounded-xl border border-[#d6ddd8] bg-white px-4 py-3.5">
              <p className="text-xs font-semibold text-slate-600">
                Titik Prioritas Merah (&ge;75%)
              </p>
              <p className="mt-1 text-xl font-bold text-slate-900">
                {isCityScaleMode
                  ? `${Math.round(stats.redCount * scaleFactor)} titik`
                  : `${stats.redCount} titik`}{' '}
                <span className="text-sm font-medium text-slate-600">
                  ({Math.round(stats.redPayloadKg * scaleFactor).toLocaleString('id-ID')} kg)
                </span>
              </p>
            </div>

            <div className="rounded-xl border border-[#d6ddd8] bg-white px-4 py-3.5">
              <p className="text-xs font-semibold text-slate-600">Penghematan Emisi Truk</p>
              {hasRoutes ? (
                <p className="mt-1 text-xl font-bold text-[#0f766e]">
                  {savedEmissionKg.toFixed(1)} kg CO2{' '}
                  <span className="text-sm font-medium text-slate-600">
                    ({savedFuelLiter.toFixed(1)} L solar)
                  </span>
                </p>
              ) : (
                <p className="mt-1 text-sm font-medium text-slate-600">
                  Belum dihitung. Klik Hitung Rute Truk Optimal.
                </p>
              )}
            </div>
          </section>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_380px]">
            <EcoMap />

            <aside className="space-y-4">
              <RouteControlPanel />

              <section
                aria-labelledby="map-legend-heading"
                className="rounded-xl border border-[#d6ddd8] bg-white p-5"
              >
                <h2 id="map-legend-heading" className="text-base font-bold text-slate-900">
                  Legenda Peta
                </h2>
                <ul className="mt-3.5 grid grid-cols-1 gap-2.5 text-xs text-slate-700 sm:grid-cols-2 lg:grid-cols-1">
                  {LEGEND_ITEMS.map((item) => (
                    <li key={item.label} className="flex items-center gap-2.5">
                      <span
                        aria-hidden="true"
                        className={`inline-block h-3.5 w-3.5 shrink-0 ${item.swatchClass}`}
                      />
                      <span>{item.label}</span>
                    </li>
                  ))}
                  <li className="flex items-center gap-2.5">
                    <span
                      aria-hidden="true"
                      className="inline-block h-0.5 w-4 shrink-0 bg-[#0f766e]"
                    />
                    <span>Jalur Eco-Routing Optimal</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span
                      aria-hidden="true"
                      className="inline-block h-0.5 w-4 shrink-0 border-t-2 border-dashed border-[#64748b]"
                    />
                    <span>Jalur Truk Reguler</span>
                  </li>
                </ul>
              </section>
            </aside>
          </div>
        </main>

        <footer className="border-t border-[#d6ddd8] bg-white">
          <div className="mx-auto flex max-w-[1440px] flex-col gap-1 px-4 py-4 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <span>EcoRoute SBY · Area Pilot Koridor Keputih, Sukolilo, Rungkut SIER hingga TPA Benowo</span>
            <span>Data peta OpenStreetMap · Perutean OSRM API</span>
          </div>
        </footer>
      </div>
    </>
  );
}
