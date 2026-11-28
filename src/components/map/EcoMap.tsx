'use client';

import { Fragment, useMemo, useState } from 'react';
import { Circle, MapContainer, Marker, Polyline, Popup, TileLayer, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEcoStore } from '@/store/useEcoStore';
import type { NodeType } from '@/types/ecoroute';

const CORRIDOR_CENTER: [number, number] = [-7.2892, 112.7945];

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

const createNodeIcon = (type: NodeType, status?: string, isAlleyServed?: boolean) => {
  let color = '#1d4ed8';
  let size = 18;
  let radius = '50%';

  if (type === 'CENTRAL_BIN') {
    color = status === 'RED' ? '#b91c1c' : status === 'YELLOW' ? '#b45309' : '#15803d';
    size = 20;
  } else if (type === 'NARROW_ALLEY') {
    color = isAlleyServed ? '#0f766e' : '#c2410c';
    size = 16;
  } else if (type === 'TPA_BENOWO') {
    color = '#1e293b';
    size = 22;
    radius = '6px';
  } else if (type === 'TPS') {
    color = '#1d4ed8';
    size = 20;
    radius = '6px';
  } else if (type === 'INDUSTRY_BUYER') {
    color = '#6d28d9';
    size = 18;
  }

  return L.divIcon({
    className: 'ecoroute-marker',
    html: `<div style="background:${color};width:${size}px;height:${size}px;border:2.5px solid #ffffff;border-radius:${radius};box-shadow:0 1px 4px rgba(15,23,42,0.35)"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

const createDisruptionIcon = () =>
  L.divIcon({
    className: 'ecoroute-disruption-marker',
    html: '<div style="background:#c2410c;color:#ffffff;width:22px;height:22px;border:2px solid #ffffff;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;box-shadow:0 1px 4px rgba(15,23,42,0.4)">!</div>',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });

const NODE_TYPE_LABELS: Record<NodeType, string> = {
  CENTRAL_BIN: 'Central Tong',
  NARROW_ALLEY: 'Gang Sempit (150 m)',
  TPS: 'TPS',
  INDUSTRY_BUYER: 'Pembeli Industri',
  TPA_BENOWO: 'TPA Benowo',
};

interface MapClickHandlerProps {
  isAddMode: boolean;
  onPlaceBin: (lat: number, lng: number) => void;
}

function MapClickHandler({ isAddMode, onPlaceBin }: MapClickHandlerProps) {
  useMapEvents({
    click(event) {
      if (!isAddMode) return;
      onPlaceBin(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

export default function EcoMap() {
  const nodes = useEcoStore((state) => state.nodes);
  const disruptions = useEcoStore((state) => state.disruptions);
  const regularRoute = useEcoStore((state) => state.regularRoute);
  const ecoRoute = useEcoStore((state) => state.ecoRoute);
  const addCentralBin = useEcoStore((state) => state.addCentralBin);

  const [isAddMode, setIsAddMode] = useState(false);
  const [lastAddedMessage, setLastAddedMessage] = useState<string | null>(null);

  const centralBins = useMemo(
    () => nodes.filter((node) => node.type === 'CENTRAL_BIN'),
    [nodes]
  );

  const alleyCoverage = useMemo(() => {
    const alleys = nodes.filter((node) => node.type === 'NARROW_ALLEY');
    const servedIds = new Set<string>();

    for (const alley of alleys) {
      const radius = alley.alleyRadiusMeter ?? 150;
      const hasBin = centralBins.some(
        (bin) => distanceMeters(alley.lat, alley.lng, bin.lat, bin.lng) <= radius
      );
      if (hasBin) servedIds.add(alley.id);
    }

    return { total: alleys.length, servedIds };
  }, [nodes, centralBins]);

  const handlePlaceBin = (lat: number, lng: number) => {
    const addedCount = centralBins.length + 1;
    const binName = `Central Tong Baru #${addedCount}`;
    addCentralBin(lat, lng, binName);
    setIsAddMode(false);
    setLastAddedMessage(
      `${binName} ditambahkan di koordinat (${lat.toFixed(4)}, ${lng.toFixed(4)}).`
    );
  };

  return (
    <section
      aria-label="Peta Infrastruktur dan Eco-Routing Surabaya"
      className={`map-shell flex flex-col overflow-hidden rounded-xl border border-[#d6ddd8] bg-white ${
        isAddMode ? 'is-adding-bin' : ''
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e2e6e2] px-4 py-3 sm:px-5">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            Peta Koridor Keputih, Sukolilo, dan Rungkut SIER
          </h2>
          <p className="mt-0.5 text-xs text-slate-600">
            Cakupan gang sempit: {alleyCoverage.servedIds.size} dari {alleyCoverage.total} titik terlayani radius 150 m
          </p>
        </div>

        <button
          type="button"
          aria-pressed={isAddMode}
          onClick={() => {
            setIsAddMode((prev) => !prev);
            setLastAddedMessage(null);
          }}
          className={`inline-flex min-h-[44px] items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-semibold transition-colors sm:text-sm ${
            isAddMode
              ? 'border-[#0f766e] bg-[#0f766e] text-white hover:bg-[#115e59]'
              : 'border-[#0f766e] bg-white text-[#0f766e] hover:bg-[#f0fdfa]'
          }`}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4 shrink-0"
          >
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
          </svg>
          <span>{isAddMode ? 'Mode Klik Peta Aktif' : 'Klik Peta: Tambah Central Tong'}</span>
        </button>
      </div>

      {isAddMode && (
        <div
          role="status"
          aria-live="polite"
          className="flex flex-wrap items-center justify-between gap-3 border-b border-[#99f6e4] bg-[#f0fdfa] px-4 py-2.5 text-xs text-[#115e59] sm:px-5"
        >
          <span>
            Klik titik di peta untuk menempatkan Central Tong baru dan melihat radius layanan 150 m.
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handlePlaceBin(-7.2888, 112.7955)}
              className="min-h-[36px] rounded-md border border-[#0f766e] bg-white px-2.5 py-1 text-xs font-semibold text-[#0f766e] hover:bg-[#e6f4f1]"
            >
              Pasang di Titik Tengah
            </button>
            <button
              type="button"
              onClick={() => setIsAddMode(false)}
              className="min-h-[36px] rounded-md px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-white/70"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {lastAddedMessage && !isAddMode && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center justify-between gap-3 border-b border-[#bbf7d0] bg-[#f0fdf4] px-4 py-2 text-xs font-medium text-[#15803d] sm:px-5"
        >
          <span>{lastAddedMessage}</span>
          <button
            type="button"
            onClick={() => setLastAddedMessage(null)}
            className="min-h-[32px] rounded px-2 font-semibold text-[#15803d] hover:bg-[#dcfce7]"
          >
            Tutup
          </button>
        </div>
      )}

      <div className="relative flex-1">
        <MapContainer center={CORRIDOR_CENTER} zoom={14} scrollWheelZoom>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler isAddMode={isAddMode} onPlaceBin={handlePlaceBin} />

          {regularRoute && regularRoute.coordinates.length > 1 && (
            <Polyline
              positions={regularRoute.coordinates}
              pathOptions={{ color: '#64748b', weight: 4, dashArray: '8 8', opacity: 0.85 }}
            />
          )}

          {ecoRoute && ecoRoute.coordinates.length > 1 && (
            <Polyline
              positions={ecoRoute.coordinates}
              pathOptions={{ color: '#0f766e', weight: 5, opacity: 0.95 }}
            />
          )}

          {nodes.map((item) => {
            const isServed = item.type === 'NARROW_ALLEY' ? alleyCoverage.servedIds.has(item.id) : undefined;
            return (
              <Fragment key={item.id}>
                <Marker
                  position={[item.lat, item.lng]}
                  icon={createNodeIcon(item.type, item.status, isServed)}
                >
                  <Popup>
                    <div className="space-y-1">
                      <p className="font-semibold text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-600">
                        {NODE_TYPE_LABELS[item.type]} · {item.district}
                      </p>
                      {(item.type === 'CENTRAL_BIN' || item.type === 'TPS') && (
                        <p className="text-xs font-medium text-slate-800">
                          Muatan: {item.fillPercentage}% ({item.currentLoadKg} / {item.capacityKg} kg)
                        </p>
                      )}
                      {item.type === 'NARROW_ALLEY' && (
                        <p
                          className={`text-xs font-semibold ${
                            isServed ? 'text-[#0f766e]' : 'text-[#c2410c]'
                          }`}
                        >
                          {isServed
                            ? 'Terlayani (Central Tong dalam 150 m)'
                            : 'Butuh Central Tong (belum terjangkau 150 m)'}
                        </p>
                      )}
                    </div>
                  </Popup>
                </Marker>

                {item.type === 'NARROW_ALLEY' && (
                  <Circle
                    center={[item.lat, item.lng]}
                    radius={item.alleyRadiusMeter ?? 150}
                    pathOptions={{
                      color: isServed ? '#0f766e' : '#c2410c',
                      fillColor: isServed ? '#14b8a6' : '#fb923c',
                      fillOpacity: 0.16,
                      weight: 2,
                    }}
                  />
                )}
              </Fragment>
            );
          })}

          {disruptions
            .filter((d) => d.isActive)
            .map((disruption) => (
              <Fragment key={disruption.id}>
                <Circle
                  center={[disruption.lat, disruption.lng]}
                  radius={disruption.radiusMeter}
                  pathOptions={{
                    color: '#c2410c',
                    fillColor: '#fb923c',
                    fillOpacity: 0.18,
                    dashArray: '6 4',
                    weight: 2,
                  }}
                />
                <Marker position={[disruption.lat, disruption.lng]} icon={createDisruptionIcon()}>
                  <Popup>
                    <div className="space-y-1">
                      <p className="font-semibold text-[#9a3412]">{disruption.title}</p>
                      <p className="text-xs text-slate-600">
                        Gangguan aktif · Estimasi tunda +{disruption.delayMinutes} menit
                      </p>
                    </div>
                  </Popup>
                </Marker>
              </Fragment>
            ))}
        </MapContainer>
      </div>
    </section>
  );
}
