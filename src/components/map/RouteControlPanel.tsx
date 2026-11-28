'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  buildDetourWaypoints,
  calculateTruckEmission,
  fetchOsrmRoute,
  optimizeTruckRoute,
} from '@/lib/routing';
import { useEcoStore } from '@/store/useEcoStore';
import type { RoadDisruption, RouteMetrics } from '@/types/ecoroute';

const DISRUPTION_PRESETS = [
  {
    title: 'Genangan Air MERR',
    subtitle: 'Jl. Dr. Ir. H. Soekarno · +12 menit',
    lat: -7.299,
    lng: 112.787,
  },
  {
    title: 'Galian Box Culvert Rungkut',
    subtitle: 'Koridor Industri Rungkut · +12 menit',
    lat: -7.316,
    lng: 112.776,
  },
] as const;

export default function RouteControlPanel() {
  const nodes = useEcoStore((state) => state.nodes);
  const disruptions = useEcoStore((state) => state.disruptions);
  const regularRoute = useEcoStore((state) => state.regularRoute);
  const ecoRoute = useEcoStore((state) => state.ecoRoute);
  const isCityScaleMode = useEcoStore((state) => state.isCityScaleMode);
  const setRoutes = useEcoStore((state) => state.setRoutes);
  const toggleDisruption = useEcoStore((state) => state.toggleDisruption);

  const [isCalculating, setIsCalculating] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  const allCollectionNodes = useMemo(
    () => nodes.filter((node) => node.type === 'CENTRAL_BIN' || node.type === 'TPS'),
    [nodes]
  );

  const priorityNodes = useMemo(() => optimizeTruckRoute(nodes), [nodes]);
  const tpaDestination = useMemo(
    () => nodes.find((node) => node.type === 'TPA_BENOWO'),
    [nodes]
  );

  const calculateRoutes = useCallback(
    async (nextDisruptions: RoadDisruption[]) => {
      if (priorityNodes.length === 0 || allCollectionNodes.length === 0) {
        setRouteError('Belum ada central tong atau TPS berstatus merah (>=75%) untuk diangkut.');
        return;
      }

      setIsCalculating(true);
      setRouteError(null);

      try {
        const regularWaypoints: [number, number][] = allCollectionNodes.map((n) => [n.lat, n.lng]);
        if (tpaDestination) {
          regularWaypoints.push([tpaDestination.lat, tpaDestination.lng]);
        }

        const orderedEcoStops = optimizeTruckRoute(nodes);
        const ecoWaypoints = buildDetourWaypoints(
          orderedEcoStops,
          tpaDestination,
          nextDisruptions.filter((d) => d.isActive)
        );

        const [rawRegular, rawEco] = await Promise.all([
          fetchOsrmRoute(regularWaypoints),
          fetchOsrmRoute(ecoWaypoints),
        ]);

        const regularPayloadKg = allCollectionNodes.reduce((sum, n) => sum + n.currentLoadKg, 0);
        const ecoPayloadKg = orderedEcoStops.reduce((sum, n) => sum + n.currentLoadKg, 0);
        const activeDelayMin = nextDisruptions.reduce(
          (sum, d) => (d.isActive ? sum + d.delayMinutes : sum),
          0
        );

        const regular: RouteMetrics = {
          ...rawRegular,
          mode: 'REGULAR',
          visitedNodeIds: allCollectionNodes.map((n) => n.id),
          estimatedDurationMin: rawRegular.estimatedDurationMin + activeDelayMin,
          totalPayloadKg: regularPayloadKg,
          fuelConsumedLiter: rawRegular.totalDistanceKm * 0.35,
          carbonEmissionKg: calculateTruckEmission(rawRegular.totalDistanceKm, regularPayloadKg),
        };

        const eco: RouteMetrics = {
          ...rawEco,
          mode: 'ECO_OPTIMIZED',
          visitedNodeIds: orderedEcoStops.map((n) => n.id),
          totalPayloadKg: ecoPayloadKg,
          fuelConsumedLiter: rawEco.totalDistanceKm * 0.35,
          carbonEmissionKg: calculateTruckEmission(rawEco.totalDistanceKm, ecoPayloadKg),
        };

        setRoutes(regular, eco);
      } catch {
        setRouteError(
          'Gagal menghitung rute dari OSRM API. Periksa koneksi jaringan Anda lalu coba lagi.'
        );
      } finally {
        setIsCalculating(false);
      }
    },
    [allCollectionNodes, nodes, priorityNodes, setRoutes, tpaDestination]
  );

  const handleToggleDisruption = (preset: (typeof DISRUPTION_PRESETS)[number]) => {
    const exists = disruptions.some((d) => d.title === preset.title);
    const nextDisruptions = exists
      ? disruptions.filter((d) => d.title !== preset.title)
      : [
          ...disruptions,
          {
            id: `disruption-${Date.now()}`,
            title: preset.title,
            lat: preset.lat,
            lng: preset.lng,
            radiusMeter: 180,
            delayMinutes: 12,
            isActive: true,
          },
        ];

    toggleDisruption(preset.lat, preset.lng, preset.title);

    if (ecoRoute && regularRoute) {
      void calculateRoutes(nextDisruptions);
    }
  };

  const scaleFactor = isCityScaleMode ? 12.6 : 1;

  return (
    <section
      aria-labelledby="route-control-heading"
      className="rounded-xl border border-[#d6ddd8] bg-white p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="route-control-heading" className="text-base font-bold text-slate-900">
            Kontrol Eco-Routing Truk
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            Prioritas jemput {priorityNodes.length} dari {allCollectionNodes.length} titik tong &amp; TPS berstatus merah (muatan &ge;75%).
          </p>
        </div>
      </div>

      <button
        type="button"
        disabled={isCalculating}
        onClick={() => void calculateRoutes(disruptions)}
        className="mt-4 flex min-h-[44px] w-full items-center justify-center rounded-lg bg-[#0f766e] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#115e59] active:bg-[#134e4a] disabled:opacity-60"
      >
        {isCalculating ? 'Menghitung Rute via OSRM...' : 'Hitung Rute Truk Optimal'}
      </button>

      {routeError && (
        <div
          role="alert"
          className="mt-3 rounded-lg border border-[#fecaca] bg-[#fef2f2] p-3 text-xs text-[#b91c1c]"
        >
          <p className="font-medium">{routeError}</p>
          <button
            type="button"
            onClick={() => void calculateRoutes(disruptions)}
            className="mt-2 min-h-[36px] rounded-md border border-[#b91c1c] bg-white px-3 py-1 font-semibold text-[#b91c1c] hover:bg-[#fef2f2]"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {!ecoRoute && !regularRoute && !routeError && !isCalculating && (
        <div className="mt-3 rounded-lg border border-[#e2e6e2] bg-[#f6f7f5] p-3 text-xs text-slate-600">
          Belum ada rute dihitung. Jalankan perhitungan untuk membandingkan jalur reguler dan rute eco-optimized menuju TPA Benowo.
        </div>
      )}

      {ecoRoute && regularRoute && (
        <div className="mt-4 space-y-2.5 rounded-lg border border-[#d6ddd8] bg-[#f6f7f5] p-3.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-900">Perbandingan Rute</span>
            {isCityScaleMode && (
              <span className="rounded border border-[#0f766e] bg-[#f0fdfa] px-2 py-0.5 font-semibold text-[#0f766e]">
                Skala 189 TPS (12,6x)
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="rounded-lg border border-[#e2e6e2] bg-white p-2.5">
              <p className="font-medium text-slate-600">Rute Reguler</p>
              <p className="mt-1 text-sm font-bold text-slate-900">
                {(regularRoute.totalDistanceKm * scaleFactor).toFixed(1)} km
              </p>
              <p className="mt-0.5 text-slate-600">
                {Math.round(regularRoute.estimatedDurationMin)} mnt ·{' '}
                {(regularRoute.carbonEmissionKg * scaleFactor).toFixed(1)} kg CO2
              </p>
            </div>

            <div className="rounded-lg border border-[#0f766e] bg-[#f0fdfa] p-2.5">
              <p className="font-semibold text-[#0f766e]">Eco-Routing</p>
              <p className="mt-1 text-sm font-bold text-slate-900">
                {(ecoRoute.totalDistanceKm * scaleFactor).toFixed(1)} km
              </p>
              <p className="mt-0.5 text-[#115e59]">
                {Math.round(ecoRoute.estimatedDurationMin)} mnt ·{' '}
                {(ecoRoute.carbonEmissionKg * scaleFactor).toFixed(1)} kg CO2
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-5 border-t border-[#e2e6e2] pt-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
          Simulasi Gangguan Jalan
        </h3>
        <div className="mt-2.5 space-y-2">
          {DISRUPTION_PRESETS.map((preset) => {
            const isActive = disruptions.some((item) => item.title === preset.title && item.isActive);
            return (
              <button
                key={preset.title}
                type="button"
                aria-pressed={isActive}
                onClick={() => handleToggleDisruption(preset)}
                className={`flex min-h-[44px] w-full items-center justify-between gap-3 rounded-lg border px-3.5 py-2.5 text-left transition-colors ${
                  isActive
                    ? 'border-[#c2410c] bg-[#fff7ed] text-[#9a3412]'
                    : 'border-[#d6ddd8] bg-white text-slate-800 hover:bg-[#f6f7f5]'
                }`}
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{preset.title}</p>
                  <p className={`text-xs ${isActive ? 'text-[#9a3412]' : 'text-slate-600'}`}>
                    {preset.subtitle}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-md border px-2 py-0.5 text-xs font-semibold ${
                    isActive
                      ? 'border-[#c2410c] bg-white text-[#9a3412]'
                      : 'border-[#d6ddd8] bg-[#f6f7f5] text-slate-700'
                  }`}
                >
                  {isActive ? 'Aktif' : 'Nonaktif'}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
