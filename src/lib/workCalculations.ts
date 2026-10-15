import type { RateTier, Warehouse } from "@/types/work";
import { WAREHOUSES } from "@/types/work";

export function getLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getLocalMonth(date: Date): string { return getLocalDate(date).slice(0, 7); }

export function getTime(date: Date): string {
  return date.toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" });
}

export function formatNumber(value: number, decimals = 2): string {
  return value.toLocaleString("pl-PL", { maximumFractionDigits: decimals });
}

export function formatMoney(value: number): string {
  return value.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function getRateTier(percent: number): RateTier {
  if (percent >= 125) return 125;
  if (percent >= 115) return 115;
  return 100;
}

export function getRate(warehouse: Warehouse, student: boolean, tier: RateTier): number {
  const config = WAREHOUSES[warehouse];
  return student ? config.student[tier] : config.nonStudent[tier];
}

export function calculateNormPercent(packages: number, hours: number, hourlyNorm: number): number {
  if (hours <= 0 || hourlyNorm <= 0) return 0;
  return ((packages / hours) / hourlyNorm) * 100;
}
