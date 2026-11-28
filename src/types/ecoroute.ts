export type NodeType = 'CENTRAL_BIN' | 'NARROW_ALLEY' | 'TPS' | 'INDUSTRY_BUYER' | 'TPA_BENOWO';

export type WasteCategory = 'ORGANIC' | 'PLASTIC_PET' | 'CARDBOARD' | 'MIXED_RESIDUAL';

export type BinStatus = 'GREEN' | 'YELLOW' | 'RED'; // GREEN <50%, YELLOW 50-74%, RED >=75%

export interface WasteNode {
  id: string;
  name: string;
  type: NodeType;
  district: string; // "Keputih", "Gebang", "Sukolilo", "Rungkut SIER", "Benowo"
  lat: number;
  lng: number;
  capacityKg: number;
  currentLoadKg: number;
  fillPercentage: number; // 0 - 100
  status: BinStatus;
  dominantWaste: WasteCategory;
  alleyRadiusMeter?: number; // Khusus NARROW_ALLEY (default: 150)
}

export interface RoadDisruption {
  id: string;
  title: string; // misal: "Genangan Air MERR" atau "Perbaikan Saluran Rungkut"
  lat: number;
  lng: number;
  radiusMeter: number;
  delayMinutes: number;
  isActive: boolean;
}

export interface RouteMetrics {
  mode: 'REGULAR' | 'ECO_OPTIMIZED';
  coordinates: [number, number][]; // Array [lat, lng] untuk Leaflet Polyline
  visitedNodeIds: string[];
  totalDistanceKm: number;
  estimatedDurationMin: number;
  totalPayloadKg: number;
  fuelConsumedLiter: number;
  carbonEmissionKg: number;
}

export interface MarketplaceItem {
  id: string;
  sourceNodeId: string;
  sourceName: string;
  lat: number;
  lng: number;
  wasteCategory: WasteCategory;
  title: string;
  weightKg: number;
  pricePerKg: number;
  status: 'AVAILABLE' | 'TAKEN';
  buyerId?: string;
  distanceKm?: number; // Dihitung dinamis terhadap pembeli aktif
  matchScore?: number; // Skor AI Recommendation (0 - 100)
}

export interface DetectionResult {
  wasteCategory: WasteCategory;
  fillPercentage: number;
  estimatedWeightKg: number;
  decision: 'ANGKUT_TPA' | 'LAYAK_MARKETPLACE';
  confidenceScore: number;
  aiNote: string;
}

export interface CarbonSummary {
  regularTruckEmissionKg: number;
  optimizedTruckEmissionKg: number;
  truckEmissionSavedKg: number;
  wasteDivertedKg: number;
  wasteEmissionAvoidedKg: number;
  totalCarbonSavedKg: number;
}

