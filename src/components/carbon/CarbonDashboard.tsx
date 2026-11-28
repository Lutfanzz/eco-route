'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Leaf, TrendingDown, Recycle, Truck } from 'lucide-react';
import { useEcoStore } from '@/store/useEcoStore';
import { applyCityScale, CITY_SCALE_MULTIPLIER } from '@/lib/carbonEngine';

function KpiCard({
  icon,
  label,
  value,
  unit,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  unit: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-[#d6ddd8] p-4 shadow-sm bg-white flex items-start gap-3">
      <div className={`flex-shrink-0 rounded-lg p-2 ${color}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 font-medium truncate">{label}</p>
        <p className="text-xl font-bold text-slate-800">
          {value.toLocaleString('id-ID', { maximumFractionDigits: 2 })}
          <span className="text-sm font-normal text-slate-500 ml-1">{unit}</span>
        </p>
      </div>
    </div>
  );
}

export default function CarbonDashboard() {
  const carbonSummary = useEcoStore((s) => s.carbonSummary);
  const isCityScaleMode = useEcoStore((s) => s.isCityScaleMode);
  const toggleCityScaleMode = useEcoStore((s) => s.toggleCityScaleMode);

  const scaled = applyCityScale(carbonSummary, isCityScaleMode);

  const comparisonData = [
    {
      name: 'Emisi Truk',
      'Baseline Konvensional': scaled.regularTruckEmissionKg,
      'EcoRoute SBY': scaled.optimizedTruckEmissionKg,
    },
  ];

  const breakdownData = [
    {
      name: 'Hemat Transportasi',
      value: scaled.truckEmissionSavedKg,
    },
    {
      name: 'Hemat Limbah',
      value: scaled.wasteEmissionAvoidedKg,
    },
  ];

  const hasData =
    scaled.regularTruckEmissionKg > 0 ||
    scaled.optimizedTruckEmissionKg > 0 ||
    scaled.wasteEmissionAvoidedKg > 0;

  return (
    <div className="space-y-5">
      {/* City-Scale Toggle */}
      <div className="flex items-center justify-between bg-gradient-to-r from-[#0f766e] to-[#15803d] rounded-xl px-4 py-3 text-white shadow">
        <div>
          <h3 className="text-sm font-bold">
            Proyeksi Skala Kota Surabaya (189 TPS)
          </h3>
          <p className="text-xs text-emerald-100">
            Faktor pengali {CITY_SCALE_MULTIPLIER}× dari pilot 15 titik
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={isCityScaleMode}
          onClick={toggleCityScaleMode}
          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
            isCityScaleMode ? 'bg-emerald-300' : 'bg-white/30'
          }`}
          aria-label="Toggle proyeksi skala kota"
        >
          <span
            className={`inline-block h-5 w-5 rounded-full bg-white shadow-md transform transition-transform ${
              isCityScaleMode ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <KpiCard
          icon={<Truck className="h-5 w-5 text-blue-600" />}
          label="Emisi Truk Dihemat"
          value={scaled.truckEmissionSavedKg}
          unit="kg CO₂"
          color="bg-blue-50"
        />
        <KpiCard
          icon={<Recycle className="h-5 w-5 text-amber-600" />}
          label="Emisi Sampah Dihindari"
          value={scaled.wasteEmissionAvoidedKg}
          unit="kg CO₂e"
          color="bg-amber-50"
        />
        <KpiCard
          icon={<Leaf className="h-5 w-5 text-[#15803d]" />}
          label="Total Pengurangan CO₂"
          value={scaled.totalCarbonSavedKg}
          unit="kg CO₂e"
          color="bg-emerald-50"
        />
      </div>

      {!hasData && (
        <div className="rounded-xl border-2 border-dashed border-[#d6ddd8] p-8 text-center text-slate-500 bg-white">
          <TrendingDown className="mx-auto h-10 w-10 mb-2 opacity-40" />
          <p className="font-medium text-slate-700">Belum ada data rute atau marketplace</p>
          <p className="text-sm mt-1">
            Hitung rute truk optimal atau scan tong untuk melihat analisis karbon.
          </p>
        </div>
      )}

      {hasData && (
        <>
          {/* Bar Chart: Baseline vs EcoRoute */}
          <div className="bg-white rounded-xl border border-[#d6ddd8] p-4 shadow-sm">
            <h4 className="text-sm font-bold text-slate-700 mb-3">
              Perbandingan Emisi Truk: Baseline vs EcoRoute
            </h4>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={comparisonData}
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} unit=" kg" />
                <Tooltip
                  formatter={(value) => {
                    const num = typeof value === 'number' ? value : Number(value ?? 0);
                    return `${num.toLocaleString('id-ID', { maximumFractionDigits: 2 })} kg CO₂`;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Baseline Konvensional" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="EcoRoute SBY" fill="#16a34a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Breakdown Chart */}
          <div className="bg-white rounded-xl border border-[#d6ddd8] p-4 shadow-sm">
            <h4 className="text-sm font-bold text-slate-700 mb-3">
              Kontribusi Pengurangan Emisi
            </h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={breakdownData}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} unit=" kg" />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  width={130}
                />
                <Tooltip
                  formatter={(value) => {
                    const num = typeof value === 'number' ? value : Number(value ?? 0);
                    return `${num.toLocaleString('id-ID', { maximumFractionDigits: 2 })} kg CO₂e`;
                  }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  <Cell fill="#3b82f6" />
                  <Cell fill="#f59e0b" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Summary Table */}
          <div className="bg-white rounded-xl border border-[#d6ddd8] p-4 shadow-sm">
            <h4 className="text-sm font-bold text-slate-700 mb-3">Rincian Neraca Karbon</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Emisi Rute Reguler (Konvensional)</span>
                <span className="font-semibold">
                  {scaled.regularTruckEmissionKg.toLocaleString('id-ID', {
                    maximumFractionDigits: 2,
                  })}{' '}
                  kg CO₂
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Emisi Rute Eco-Optimized</span>
                <span className="font-semibold text-[#15803d]">
                  {scaled.optimizedTruckEmissionKg.toLocaleString('id-ID', {
                    maximumFractionDigits: 2,
                  })}{' '}
                  kg CO₂
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Penghematan Transportasi</span>
                <span className="font-semibold text-blue-600">
                  ▼{' '}
                  {scaled.truckEmissionSavedKg.toLocaleString('id-ID', {
                    maximumFractionDigits: 2,
                  })}{' '}
                  kg CO₂
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Sampah Teralihkan ke Marketplace</span>
                <span className="font-semibold">
                  {scaled.wasteDivertedKg.toLocaleString('id-ID', {
                    maximumFractionDigits: 2,
                  })}{' '}
                  kg
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Emisi TPA Dihindari</span>
                <span className="font-semibold text-amber-600">
                  ▼{' '}
                  {scaled.wasteEmissionAvoidedKg.toLocaleString('id-ID', {
                    maximumFractionDigits: 2,
                  })}{' '}
                  kg CO₂e
                </span>
              </div>
              <div className="flex justify-between py-2 bg-emerald-50 rounded-lg px-3 mt-1">
                <span className="font-bold text-emerald-900">
                  Total Pengurangan Karbon Bersih
                </span>
                <span className="font-bold text-[#15803d] text-base">
                  {scaled.totalCarbonSavedKg.toLocaleString('id-ID', {
                    maximumFractionDigits: 2,
                  })}{' '}
                  kg CO₂e
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
