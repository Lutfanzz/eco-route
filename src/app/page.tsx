'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  Leaf,
  Truck,
  Recycle,
  Route,
  ShoppingBag,
  BarChart3,
  Camera,
  Building2,
  HardHat,
  Shield,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  Check,
  Sparkles,
  MapPin,
  FileCheck2,
} from 'lucide-react';
import RouteControlPanel from '@/components/map/RouteControlPanel';
import CarbonDashboard from '@/components/carbon/CarbonDashboard';
import { useEcoStore } from '@/store/useEcoStore';
import { applyCityScale } from '@/lib/carbonEngine';

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

type RoleId = 'command' | 'petugas' | 'industri' | 'auditor';
type TabId = 'routing' | 'marketplace' | 'carbon';

interface RoleConfig {
  id: RoleId;
  label: string;
  orgLabel: string;
  badgeText: string;
  description: string;
  defaultTab: TabId;
  allowedTabs: TabId[];
  canAddBin: boolean;
  canScanCamera: boolean;
  icon: typeof Building2;
  bannerClass: string;
  iconWrapClass: string;
  badgeClass: string;
}

const ROLES: RoleConfig[] = [
  {
    id: 'command',
    label: 'Command Center',
    orgLabel: 'Operator Pusat DLH Surabaya',
    badgeText: 'MODE COMMAND CENTER',
    description:
      'Pusat Kendali DLH Surabaya — Akses penuh infrastruktur tong, eco-routing armada truk, bursa sirkular, & neraca karbon.',
    defaultTab: 'routing',
    allowedTabs: ['routing', 'marketplace', 'carbon'],
    canAddBin: true,
    canScanCamera: true,
    icon: Building2,
    bannerClass: 'border-emerald-200 bg-emerald-50/90 text-emerald-950',
    iconWrapClass: 'bg-emerald-600 text-white',
    badgeClass: 'bg-emerald-700 text-white',
  },
  {
    id: 'petugas',
    label: 'Petugas Lapangan',
    orgLabel: 'Petugas Central Tong / TPS 3R / Bank Sampah',
    badgeText: 'MODE PETUGAS LAPANGAN',
    description:
      'Petugas Lapangan & Bank Sampah (Koridor Keputih–Gebang) — Scan sampah warga/tong via AI untuk auto-listing ke Marketplace atau lapor tong penuh.',
    defaultTab: 'marketplace',
    allowedTabs: ['marketplace', 'routing', 'carbon'],
    canAddBin: false,
    canScanCamera: true,
    icon: HardHat,
    bannerClass: 'border-cyan-200 bg-cyan-50/90 text-cyan-950',
    iconWrapClass: 'bg-teal-600 text-white',
    badgeClass: 'bg-teal-700 text-white',
  },
  {
    id: 'industri',
    label: 'Industri / UMKM',
    orgLabel: 'Pembeli B2B — SIER, UMKM Kardus, Maggot BSF',
    badgeText: 'MODE INDUSTRI / UMKM',
    description:
      'Pembeli Industri & UMKM (Kawasan SIER & Wonorejo) — Klaim stok bahan baku daur ulang terdekat dengan skor kecocokan AI.',
    defaultTab: 'marketplace',
    allowedTabs: ['marketplace', 'carbon'],
    canAddBin: false,
    canScanCamera: false,
    icon: ShoppingBag,
    bannerClass: 'border-amber-200 bg-amber-50/90 text-amber-950',
    iconWrapClass: 'bg-amber-600 text-white',
    badgeClass: 'bg-amber-700 text-white',
  },
  {
    id: 'auditor',
    label: 'Auditor Lingkungan',
    orgLabel: 'Verifikator Emisi GRK & MRV Kota',
    badgeText: 'MODE AUDITOR LINGKUNGAN',
    description:
      'Auditor Lingkungan DLH (MRV GRK) — Verifikasi pengurangan emisi transportasi, limbah teralihkan, & proyeksi 189 TPS Surabaya.',
    defaultTab: 'carbon',
    allowedTabs: ['carbon', 'marketplace'],
    canAddBin: false,
    canScanCamera: false,
    icon: Shield,
    bannerClass: 'border-indigo-200 bg-indigo-50/90 text-indigo-950',
    iconWrapClass: 'bg-indigo-600 text-white',
    badgeClass: 'bg-indigo-700 text-white',
  },
];

const TABS: { id: TabId; label: string; icon: typeof Route }[] = [
  { id: 'routing', label: 'Eco-Routing & Jalan', icon: Route },
  { id: 'marketplace', label: 'Marketplace Sirkular', icon: ShoppingBag },
  { id: 'carbon', label: 'Analisis Karbon', icon: BarChart3 },
];

function MarketplacePlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#d6ddd8] bg-white p-8 text-center min-h-[260px]">
      <ShoppingBag className="h-12 w-12 text-amber-400 mb-3" />
      <h3 className="text-base font-bold text-slate-800">
        Marketplace Sirkular (Segera Hadir)
      </h3>
      <p className="text-sm text-slate-500 mt-1 max-w-sm">
        Daftar limbah terpilah siap ambil, rekomendasi jarak Haversine, skor kecocokan AI, dan tombol Take Limbah akan tampil di panel ini.
      </p>
    </div>
  );
}

function CameraModalPlaceholder({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-[#d6ddd8]">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="bg-emerald-50 rounded-lg p-2">
            <Camera className="h-5 w-5 text-[#15803d]" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            Scan Kamera Tong (AI)
          </h3>
        </div>
        <p className="text-sm text-slate-600 mb-4">
          Panel kamera AI akan menampilkan pilihan tong target, upload foto, dan 4 foto sampel bawaan untuk deteksi AI Vision otomatis.
        </p>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {[
            'sample-mixed-full.jpg',
            'sample-pet-clean.jpg',
            'sample-cardboard.jpg',
            'sample-organic.jpg',
          ].map((name) => (
            <div
              key={name}
              className="bg-slate-50 rounded-lg p-3 text-center text-xs text-slate-500 border border-dashed border-[#d6ddd8]"
            >
              {name}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-semibold text-slate-800 transition-colors"
        >
          Tutup
        </button>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [activeRole, setActiveRole] = useState<RoleId>('command');
  const [activeTab, setActiveTab] = useState<TabId>('routing');
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const roleMenuRef = useRef<HTMLDivElement>(null);

  const nodes = useEcoStore((state) => state.nodes);
  const regularRoute = useEcoStore((state) => state.regularRoute);
  const ecoRoute = useEcoStore((state) => state.ecoRoute);
  const carbonSummary = useEcoStore((state) => state.carbonSummary);
  const isCityScaleMode = useEcoStore((state) => state.isCityScaleMode);
  const toggleCityScaleMode = useEcoStore((state) => state.toggleCityScaleMode);

  const currentRole = ROLES.find((r) => r.id === activeRole) ?? ROLES[0];
  const visibleTabs = TABS.filter((tab) => currentRole.allowedTabs.includes(tab.id));

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (roleMenuRef.current && !roleMenuRef.current.contains(event.target as Node)) {
        setIsRoleMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsRoleMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const stats = useMemo(() => {
    const centralBins = nodes.filter((n) => n.type === 'CENTRAL_BIN');
    const alleys = nodes.filter((n) => n.type === 'NARROW_ALLEY');
    const servedAlleys = alleys.filter((alley) =>
      centralBins.some(
        (bin) =>
          distanceMeters(alley.lat, alley.lng, bin.lat, bin.lng) <=
          (alley.alleyRadiusMeter ?? 150)
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

  const scaledCarbon = applyCityScale(carbonSummary, isCityScaleMode);
  const scaleFactor = isCityScaleMode ? 12.6 : 1;
  const savedFuelLiter =
    regularRoute && ecoRoute
      ? Math.max(0, (regularRoute.fuelConsumedLiter - ecoRoute.fuelConsumedLiter) * scaleFactor)
      : 0;

  const handleRoleChange = (role: RoleConfig) => {
    setActiveRole(role.id);
    setActiveTab(role.defaultTab);
    setIsRoleMenuOpen(false);
  };

  const RoleIcon = currentRole.icon;

  return (
    <>
      <a href="#main-content" className="skip-link">
        Langsung ke konten utama
      </a>

      <div className="flex min-h-screen flex-col bg-[#f6f7f5]">
        {/* TOP HEADER */}
        <header className="border-b border-[#d6ddd8] bg-gradient-to-r from-[#0f766e] via-[#115e59] to-[#15803d] text-white shadow-sm">
          <div className="mx-auto max-w-[1440px] px-4 py-3 sm:px-6 lg:px-8 space-y-3">
            {/* Row 1: Brand + Subtle Role Dropdown + 189 TPS City Scale Toggle */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
                  <Leaf className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg font-bold tracking-tight leading-tight">
                    EcoRoute SBY
                  </h1>
                  <p className="text-xs text-emerald-100 truncate">
                    Infrastruktur Sampah, Eco-Routing Truk &amp; Marketplace Sirkular Surabaya
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Subtle Compact Role Switcher Dropdown */}
                <div ref={roleMenuRef} className="relative">
                  <button
                    type="button"
                    aria-haspopup="listbox"
                    aria-expanded={isRoleMenuOpen}
                    onClick={() => setIsRoleMenuOpen((prev) => !prev)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-colors"
                  >
                    <RoleIcon className="h-3.5 w-3.5 text-emerald-200" />
                    <span className="text-emerald-100/90 hidden sm:inline">Perspektif:</span>
                    <span className="font-semibold">{currentRole.label}</span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 text-emerald-200 transition-transform ${
                        isRoleMenuOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isRoleMenuOpen && (
                    <div
                      role="listbox"
                      aria-label="Pilih perspektif pengguna"
                      className="absolute right-0 mt-1.5 w-72 rounded-xl border border-[#d6ddd8] bg-white p-1.5 text-slate-900 shadow-xl z-50"
                    >
                      <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Ganti Perspektif Demo
                      </div>
                      {ROLES.map((role) => {
                        const ItemIcon = role.icon;
                        const isSelected = role.id === activeRole;
                        return (
                          <button
                            key={role.id}
                            type="button"
                            role="option"
                            aria-selected={isSelected}
                            onClick={() => handleRoleChange(role)}
                            className={`flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors ${
                              isSelected
                                ? 'bg-emerald-50 text-emerald-950'
                                : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div
                              className={`mt-0.5 rounded-md p-1.5 shrink-0 ${
                                isSelected
                                  ? 'bg-[#0f766e] text-white'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              <ItemIcon className="h-3.5 w-3.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-semibold">{role.label}</span>
                                {isSelected && (
                                  <Check className="h-3.5 w-3.5 text-[#0f766e] shrink-0" />
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                                {role.orgLabel}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 189 TPS City Scale Toggle */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={isCityScaleMode}
                  onClick={toggleCityScaleMode}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    isCityScaleMode
                      ? 'bg-emerald-300 text-emerald-950'
                      : 'bg-white/15 text-white hover:bg-white/25'
                  }`}
                >
                  {isCityScaleMode ? (
                    <ToggleRight className="h-4 w-4" />
                  ) : (
                    <ToggleLeft className="h-4 w-4" />
                  )}
                  <span>189 TPS {isCityScaleMode ? '(12,6×)' : '(Pilot 1×)'}</span>
                </button>
              </div>
            </div>

            {/* Row 2: 3 Live Carbon KPI Cards */}
            <div
              aria-label="Ringkasan Pengurangan Karbon"
              className="grid grid-cols-1 gap-2.5 sm:grid-cols-3"
            >
              <div className="rounded-lg bg-white/10 px-3.5 py-2.5 backdrop-blur-sm">
                <div className="flex items-center gap-1.5 text-xs text-emerald-100">
                  <Truck className="h-3.5 w-3.5" />
                  <span>Emisi Truk Dihemat</span>
                </div>
                <p className="mt-0.5 text-base font-bold">
                  {scaledCarbon.truckEmissionSavedKg.toLocaleString('id-ID', {
                    maximumFractionDigits: 2,
                  })}{' '}
                  <span className="text-xs font-normal text-emerald-100">
                    kg CO₂
                    {savedFuelLiter > 0
                      ? ` (${savedFuelLiter.toLocaleString('id-ID', {
                          maximumFractionDigits: 1,
                        })} L solar)`
                      : ''}
                  </span>
                </p>
              </div>

              <div className="rounded-lg bg-white/10 px-3.5 py-2.5 backdrop-blur-sm">
                <div className="flex items-center gap-1.5 text-xs text-emerald-100">
                  <Recycle className="h-3.5 w-3.5" />
                  <span>Emisi Sampah Dihindari</span>
                </div>
                <p className="mt-0.5 text-base font-bold">
                  {scaledCarbon.wasteEmissionAvoidedKg.toLocaleString('id-ID', {
                    maximumFractionDigits: 2,
                  })}{' '}
                  <span className="text-xs font-normal text-emerald-100">kg CO₂e</span>
                </p>
              </div>

              <div className="rounded-lg bg-emerald-400/20 ring-1 ring-emerald-300/40 px-3.5 py-2.5 backdrop-blur-sm">
                <div className="flex items-center gap-1.5 text-xs text-emerald-50">
                  <Leaf className="h-3.5 w-3.5" />
                  <span>Total Pengurangan CO₂</span>
                </div>
                <p className="mt-0.5 text-base font-bold">
                  {scaledCarbon.totalCarbonSavedKg.toLocaleString('id-ID', {
                    maximumFractionDigits: 2,
                  })}{' '}
                  <span className="text-xs font-normal text-emerald-100">kg CO₂e</span>
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* ACTIVE PERSONA IDENTITY STRIP (For Video Viewers) */}
        <div className={`border-b ${currentRole.bannerClass}`}>
          <div className="mx-auto max-w-[1440px] px-4 py-2.5 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg shadow-sm ${currentRole.iconWrapClass}`}
              >
                <RoleIcon className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase ${currentRole.badgeClass}`}
                  >
                    {currentRole.badgeText}
                  </span>
                  <span className="text-xs font-semibold opacity-80">
                    {currentRole.orgLabel}
                  </span>
                </div>
                <p className="mt-0.5 text-xs sm:text-sm font-medium leading-snug">
                  {currentRole.description}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN SPLIT-SCREEN WORKSPACE */}
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-5 sm:px-6 lg:px-8"
        >
          {/* Corridor Quick Stats Strip */}
          <section
            aria-label="Ringkasan operasional koridor"
            className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2"
          >
            <div className="rounded-xl border border-[#d6ddd8] bg-white px-4 py-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">
                Cakupan Gang Sempit (150 m)
              </span>
              <span className="text-base font-bold text-slate-900">
                {stats.servedAlleys} / {stats.totalAlleys}{' '}
                <span className="text-xs font-medium text-slate-500">area terlayani</span>
              </span>
            </div>

            <div className="rounded-xl border border-[#d6ddd8] bg-white px-4 py-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">
                Titik Prioritas Merah (&ge;75%)
              </span>
              <span className="text-base font-bold text-slate-900">
                {isCityScaleMode
                  ? `${Math.round(stats.redCount * scaleFactor)} titik`
                  : `${stats.redCount} titik`}{' '}
                <span className="text-xs font-medium text-slate-500">
                  ({Math.round(stats.redPayloadKg * scaleFactor).toLocaleString('id-ID')} kg)
                </span>
              </span>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_400px] xl:grid-cols-[minmax(0,1fr)_440px]">
            {/* LEFT PANE: EcoMap (Hide admin '+ Klik Peta: Tambah Central Tong' outside Command Center) */}
            <div className={`min-w-0 ${!currentRole.canAddBin ? '[&_button[aria-pressed]]:hidden' : ''}`}>
              <EcoMap />
            </div>

            {/* RIGHT PANE: Role-Aware Tabbed Workspace */}
            <aside className="flex flex-col rounded-xl border border-[#d6ddd8] bg-white overflow-hidden">
              <div className="flex items-center justify-between border-b border-[#d6ddd8] bg-[#f6f7f5] px-2 pt-2 gap-1">
                <div role="tablist" aria-label="Panel kerja" className="flex overflow-x-auto">
                  {visibleTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isSelected = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={isSelected}
                        onClick={() => setActiveTab(tab.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                          isSelected
                            ? 'border-[#0f766e] text-[#0f766e] bg-white rounded-t-lg'
                            : 'border-transparent text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {currentRole.canScanCamera && (
                  <button
                    type="button"
                    onClick={() => setIsCameraOpen(true)}
                    className="mb-1.5 inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#15803d] hover:bg-[#166534] px-3 py-2 text-xs font-semibold text-white shadow-sm transition-colors"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Scan Kamera Tong (AI)</span>
                    <span className="sm:hidden">Scan</span>
                  </button>
                )}
              </div>

              <div className="flex-1 p-4 space-y-4">
                {/* Petugas Lapangan Hero Action Card */}
                {activeRole === 'petugas' && (
                  <div className="rounded-xl border border-teal-200 bg-gradient-to-br from-teal-700 to-cyan-700 p-4 text-white shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                          <Sparkles className="h-3 w-3" /> Aksi Utama Lapangan
                        </span>
                        <h3 className="mt-2 text-sm font-bold">
                          Deteksi Isi Tong &amp; Bank Sampah via Kamera AI
                        </h3>
                        <p className="mt-1 text-xs text-teal-100 leading-relaxed">
                          Foto kondisi tong untuk klasifikasi fraksi otomatis. Limbah terpilah langsung masuk ke Marketplace Sirkular.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsCameraOpen(true)}
                      className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-xs font-bold text-teal-800 shadow hover:bg-teal-50 transition-colors"
                    >
                      <Camera className="h-4 w-4" />
                      <span>Scan Kamera Tong (AI) Sekarang</span>
                    </button>
                  </div>
                )}

                {/* Industri / UMKM Buyer Instruction Banner */}
                {activeRole === 'industri' && activeTab === 'marketplace' && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-amber-950">
                    <div className="flex items-start gap-2.5">
                      <MapPin className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                      <div className="text-xs leading-relaxed">
                        <p className="font-bold">Panduan Klaim Limbah B2B (SIER &amp; Wonorejo)</p>
                        <p className="mt-0.5 text-amber-900/90">
                          Pilih profil pembeli industri Anda, periksa jarak titik sumber pada peta di sebelah kiri, lalu klik <strong>Take Limbah</strong> untuk mengamankan stok bahan baku daur ulang.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Auditor Lingkungan 189 TPS Audit Highlight */}
                {activeRole === 'auditor' && activeTab === 'carbon' && (
                  <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3.5 text-indigo-950">
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-start gap-2.5">
                        <FileCheck2 className="h-4 w-4 text-indigo-700 shrink-0 mt-0.5" />
                        <div className="text-xs leading-relaxed">
                          <p className="font-bold">
                            Panel Audit MRV GRK — Proyeksi Skala Kota Surabaya (189 TPS)
                          </p>
                          <p className="mt-0.5 text-indigo-900/90">
                            Gunakan sakelar <strong>189 TPS (12,6×)</strong> di bawah atau di header untuk mengevaluasi dampak pengurangan emisi skala kota penuh.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={toggleCityScaleMode}
                        className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-colors ${
                          isCityScaleMode
                            ? 'bg-indigo-700 text-white'
                            : 'border border-indigo-300 bg-white text-indigo-800 hover:bg-indigo-100'
                        }`}
                      >
                        {isCityScaleMode ? '189 TPS Aktif' : 'Aktifkan 189 TPS'}
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'routing' && currentRole.allowedTabs.includes('routing') && (
                  <>
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
                  </>
                )}

                {activeTab === 'marketplace' && <MarketplacePlaceholder />}

                {activeTab === 'carbon' && <CarbonDashboard />}
              </div>
            </aside>
          </div>
        </main>

        <footer className="border-t border-[#d6ddd8] bg-white">
          <div className="mx-auto flex max-w-[1440px] flex-col gap-1 px-4 py-4 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <span>
              EcoRoute SBY · Area Pilot Koridor Keputih, Sukolilo, Rungkut SIER hingga TPA Benowo
            </span>
            <span>Data peta OpenStreetMap · Perutean OSRM API</span>
          </div>
        </footer>
      </div>

      <CameraModalPlaceholder
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
      />
    </>
  );
}
