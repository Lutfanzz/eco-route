export type NodeType = 'CENTRAL_BIN' | 'NARROW_ALLEY' | 'TPS' | 'INDUSTRY_BUYER' | 'TPA_BENOWO';
export type WasteCategory = 'ORGANIC' | 'PLASTIC_PET' | 'CARDBOARD' | 'MIXED_RESIDUAL';
export type BinStatus = 'GREEN' | 'YELLOW' | 'RED';

export interface WasteNode {
  id: string;
  name: string;
  type: NodeType;
  district: string;
  lat: number;
  lng: number;
  capacityKg: number;
  currentLoadKg: number;
  fillPercentage: number;
  status: BinStatus;
  dominantWaste: WasteCategory;
  alleyRadiusMeter?: number;
}

export interface RoadDisruption {
  id: string;
  title: string;
  lat: number;
  lng: number;
  radiusMeter: number;
  delayMinutes: number;
  isActive: boolean;
}

export interface RouteMetrics {
  mode: 'REGULAR' | 'ECO_OPTIMIZED';
  coordinates: [number, number][];
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
  distanceKm?: number;
  matchScore?: number;
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

