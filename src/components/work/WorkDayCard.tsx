import type { WorkDay } from "@/types/work";
import { calculateNormPercent, formatMoney, formatNumber } from "@/lib/workCalculations";

type Props = { day: WorkDay; onEdit: (day: WorkDay) => void; onDelete: (id: string | number) => void };

export function WorkDayCard({ day, onEdit, onDelete }: Props) {
  const efficiency = Number(day.hours) > 0 ? Number(day.packages) / Number(day.hours) : Number(day.efficient) || 0;
  const normPercent = typeof day.norm === "number" && day.norm > 0 ? calculateNormPercent(Number(day.packages) || 0, Number(day.hours) || 0, day.norm) : day.normPercent ?? 0;
  return (
    <article className="flex flex-col justify-between gap-4 rounded-lg border border-gray-300 p-4 text-gray-900 sm:flex-row sm:items-start">
      <div className="min-w-0 space-y-1">
        <p className="font-bold">{day.date}</p>
        <p>Склад: {day.warehouse ?? "Старий запис"}</p>
        <p>Статус: {day.student === undefined ? "Не збережено" : day.student ? "Студент" : "Не студент"}</p>
        <p className="font-medium text-green-700">Упаковок: {formatNumber(day.packages)}</p><p>Годин: {formatNumber(day.hours)}</p>
        {day.norm !== undefined && <><p>Погодинна норма: {day.norm} упаковок/год</p><p>Виконання норми: {formatNumber(normPercent)}%</p><p>Поріг ставки: {day.rateTier}%</p><p>Ставка: {day.ratePerPackage?.toLocaleString("pl-PL")} zł/упаковку</p></>}
        <p className="font-medium text-violet-900">Продуктивність: <span className="font-bold">{formatNumber(efficiency)}</span> упаковок/год</p>
        <p>Заробіток за упаковки: {day.earnings === undefined ? "Немає даних" : `${formatMoney(day.earnings)} zł`}</p>
        <p>Додатки: {formatMoney(Number(day.bonus) || 0)} zł</p>
        <p className="font-medium text-green-700">Разом: {day.earnings === undefined ? "Немає даних" : `${formatMoney((Number(day.earnings) || 0) + (Number(day.bonus) || 0))} zł`}</p>
        <p className="text-sm text-gray-600">Початок: {day.startTime ?? "—"} · Кінець: {day.endTime ?? "—"}</p>
        {day.entries && <p className="break-words text-sm text-gray-600">Додані числа: {day.entries.join(" + ")}</p>}
      </div>
      <div className="flex shrink-0 flex-row gap-4 sm:flex-col sm:gap-3">
        <button type="button" onClick={() => onEdit(day)} className="text-sm text-blue-600 hover:text-blue-800">Редагувати</button>
        <button type="button" onClick={() => onDelete(day.id)} className="text-sm text-red-600 hover:text-red-800">Видалити</button>
      </div>
    </article>
  );
}
