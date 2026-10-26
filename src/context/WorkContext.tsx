"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type WorkRecord = {
  id: string;
  student?: boolean;
  warehouse?: string;
  norm?: number;
  normPercent?: number;
  rateTier?: 100 | 115 | 125;
  ratePerPackage?: number;
  earnings?: number;
  bonus?: number;
  packages: number;
  hours: number;
  efficient?: number;
  date?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  entries?: number[];
};

interface WorkContextType {
  records: WorkRecord[];
  addRecord: (record: Omit<WorkRecord, "id">) => void;
  updateRecord: (id: string | number, updates: Partial<WorkRecord>) => void;
  deleteRecord: (id: string | number) => void;
}

const WorkContext = createContext<WorkContextType | null>(null);
const STORAGE_KEY = "warehouse-work-records";

export function useWorkContext() {
  const context = useContext(WorkContext);
  if (!context) throw new Error("useWorkContext must be used within WorkProvider");
  return context;
}

export function WorkProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState<WorkRecord[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (Array.isArray(parsed)) setRecords(parsed as WorkRecord[]);
      }
    } catch (error) {
      console.error("Помилка завантаження записів:", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch (error) {
      console.error("Помилка збереження записів:", error);
    }
  }, [records, isLoaded]);

  function addRecord(record: Omit<WorkRecord, "id">) {
    const newRecord: WorkRecord = {
      ...record,
      id: typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `day-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    };
    setRecords((prev) => [...prev, newRecord]);
  }

  function updateRecord(id: string | number, updates: Partial<WorkRecord>) {
    setRecords((prev) => prev.map((record) =>
      String(record.id) === String(id) ? { ...record, ...updates } : record
    ));
  }

  function deleteRecord(id: string | number) {
    setRecords((prev) => prev.filter((record) => String(record.id) !== String(id)));
  }

  return (
    <WorkContext.Provider value={{ records, addRecord, updateRecord, deleteRecord }}>
      {children}
    </WorkContext.Provider>
  );
}
