import { create } from 'zustand';
import {
  WasteNode,
  RoadDisruption,
  RouteMetrics,
  MarketplaceItem,
  CarbonSummary,
  DetectionResult,
} from '../types/ecoroute';
import { SURABAYA_NODES, PRESET_DISRUPTIONS } from '../data/surabayaNodes';
import { buildCarbonSummary } from '../lib/carbonEngine';

// ============================================================
// Helpers
// ============================================================

/** Compute the total kg diverted to marketplace across all TAKEN items. */
function totalDivertedKg(items: MarketplaceItem[]): number {
  return items
    .filter((i) => i.status === 'TAKEN')
    .reduce((sum, i) => sum + i.weightKg, 0);
}

/** Recompute CarbonSummary from current state slices. */
function recompute(
  regularRoute: RouteMetrics | null,
  ecoRoute: RouteMetrics | null,
  marketplaceItems: MarketplaceItem[],
): CarbonSummary {
  return buildCarbonSummary(regularRoute, ecoRoute, totalDivertedKg(marketplaceItems));
}

// ============================================================
// Store interface
// ============================================================

interface EcoStore {
  // ---- State ----
  nodes: WasteNode[];
  disruptions: RoadDisruption[];
  regularRoute: RouteMetrics | null;
  ecoRoute: RouteMetrics | null;
  marketplaceItems: MarketplaceItem[];
  carbonSummary: CarbonSummary;
  isCityScaleMode: boolean;

  // ---- Actions ----
  toggleCityScaleMode: () => void;

  addCentralBin: (lat: number, lng: number, name: string) => void;
  toggleDisruption: (lat: number, lng: number, title: string) => void;

  setRoutes: (regular: RouteMetrics, eco: RouteMetrics) => void;

  applyCameraDetection: (nodeId: string, result: DetectionResult) => void;

  addMarketplaceListing: (item: Omit<MarketplaceItem, 'id' | 'status'>) => void;
  takeMarketplaceItem: (itemId: string, buyerId: string) => void;
}

// ============================================================
// Initial values
// ============================================================

const initialCarbonSummary: CarbonSummary = {
  regularTruckEmissionKg: 0,
  optimizedTruckEmissionKg: 0,
  truckEmissionSavedKg: 0,
  wasteDivertedKg: 0,
  wasteEmissionAvoidedKg: 0,
  totalCarbonSavedKg: 0,
};

// ============================================================
// Zustand store
// ============================================================

export const useEcoStore = create<EcoStore>((set, get) => ({
  // ---- Initial state ----
  nodes: [...SURABAYA_NODES],
  disruptions: [...PRESET_DISRUPTIONS],
  regularRoute: null,
  ecoRoute: null,
  marketplaceItems: [],
  carbonSummary: initialCarbonSummary,
  isCityScaleMode: false,

  // ---- Actions ----

  toggleCityScaleMode: () => {
    set((s) => ({ isCityScaleMode: !s.isCityScaleMode }));
  },

  addCentralBin: (lat, lng, name) => {
    const id = `CB-NEW-${Date.now()}`;
    const newNode: WasteNode = {
      id,
      name,
      type: 'CENTRAL_BIN',
      district: 'Custom',
      lat,
      lng,
      capacityKg: 500,
      currentLoadKg: 0,
      fillPercentage: 0,
      status: 'GREEN',
      dominantWaste: 'MIXED_RESIDUAL',
    };
    set((s) => ({ nodes: [...s.nodes, newNode] }));
  },

  toggleDisruption: (lat, lng, title) => {
    set((s) => {
      // Try to find an existing disruption near the same coords
      const existing = s.disruptions.find(
        (d) => Math.abs(d.lat - lat) < 0.001 && Math.abs(d.lng - lng) < 0.001,
      );
      if (existing) {
        return {
          disruptions: s.disruptions.map((d) =>
            d.id === existing.id ? { ...d, isActive: !d.isActive } : d,
          ),
        };
      }
      // Create a new disruption
      const newDisruption: RoadDisruption = {
        id: `DIS-NEW-${Date.now()}`,
        title,
        lat,
        lng,
        radiusMeter: 150,
        delayMinutes: 15,
        isActive: true,
      };
      return { disruptions: [...s.disruptions, newDisruption] };
    });
  },

  setRoutes: (regular, eco) => {
    const { marketplaceItems } = get();
    const carbonSummary = recompute(regular, eco, marketplaceItems);
    set({ regularRoute: regular, ecoRoute: eco, carbonSummary });
  },

  applyCameraDetection: (nodeId, result) => {
    set((s) => {
      // 1. Update the node's load and status
      const nodes = s.nodes.map((n) => {
        if (n.id !== nodeId) return n;
        const newFill = Math.min(100, result.fillPercentage);
        const newLoad = Number(((newFill / 100) * n.capacityKg).toFixed(1));
        const newStatus =
          newFill >= 75 ? 'RED' : newFill >= 50 ? 'YELLOW' : 'GREEN';
        return {
          ...n,
          fillPercentage: newFill,
          currentLoadKg: newLoad,
          status: newStatus as WasteNode['status'],
          dominantWaste: result.wasteCategory,
        };
      });

      let marketplaceItems = [...s.marketplaceItems];

      // 2. If decision is LAYAK_MARKETPLACE, create a marketplace entry
      if (result.decision === 'LAYAK_MARKETPLACE') {
        const sourceNode = nodes.find((n) => n.id === nodeId);
        if (sourceNode) {
          const priceMap: Record<string, number> = {
            PLASTIC_PET: 3500,
            CARDBOARD: 2000,
            ORGANIC: 500,
            MIXED_RESIDUAL: 0,
          };
          const newItem: MarketplaceItem = {
            id: `MP-${Date.now()}`,
            sourceNodeId: nodeId,
            sourceName: sourceNode.name,
            lat: sourceNode.lat,
            lng: sourceNode.lng,
            wasteCategory: result.wasteCategory,
            title: `${result.wasteCategory} dari ${sourceNode.name}`,
            weightKg: result.estimatedWeightKg,
            pricePerKg: priceMap[result.wasteCategory] ?? 0,
            status: 'AVAILABLE',
          };
          marketplaceItems = [...marketplaceItems, newItem];
        }
      }

      const carbonSummary = recompute(s.regularRoute, s.ecoRoute, marketplaceItems);
      return { nodes, marketplaceItems, carbonSummary };
    });
  },

  addMarketplaceListing: (item) => {
    const newItem: MarketplaceItem = {
      ...item,
      id: `MP-${Date.now()}`,
      status: 'AVAILABLE',
    };
    set((s) => ({ marketplaceItems: [...s.marketplaceItems, newItem] }));
  },

  takeMarketplaceItem: (itemId, buyerId) => {
    set((s) => {
      const marketplaceItems = s.marketplaceItems.map((item) =>
        item.id === itemId ? { ...item, status: 'TAKEN' as const, buyerId } : item,
      );
      const carbonSummary = recompute(s.regularRoute, s.ecoRoute, marketplaceItems);
      return { marketplaceItems, carbonSummary };
    });
  },
}));
