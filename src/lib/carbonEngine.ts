import { CarbonSummary, RouteMetrics } from '../types/ecoroute';

// Konstanta standar dari PRD Section 3.1
export const BASE_FUEL_CONSUMPTION_L_PER_KM = 0.35; // L/km
export const PAYLOAD_REFERENCE_KG = 5000; // 5 ton kapasitas truk
export const PAYLOAD_PENALTY_FACTOR = 0.15;
export const DIESEL_EMISSION_FACTOR_KG_CO2_PER_L = 2.68; // kg CO2/liter Biosolar
export const WASTE_AVOIDANCE_FACTOR_KG_CO2E_PER_KG = 1.20; // kg CO2e/kg sampah teralihkan
export const CITY_SCALE_MULTIPLIER = 12.6; // Skala pilot (15 titik) -> 189 TPS Surabaya

/**
 * Menghitung konsumsi BBM Solar truk (Liter) berdasarkan jarak dan berat muatan.
 */
export function calculateTruckFuelLiter(distanceKm: number, payloadKg: number): number {
  if (distanceKm <= 0) return 0;
  const loadMultiplier = 1 + PAYLOAD_PENALTY_FACTOR * (Math.max(0, payloadKg) / PAYLOAD_REFERENCE_KG);
  return Number((distanceKm * BASE_FUEL_CONSUMPTION_L_PER_KM * loadMultiplier).toFixed(2));
}

/**
 * Menghitung emisi karbon truk (kg CO2) berdasarkan jarak dan berat muatan.
 * Formula: Jarak (km) * 0.35 * (1 + 0.15 * (Muatan / 5000)) * 2.68
 */
export function calculateTruckEmission(distanceKm: number, payloadKg: number): number {
  const fuelLiter = calculateTruckFuelLiter(distanceKm, payloadKg);
  return Number((fuelLiter * DIESEL_EMISSION_FACTOR_KG_CO2_PER_L).toFixed(2));
}

/**
 * Menghitung pengurangan emisi gas rumah kaca dari pengalihan sampah ke marketplace/daur ulang.
 * Formula: Berat Sampah Teralihkan (kg) * 1.20 kg CO2e/kg
 */
export function calculateWasteAvoidance(divertedWeightKg: number): number {
  if (divertedWeightKg <= 0) return 0;
  return Number((divertedWeightKg * WASTE_AVOIDANCE_FACTOR_KG_CO2E_PER_KG).toFixed(2));
}

/**
 * Menyusun ringkasan total neraca pengurangan karbon bersih (Transportasi + Limbah).
 */
export function buildCarbonSummary(
  regularRoute: RouteMetrics | null,
  ecoRoute: RouteMetrics | null,
  wasteDivertedKg: number
): CarbonSummary {
  const regularTruckEmissionKg = regularRoute ? regularRoute.carbonEmissionKg : 0;
  const optimizedTruckEmissionKg = ecoRoute ? ecoRoute.carbonEmissionKg : 0;
  const truckEmissionSavedKg = Math.max(
    0,
    Number((regularTruckEmissionKg - optimizedTruckEmissionKg).toFixed(2))
  );

  const wasteEmissionAvoidedKg = calculateWasteAvoidance(wasteDivertedKg);
  const totalCarbonSavedKg = Number((truckEmissionSavedKg + wasteEmissionAvoidedKg).toFixed(2));

  return {
    regularTruckEmissionKg,
    optimizedTruckEmissionKg,
    truckEmissionSavedKg,
    wasteDivertedKg: Number(wasteDivertedKg.toFixed(2)),
    wasteEmissionAvoidedKg,
    totalCarbonSavedKg,
  };
}

/**
 * Mengalikan metrik karbon dengan faktor skala Kota Surabaya (189 TPS = 12.6x) jika toggle aktif.
 */
export function applyCityScale(summary: CarbonSummary, isCityScaleMode: boolean): CarbonSummary {
  if (!isCityScaleMode) return summary;

  return {
    regularTruckEmissionKg: Number((summary.regularTruckEmissionKg * CITY_SCALE_MULTIPLIER).toFixed(2)),
    optimizedTruckEmissionKg: Number((summary.optimizedTruckEmissionKg * CITY_SCALE_MULTIPLIER).toFixed(2)),
    truckEmissionSavedKg: Number((summary.truckEmissionSavedKg * CITY_SCALE_MULTIPLIER).toFixed(2)),
    wasteDivertedKg: Number((summary.wasteDivertedKg * CITY_SCALE_MULTIPLIER).toFixed(2)),
    wasteEmissionAvoidedKg: Number((summary.wasteEmissionAvoidedKg * CITY_SCALE_MULTIPLIER).toFixed(2)),
    totalCarbonSavedKg: Number((summary.totalCarbonSavedKg * CITY_SCALE_MULTIPLIER).toFixed(2)),
  };
}

