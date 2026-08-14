/**
 * Lightweight client-side occupancy prediction.
 * Combines the live occupancy reading with a time-of-day demand curve to
 * estimate how many spaces will still be free when the driver arrives.
 */

/** Relative demand pressure by hour of day (0 = quiet, 1 = peak). */
const HOURLY_DEMAND = [
  0.05, 0.03, 0.02, 0.02, 0.03, 0.08, 0.2, 0.45, 0.75, 0.9, 0.95, 0.9, 0.85,
  0.8, 0.78, 0.8, 0.85, 0.95, 1.0, 0.9, 0.7, 0.5, 0.3, 0.15,
];

/** Average city driving speed used for ETA estimation (km/h). */
const AVG_SPEED_KMH = 22;

export function estimateEtaMinutes(distanceKm: number): number {
  return Math.max(1, Math.round((distanceKm / AVG_SPEED_KMH) * 60));
}

export function demandFactor(date = new Date()): number {
  const hour = date.getHours();
  const next = HOURLY_DEMAND[(hour + 1) % 24];
  const current = HOURLY_DEMAND[hour];
  const blend = date.getMinutes() / 60;
  return current + (next - current) * blend;
}

export interface AvailabilityPrediction {
  etaMinutes: number;
  currentFree: number;
  predictedFree: number;
  predictedOccupancyPercent: number;
  confidence: number;
}

export function predictAvailability({
  capacity,
  currentOccupancy,
  distanceKm,
  now = new Date(),
}: {
  capacity: number;
  currentOccupancy: number;
  distanceKm: number;
  now?: Date;
}): AvailabilityPrediction {
  const etaMinutes = estimateEtaMinutes(distanceKm);
  const arrival = new Date(now.getTime() + etaMinutes * 60000);
  const currentFree = Math.max(0, capacity - currentOccupancy);

  // Net arrival rate scales with demand at arrival time and remaining headroom.
  const demand = demandFactor(arrival);
  const netFillPerMinute = (capacity * 0.012) * (demand - 0.5);
  const predictedOccupancy = Math.min(
    capacity,
    Math.max(0, currentOccupancy + netFillPerMinute * etaMinutes)
  );

  const predictedFree = Math.max(0, Math.round(capacity - predictedOccupancy));
  const confidence = Math.max(55, Math.round(95 - etaMinutes * 0.8));

  return {
    etaMinutes,
    currentFree,
    predictedFree,
    predictedOccupancyPercent: capacity > 0 ? (predictedOccupancy / capacity) * 100 : 0,
    confidence,
  };
}

/** Heat colour for occupancy overlays (green → amber → red). */
export function occupancyHeatColor(percent: number): string {
  if (percent >= 90) return '#dc2626';
  if (percent >= 75) return '#f97316';
  if (percent >= 55) return '#f59e0b';
  if (percent >= 30) return '#84cc16';
  return '#22c55e';
}
