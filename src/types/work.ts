export type Warehouse =
  | "P01" | "P02" | "P03" | "P04" | "P05" | "P06" | "P21" | "P28";

export type RateTier = 100 | 115 | 125;

export type WorkDay = {
  id: string | number;
  packages: number;
  hours: number;
  efficient: number;
  date: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  entries?: number[];
  student?: boolean;
  warehouse?: Warehouse;
  norm?: number;
  normPercent?: number;
  rateTier?: RateTier;
  ratePerPackage?: number;
  earnings?: number;
  bonus?: number;
};

export type WarehouseConfig = {
  norm: number;
  student: Record<RateTier, number>;
  nonStudent: Record<RateTier, number>;
};

export const WAREHOUSES: Record<Warehouse, WarehouseConfig> = {
  P01: { norm: 225, student: { 100: 0.170, 115: 0.175, 125: 0.180 }, nonStudent: { 100: 0.146, 115: 0.151, 125: 0.158 } },
  P02: { norm: 295, student: { 100: 0.130, 115: 0.133, 125: 0.137 }, nonStudent: { 100: 0.111, 115: 0.115, 125: 0.120 } },
  P03: { norm: 325, student: { 100: 0.120, 115: 0.123, 125: 0.127 }, nonStudent: { 100: 0.103, 115: 0.106, 125: 0.111 } },
  P04: { norm: 370, student: { 100: 0.104, 115: 0.107, 125: 0.110 }, nonStudent: { 100: 0.089, 115: 0.092, 125: 0.096 } },
  P05: { norm: 225, student: { 100: 0.176, 115: 0.181, 125: 0.186 }, nonStudent: { 100: 0.151, 115: 0.156, 125: 0.164 } },
  P06: { norm: 835, student: { 100: 0.0475, 115: 0.048, 125: 0.050 }, nonStudent: { 100: 0.0405, 115: 0.041, 125: 0.0423 } },
  P21: { norm: 220, student: { 100: 0.174, 115: 0.179, 125: 0.184 }, nonStudent: { 100: 0.149, 115: 0.154, 125: 0.161 } },
  P28: { norm: 210, student: { 100: 0.182, 115: 0.187, 125: 0.192 }, nonStudent: { 100: 0.156, 115: 0.161, 125: 0.169 } },
};
