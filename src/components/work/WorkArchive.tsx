"use client";

import { useMemo, useState } from "react";
import { useWorkContext } from "@/context/WorkContext";
import type { WorkDay } from "@/types/work";
import { calculatePeriodStatistics } from "@/hooks/useWorkStatistics";
import { formatMoney, formatNumber } from "@/lib/workCalculations";
import { WorkDayCard } from "@/components/work/WorkDayCard";

type Props = {
  currentMonth: string;
  onEdit: (day: WorkDay) => void;
  onDelete: (id: string | number) => void;
};

export function WorkArchive({ currentMonth, onEdit, onDelete }: Props) {
  const { records } = useWorkContext();
  const [showHistory, setShowHistory] = useState(false);
  const [archiveMonth, setArchiveMonth] = useState("");
  const archiveMonths = useMemo(() => Array.from(new Set([
    currentMonth,
    ...(records as WorkDay[]).map((record) => typeof record.date === "string" && record.date.length >= 7 ? record.date.slice(0, 7) : ""),
  ].filter(Boolean))).sort((a, b) => b.localeCompare(a)), [records, currentMonth]);
  const selectedMonth = archiveMonth || currentMonth || "__all__";
  const archiveRecords = useMemo(() => (records as WorkDay[])
    .filter((record) => selectedMonth === "__all__" || (typeof record.date === "string" && record.date.startsWith(selectedMonth)))
    .sort((a, b) => {
      const dateCompare = (b.date || "").localeCompare(a.date || "");
      return dateCompare || (b.startTime || "").localeCompare(a.startTime || "");
    }), [records, selectedMonth]);
  const stats = calculatePeriodStatistics(archiveRecords);
  const monthLabel = selectedMonth !== "__all__" ? new Date(`${selectedMonth}-01T12:00:00`).toLocaleDateString("uk-UA", { month: "long", year: "numeric" }) : "";

  return (
    <section>
      <button type="button" onClick={() => setShowHistory((shown) => !shown)} className="mb-4 flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-4 py-3 text-left text-xl font-bold text-gray-900"><span>Історія роботи ({records.length})</span><span>{showHistory ? "− Згорнути" : "+ Розгорнути"}</span></button>
      {showHistory && <div className="space-y-4">
        <section className="rounded-xl border border-gray-300 bg-white p-5 text-gray-900 shadow-sm">
          <label htmlFor="archive-month" className="mb-2 block font-bold">Архів за місяцями</label>
          <select id="archive-month" value={selectedMonth} onChange={(event) => setArchiveMonth(event.target.value)} className="w-full rounded-lg border border-gray-400 bg-white px-3 py-3 text-gray-900"><option value="__all__">За весь час</option>{archiveMonths.map((month) => <option key={month} value={month}>{new Date(`${month}-01T12:00:00`).toLocaleDateString("uk-UA", { month: "long", year: "numeric" })}</option>)}</select>
          <h3 className="mt-5 text-lg font-bold">{selectedMonth === "__all__" ? "Загальна статистика за весь час" : `Статистика за ${monthLabel || "місяць"}`}</h3>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-gray-50 p-3"><p className="text-sm text-gray-700">{selectedMonth === "__all__" ? "Усього упаковок" : "Упаковок"}</p><p className="text-xl font-bold">{formatNumber(stats.packages)}</p></div>
            <div className="rounded-lg bg-gray-50 p-3"><p className="text-sm text-gray-700">{selectedMonth === "__all__" ? "Усього годин" : "Годин"}</p><p className="text-xl font-bold">{formatNumber(stats.hours)} год.</p></div>
            <div className="rounded-lg bg-gray-50 p-3"><p className="text-sm text-gray-700">Продуктивність</p><p className="text-xl font-bold">{formatNumber(stats.efficiency)} упаковок/год</p></div>
            <div className="rounded-lg bg-gray-50 p-3"><p className="text-sm text-gray-700">Середнє виконання норми</p><p className="text-xl font-bold">{formatNumber(stats.averagePercent)}%</p></div>
            <div className="rounded-lg bg-gray-50 p-3 sm:col-span-2"><p className="text-sm text-gray-700">{selectedMonth === "__all__" ? "Загальний заробіток" : "Заробіток"}</p><p className="text-2xl font-bold text-green-700">{formatMoney(stats.earnings)} zł</p><p className="text-sm text-gray-600">Робочих днів: {archiveRecords.length}</p></div>
          </div>
        </section>
        {archiveRecords.length === 0 ? <p className="text-gray-600">{selectedMonth === "__all__" ? "Завершених робочих днів поки немає." : "За цей місяць завершених робочих днів немає."}</p> : <div className="space-y-3 rounded-xl border border-gray-300 bg-white p-5 text-gray-900 shadow-sm"><p className="text-sm text-gray-600">Дні від найновішого до найстарішого. Перший робочий день місяця буде внизу списку.</p>{archiveRecords.map((day) => <WorkDayCard key={String(day.id)} day={day} onEdit={onEdit} onDelete={onDelete} />)}</div>}
      </div>}
    </section>
  );
}
