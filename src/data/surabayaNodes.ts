import type { WasteNode } from '@/types/ecoroute';

const node = (value: Omit<WasteNode, 'status'>): WasteNode => ({
  ...value,
  status: value.fillPercentage >= 75 ? 'RED' : value.fillPercentage >= 50 ? 'YELLOW' : 'GREEN',
});

export const surabayaNodes: WasteNode[] = [
  node({ id: 'bin-keputih-01', name: 'Central Tong Keputih 01', type: 'CENTRAL_BIN', district: 'Keputih', lat: -7.2866, lng: 112.7976, capacityKg: 500, currentLoadKg: 410, fillPercentage: 82, dominantWaste: 'MIXED_RESIDUAL' }),
  node({ id: 'bin-ge gebang-01'.replace(' ', ''), name: 'Central Tong Gebang 01', type: 'CENTRAL_BIN', district: 'Gebang', lat: -7.2819, lng: 112.8031, capacityKg: 500, currentLoadKg: 280, fillPercentage: 56, dominantWaste: 'PLASTIC_PET' }),
  node({ id: 'bin-rungkut-01', name: 'Central Tong Rungkut 01', type: 'CENTRAL_BIN', district: 'Rungkut SIER', lat: -7.3191, lng: 112.7724, capacityKg: 500, currentLoadKg: 390, fillPercentage: 78, dominantWaste: 'CARDBOARD' }),
  node({ id: 'tps-sukolilo', name: 'TPS Sukolilo', type: 'TPS', district: 'Sukolilo', lat: -7.2918, lng: 112.7849, capacityKg: 1000, currentLoadKg: 820, fillPercentage: 82, dominantWaste: 'MIXED_RESIDUAL' }),
  node({ id: 'alley-keputih-01', name: 'Gang Sempit Keputih', type: 'NARROW_ALLEY', district: 'Keputih', lat: -7.2884, lng: 112.7952, capacityKg: 0, currentLoadKg: 0, fillPercentage: 0, dominantWaste: 'MIXED_RESIDUAL', alleyRadiusMeter: 150 }),
  node({ id: 'alley-galang-01', name: 'Gang Sempit Gebang', type: 'NARROW_ALLEY', district: 'Gebang', lat: -7.2809, lng: 112.8015, capacityKg: 0, currentLoadKg: 0, fillPercentage: 0, dominantWaste: 'MIXED_RESIDUAL', alleyRadiusMeter: 150 }),
  node({ id: 'buyer-sier', name: 'PT Daur Ulang Plastik SIER', type: 'INDUSTRY_BUYER', district: 'Rungkut SIER', lat: -7.3242, lng: 112.7705, capacityKg: 0, currentLoadKg: 0, fillPercentage: 0, dominantWaste: 'PLASTIC_PET' }),
  node({ id: 'buyer-rungkut', name: 'UMKM Kerajinan Kardus Rungkut', type: 'INDUSTRY_BUYER', district: 'Rungkut SIER', lat: -7.3154, lng: 112.7813, capacityKg: 0, currentLoadKg: 0, fillPercentage: 0, dominantWaste: 'CARDBOARD' }),
  node({ id: 'tpa-benowo', name: 'TPA Benowo', type: 'TPA_BENOWO', district: 'Benowo', lat: -7.2134, lng: 112.6345, capacityKg: 0, currentLoadKg: 0, fillPercentage: 0, dominantWaste: 'MIXED_RESIDUAL' }),
];

