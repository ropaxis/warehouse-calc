import { useWorkContext } from "@/context/WorkContext";
import { useWorkStatistics } from "@/hooks/useWorkStatistics";
import { formatMoney, formatNumber } from "@/lib/workCalculations";

type Props = { currentMonth: string };

export function WorkStatistics({ currentMonth }: Props) {
  const { records } = useWorkContext();
  const stats = useWorkStatistics(records, currentMonth);
  return (
    <section className="rounded-xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
      <h2 className="text-xl font-bold text-blue-900">Статистика за місяць</h2>
      <p className="mt-1 text-sm text-gray-700">{currentMonth || "Завантаження статистики..."}</p>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-lg bg-white p-4"><p className="text-sm text-gray-700">Усього упаковок</p><p className="mt-1 text-2xl font-bold text-blue-700">{formatNumber(stats.packages)}</p></div>
        <div className="rounded-lg bg-white p-4"><p className="text-sm text-gray-700">Загальний час роботи</p><p className="mt-1 text-2xl font-bold text-gray-900">{formatNumber(stats.hours)} год.</p></div>
        <div className="rounded-lg bg-white p-4"><p className="text-sm text-gray-700">Продуктивність за місяць</p><p className="mt-1 text-2xl font-bold text-gray-900">{formatNumber(stats.efficiency)} упаковок/год</p></div>
        <div className="rounded-lg bg-white p-4"><p className="text-sm text-gray-700">Середнє виконання норми</p><p className="mt-1 text-2xl font-bold text-gray-900">{formatNumber(stats.averagePercent)}%</p><p className="mt-1 text-xs text-gray-600">Днів із даними для розрахунку: {stats.recordsWithNorm}</p></div>
        <div className="rounded-lg bg-white p-4 sm:col-span-2"><p className="text-sm text-gray-700">Заробіток за місяць</p><p className="mt-1 text-3xl font-bold text-green-700">{formatMoney(stats.earnings)} zł</p><p className="mt-1 text-xs text-gray-600">Сума збережених заробітків завершених днів</p></div>
      </div>
      <p className="mt-4 text-sm text-gray-700">Завершених днів: {stats.records.length}</p>
    </section>
  );
}
