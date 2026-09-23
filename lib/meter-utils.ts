/**
 * Utility functions for meter environment, CPU serial generation, and status badges.
 */

export type EnvironmentType = "Staging" | "Production" | "Dev/Test";

/**
 * Determines environment based on meter ID numeric range:
 * - IM000001 to IM000100 -> Staging
 * - IM000101 to IM000600 -> Production
 * - Anything else -> Dev/Test
 */
export function getEnvironmentByMeterId(meterId: string | null | undefined): EnvironmentType {
  if (!meterId) return "Dev/Test";

  // Match numeric portion after IM prefix or general numbers
  const match = meterId.match(/IM0*(\d+)/i) || meterId.match(/(\d+)/);
  if (match) {
    const num = parseInt(match[1], 10);
    if (num >= 1 && num <= 100) return "Staging";
    if (num >= 101 && num <= 600) return "Production";
  }

  return "Dev/Test";
}

/**
 * Generates a consistent dummy CPU Serial for any given meter.
 */
export function getDummyCpuSerial(meterId: string | null | undefined, index: number = 0): string {
  const idStr = meterId || `METER${index}`;
  // Simple hash for deterministic serial generation
  let hash = 0;
  for (let i = 0; i < idStr.length; i++) {
    hash = (hash << 5) - hash + idStr.charCodeAt(i);
    hash |= 0;
  }
  const hex1 = Math.abs(hash).toString(16).padStart(4, "0").toUpperCase().slice(0, 4);
  const hex2 = Math.abs(hash * 31).toString(16).padStart(4, "0").toUpperCase().slice(0, 4);
  return `CPU-${hex1}-${hex2}`;
}

/**
 * Generates dummy status: mostly Active, some Inactive.
 */
export function getDummyMeterStatus(meterId: string | null | undefined, index: number = 0): "Active" | "Inactive" {
  const idStr = meterId || `${index}`;
  let hash = 0;
  for (let i = 0; i < idStr.length; i++) {
    hash = (hash << 5) - hash + idStr.charCodeAt(i);
    hash |= 0;
  }
  // Roughly 85% Active, 15% Inactive
  return Math.abs(hash) % 7 === 0 ? "Inactive" : "Active";
}

