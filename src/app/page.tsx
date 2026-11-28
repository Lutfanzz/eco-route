'use client';

import React, { useState } from 'react';
import {
  Leaf,
  Truck,
  Recycle,
  Map as MapIcon,
  Route,
  ShoppingBag,
  BarChart3,
  Camera,
  Building2,
  HardHat,
  Shield,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { useEcoStore } from '../store/useEcoStore';
import { applyCityScale } from '../lib/carbonEngine';
import CarbonDashboard from '../components/carbon/CarbonDashboard';

// =====================================================================
// Placeholder components for teammate stubs (safe fallbacks)
// =====================================================================

function PlaceholderCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-8 text-center min-h-[300px]">
      {icon || <MapIcon className="mx-auto h-12 w-12 text-slate-300 mb-3" />}
      <h3 className="text-lg font-semibold text-slate-500 mt-2">{title}</h3>
      <p className="text-sm text-slate-400 mt-1 max-w-sm">{description}</p>
    </div>
  );
}

/**
 * Placeholder for Lutfan's EcoMap — renders a styled map preview card.
 * When Lutfan's branch merges with a real export, replace this import.
 */
function EcoMapPlaceholder() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-eco-50 to-slate-100">
      <div className="relative">
        <MapIcon className="h-20 w-20 text-eco-300" />
        <div className="absolute -top-1 -right-1 h-5 w-5 bg-eco-500 rounded-full animate-pulse" />
      </div>
      <h3 className="text-lg font-bold text-slate-600 mt-4">
        Peta Infrastruktur Surabaya
      </h3>
      <p className="text-sm text-slate-400 mt-1 max-w-xs text-center">
        Komponen EcoMap oleh Lutfan akan menampilkan peta Leaflet dengan marker
        tong, gang sempit 150m radius, dan garis rute truk.
      </p>
      <div className="mt-4 flex gap-2">
        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">
          ● Tong Penuh
        </span>
        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">
          ● Tong Sedang
        </span>
        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
          ● Tong Kosong
        </span>
      </div>
    </div>
  );
}

/**
 * Placeholder for Lutfan's RouteControlPanel.
 */
function RouteControlPlaceholder() {
  return (
    <PlaceholderCard
      title="Panel Eco-Routing & Jalan (Segera Hadir)"
      description="Komponen RouteControlPanel dari Lutfan akan menyediakan tombol hitung rute, preset gangguan jalan, dan perbandingan rute reguler vs eco-routing."
      icon={<Route className="mx-auto h-12 w-12 text-blue-300" />}
    />
  );
}

/**
 * Placeholder for Fakhri's MarketplacePanel.
 */
function MarketplacePlaceholder() {
  return (
    <PlaceholderCard
      title="Marketplace Sirkular (Segera Hadir)"
      description="Komponen MarketplacePanel dari Fakhri akan menampilkan daftar limbah, rekomendasi AI, dan tombol Take Limbah."
      icon={<ShoppingBag className="mx-auto h-12 w-12 text-amber-300" />}
    />
  );
}

/**
 * Placeholder for Fakhri's CameraScanModal.
 */
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
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center gap-2 mb-3">
          <div className="bg-eco-100 rounded-lg p-2">
            <Camera className="h-5 w-5 text-eco-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">
            Scan Kamera Tong AI
          </h3>
        </div>
        <p className="text-sm text-slate-500 mb-4">
          Komponen CameraScanModal dari Fakhri akan menampilkan pilihan tong
          target, tombol upload foto, dan 4 sampel foto bawaan untuk deteksi AI
          via Google Gemini Vision.
        </p>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {['sample-mixed-full', 'sample-pet-clean', 'sample-cardboard', 'sample-organic'].map(
            (name) => (
              <div
                key={name}
                className="bg-slate-100 rounded-lg p-3 text-center text-xs text-slate-400 border border-dashed border-slate-200"
              >
                📷 {name}.jpg
              </div>
            ),
          )}
        </div>
        <button
          onClick={onClose}
          className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors"
        >
          Tutup
        </button>
      </div>
    </div>
  );
}

// =====================================================================
// Role definitions
// =====================================================================
const ROLES = [
  { id: 'command', label: 'Command Center', icon: Building2 },
  { id: 'petugas', label: 'Petugas Lapangan', icon: HardHat },
  { id: 'industri', label: 'Industri / UMKM', icon: ShoppingBag },
  { id: 'auditor', label: 'Auditor Lingkungan', icon: Shield },
] as const;

type RoleId = (typeof ROLES)[number]['id'];

// Tab definitions for the right pane
const TABS = [
  { id: 'routing', label: 'Eco-Routing & Jalan', icon: Route },
  { id: 'marketplace', label: 'Marketplace Sirkular', icon: ShoppingBag },
  { id: 'carbon', label: 'Analisis Karbon', icon: BarChart3 },
] as const;

type TabId = (typeof TABS)[number]['id'];

// =====================================================================
// Main Page
// =====================================================================
export default function HomePage() {
  const [activeRole, setActiveRole] = useState<RoleId>('command');
  const [activeTab, setActiveTab] = useState<TabId>('routing');
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const carbonSummary = useEcoStore((s) => s.carbonSummary);
  const isCityScaleMode = useEcoStore((s) => s.isCityScaleMode);
  const toggleCityScaleMode = useEcoStore((s) => s.toggleCityScaleMode);

  const scaled = applyCityScale(carbonSummary, isCityScaleMode);

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      {/* ============================================================ */}
      {/* TOP HEADER */}
      {/* ============================================================ */}
      <header className="flex-shrink-0 bg-gradient-to-r from-eco-800 via-eco-700 to-eco-800 text-white shadow-lg">
        {/* Row 1: Title + Role Switcher + City Scale */}
        <div className="px-4 py-2.5 flex items-center gap-4 flex-wrap">
          {/* App Title */}
          <div className="flex items-center gap-2 mr-auto">
            <div className="bg-white/20 rounded-lg p-1.5">
              <Leaf className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">EcoRoute SBY</h1>
              <p className="text-[10px] text-eco-200 leading-none hidden sm:block">
                Eco-Routing &amp; Marketplace Sirkular
              </p>
            </div>
          </div>

          {/* Role Switcher */}
          <div className="flex items-center gap-1 bg-white/10 rounded-lg p-0.5">
            {ROLES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveRole(id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                  activeRole === id
                    ? 'bg-white text-eco-800 shadow'
                    : 'text-white/80 hover:bg-white/10'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">{label}</span>
              </button>
            ))}
          </div>

          {/* City Scale Toggle */}
          <button
            onClick={toggleCityScaleMode}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              isCityScaleMode
                ? 'bg-eco-300 text-eco-900'
                : 'bg-white/10 text-white/80 hover:bg-white/20'
            }`}
          >
            {isCityScaleMode ? (
              <ToggleRight className="h-4 w-4" />
            ) : (
              <ToggleLeft className="h-4 w-4" />
            )}
            <span>189 TPS</span>
          </button>
        </div>

        {/* Row 2: 3 Carbon KPI Cards */}
        <div className="px-4 pb-2.5 grid grid-cols-3 gap-2">
          <KpiMiniCard
            icon={<Truck className="h-3.5 w-3.5" />}
            label="Emisi Truk Dihemat"
            value={scaled.truckEmissionSavedKg}
            unit="kg CO₂"
          />
          <KpiMiniCard
            icon={<Recycle className="h-3.5 w-3.5" />}
            label="Emisi Sampah Dihindari"
            value={scaled.wasteEmissionAvoidedKg}
            unit="kg CO₂e"
          />
          <KpiMiniCard
            icon={<Leaf className="h-3.5 w-3.5" />}
            label="Total Pengurangan CO₂"
            value={scaled.totalCarbonSavedKg}
            unit="kg CO₂e"
            highlight
          />
        </div>
      </header>

      {/* ============================================================ */}
      {/* SPLIT-SCREEN BODY */}
      {/* ============================================================ */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* LEFT PANE — Map */}
        <section className="lg:w-1/2 xl:w-3/5 h-[40vh] lg:h-full relative bg-slate-100">
          <EcoMapPlaceholder />
        </section>

        {/* RIGHT PANE — Tabbed Workspace */}
        <section className="lg:w-1/2 xl:w-2/5 flex flex-col border-l border-slate-200 bg-white overflow-hidden">
          {/* Tab Bar */}
          <div className="flex-shrink-0 flex items-center border-b border-slate-200 bg-slate-50">
            <div className="flex flex-1 overflow-x-auto">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === id
                      ? 'border-eco-600 text-eco-700 bg-white'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>

            {/* Camera Scan Button */}
            <button
              onClick={() => setIsCameraOpen(true)}
              className="flex items-center gap-1.5 mx-2 px-3 py-2 bg-eco-600 hover:bg-eco-700 text-white text-xs font-semibold rounded-lg shadow transition-colors"
            >
              <Camera className="h-4 w-4" />
              <span className="hidden sm:inline">Scan Kamera Tong (AI)</span>
              <span className="sm:hidden">Scan</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
            {activeTab === 'routing' && <RouteControlPlaceholder />}
            {activeTab === 'marketplace' && <MarketplacePlaceholder />}
            {activeTab === 'carbon' && <CarbonDashboard />}
          </div>
        </section>
      </main>

      {/* Camera Scan Modal */}
      <CameraModalPlaceholder
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
      />
    </div>
  );
}

// =====================================================================
// Mini KPI Card for the header strip
// =====================================================================
function KpiMiniCard({
  icon,
  label,
  value,
  unit,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  unit: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-lg px-3 py-2 ${
        highlight ? 'bg-eco-600/30 ring-1 ring-eco-400/30' : 'bg-white/10'
      }`}
    >
      <div className="flex items-center gap-1 text-eco-200 mb-0.5">
        {icon}
        <span className="text-[10px] truncate">{label}</span>
      </div>
      <div className="text-sm font-bold">
        {value.toLocaleString('id-ID', { maximumFractionDigits: 1 })}
        <span className="text-[10px] font-normal text-eco-200 ml-1">{unit}</span>
      </div>
    </div>
  );
}
