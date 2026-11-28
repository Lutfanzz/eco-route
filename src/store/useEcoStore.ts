import { create } from 'zustand';
import { surabayaNodes } from '@/data/surabayaNodes';
import type { BinStatus, CarbonSummary, DetectionResult, MarketplaceItem, RoadDisruption, RouteMetrics, WasteNode } from '@/types/ecoroute';

const initialCarbonSummary: CarbonSummary = { regularTruckEmissionKg: 0, optimizedTruckEmissionKg: 0, truckEmissionSavedKg: 0, wasteDivertedKg: 0, wasteEmissionAvoidedKg: 0, totalCarbonSavedKg: 0 };
const getBinStatus = (fillPercentage: number): BinStatus => fillPercentage >= 75 ? 'RED' : fillPercentage >= 50 ? 'YELLOW' : 'GREEN';

interface EcoState {
  nodes: WasteNode[];
  disruptions: RoadDisruption[];
  regularRoute: RouteMetrics | null;
  ecoRoute: RouteMetrics | null;
  marketplaceItems: MarketplaceItem[];
  carbonSummary: CarbonSummary;
  isCityScaleMode: boolean;
  addCentralBin: (lat: number, lng: number, name: string) => void;
  toggleDisruption: (lat: number, lng: number, title: string) => void;
  applyCameraDetection: (nodeId: string, result: DetectionResult) => void;
  setRoutes: (regular: RouteMetrics, eco: RouteMetrics) => void;
  addMarketplaceListing: (item: Omit<MarketplaceItem, 'id' | 'status'>) => void;
  takeMarketplaceItem: (itemId: string, buyerId: string) => void;
  setCityScaleMode: (enabled: boolean) => void;
}

export const useEcoStore = create<EcoState>((set) => ({
  nodes: surabayaNodes,
  disruptions: [],
  regularRoute: null,
  ecoRoute: null,
  marketplaceItems: [],
  carbonSummary: initialCarbonSummary,
  isCityScaleMode: false,
  addCentralBin: (lat, lng, name) => set((state) => ({ nodes: [...state.nodes, { id: `bin-${Date.now()}`, name, type: 'CENTRAL_BIN', district: 'Pilot Area', lat, lng, capacityKg: 500, currentLoadKg: 0, fillPercentage: 0, status: 'GREEN', dominantWaste: 'MIXED_RESIDUAL' }] })),
  toggleDisruption: (lat, lng, title) => set((state) => {
    const existing = state.disruptions.find((item) => item.title === title);
    return { disruptions: existing ? state.disruptions.filter((item) => item.id !== existing.id) : [...state.disruptions, { id: `disruption-${Date.now()}`, title, lat, lng, radiusMeter: 180, delayMinutes: 12, isActive: true }] };
  }),
  applyCameraDetection: (nodeId, result) => set((state) => {
    const source = state.nodes.find((item) => item.id === nodeId);
    if (!source) return state;
    const isMarketplaceReady = result.decision === 'LAYAK_MARKETPLACE';
    const nodes = state.nodes.map((item) => item.id === nodeId ? {
      ...item,
      currentLoadKg: isMarketplaceReady ? 0 : result.estimatedWeightKg,
      fillPercentage: isMarketplaceReady ? 0 : result.fillPercentage,
      status: isMarketplaceReady ? 'GREEN' : getBinStatus(result.fillPercentage),
      dominantWaste: result.wasteCategory,
    } : item);
    if (result.decision !== 'LAYAK_MARKETPLACE') return { nodes };
    return { nodes, marketplaceItems: [...state.marketplaceItems, { id: `listing-${Date.now()}`, sourceNodeId: nodeId, sourceName: source.name, lat: source.lat, lng: source.lng, wasteCategory: result.wasteCategory, title: `${result.wasteCategory} dari ${source.name}`, weightKg: result.estimatedWeightKg, pricePerKg: 2500, status: 'AVAILABLE' }] };
  }),
  setRoutes: (regular, eco) => set((state) => {
    const truckEmissionSavedKg = Math.max(0, regular.carbonEmissionKg - eco.carbonEmissionKg);
    return {
      regularRoute: regular,
      ecoRoute: eco,
      carbonSummary: {
        ...state.carbonSummary,
        regularTruckEmissionKg: regular.carbonEmissionKg,
        optimizedTruckEmissionKg: eco.carbonEmissionKg,
        truckEmissionSavedKg,
        totalCarbonSavedKg: truckEmissionSavedKg + state.carbonSummary.wasteEmissionAvoidedKg,
      },
    };
  }),
  addMarketplaceListing: (item) => set((state) => ({ marketplaceItems: [...state.marketplaceItems, { ...item, id: `listing-${Date.now()}`, status: 'AVAILABLE' }] })),
  takeMarketplaceItem: (itemId, buyerId) => set((state) => {
    const item = state.marketplaceItems.find((entry) => entry.id === itemId);
    if (!item || item.status === 'TAKEN') return state;
    const avoided = item.weightKg * 1.2;
    return { marketplaceItems: state.marketplaceItems.map((entry) => entry.id === itemId ? { ...entry, status: 'TAKEN', buyerId } : entry), carbonSummary: { ...state.carbonSummary, wasteDivertedKg: state.carbonSummary.wasteDivertedKg + item.weightKg, wasteEmissionAvoidedKg: state.carbonSummary.wasteEmissionAvoidedKg + avoided, totalCarbonSavedKg: state.carbonSummary.totalCarbonSavedKg + avoided } };
  }),
  setCityScaleMode: (enabled) => set({ isCityScaleMode: enabled }),
}));

