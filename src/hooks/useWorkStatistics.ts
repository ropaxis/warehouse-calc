import { useMemo } from "react";
import type { WorkDay } from "@/types/work";
import type { WorkRecord } from "@/context/WorkContext";
import { calculateNormPercent } from "@/lib/workCalculations";

export type WorkStatisticsResult = {
  records: WorkDay[];
  packages: number;
  hours: number;
  efficiency: number;
  averagePercent: number;
  recordsWithNorm: number;
  earnings: number;
};

/** Calculates aggregate statistics without coupling the calculation to UI. */
export function useWorkStatistics(records: WorkRecord[], month: string): WorkStatisticsResult {
  return useMemo(() => {
    const filtered = (records as WorkDay[]).filter((record) =>
      Boolean(month) && typeof record.date === "string" && record.date.startsWith(month),
    );
    const packages = filtered.reduce((sum, record) => sum + (Number(record.packages) || 0), 0);
    const hours = filtered.reduce((sum, record) => sum + (Number(record.hours) || 0), 0);
    const normRecords = filtered.filter((record) =>
      typeof record.norm === "number" && record.norm > 0 && Number(record.hours) > 0 && Number(record.packages) >= 0,
    );
    const averagePercent = normRecords.length
      ? normRecords.reduce((sum, record) => sum + calculateNormPercent(Number(record.packages) || 0, Number(record.hours) || 0, record.norm || 0), 0) / normRecords.length
      : 0;
    const earnings = filtered.reduce((sum, record) => sum + (Number(record.earnings) || 0) + (Number(record.bonus) || 0), 0);
    return {
      records: filtered,
      packages,
      hours,
      efficiency: hours > 0 ? packages / hours : 0,
      averagePercent,
      recordsWithNorm: normRecords.length,
      earnings,
    };
  }, [records, month]);
}

export function calculatePeriodStatistics(records: WorkDay[]): WorkStatisticsResult {
  const packages = records.reduce((sum, record) => sum + (Number(record.packages) || 0), 0);
  const hours = records.reduce((sum, record) => sum + (Number(record.hours) || 0), 0);
  const normRecords = records.filter((record) => typeof record.norm === "number" && record.norm > 0 && Number(record.hours) > 0);
  const averagePercent = normRecords.length
    ? normRecords.reduce((sum, record) => sum + calculateNormPercent(Number(record.packages) || 0, Number(record.hours) || 0, record.norm || 0), 0) / normRecords.length
    : 0;
  const earnings = records.reduce((sum, record) => sum + (Number(record.earnings) || 0) + (Number(record.bonus) || 0), 0);
  return { records, packages, hours, efficiency: hours > 0 ? packages / hours : 0, averagePercent, recordsWithNorm: normRecords.length, earnings };
}
