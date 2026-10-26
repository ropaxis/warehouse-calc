import type { WorkDay } from "@/types/work";
import { calculateNormPercent, formatMoney, formatNumber } from "@/lib/workCalculations";

type Props = { day: WorkDay; onEdit: (day: WorkDay) => void; onDelete: (id: string | number) => void };

function getDisplayedEndDate(day: WorkDay): string {
  if (day.endDate) return day.endDate;
  if (day.date && day.startTime && day.endTime && day.endTime <= day.startTime) {
    const [year, month, date] = day.date.split("-").map(Number);
    const next = new Date(Date.UTC(year, month - 1, date + 1));
    return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}-${String(next.getUTCDate()).padStart(2, "0")}`;
  }
  return day.date ?? "—";
}

export function WorkDayCard({ day, onEdit, onDelete }: Props) {
  const efficiency = Number(day.hours) > 0 ? Number(day.packages) / Number(day.hours) : Number(day.efficient) || 0;
  const normPercent = typeof day.norm === "number" && day.norm > 0 ? calculateNormPercent(Number(day.packages) || 0, Number(day.hours) || 0, day.norm) : day.normPercent ?? 0;

  // Визначаємо тип зміни за часом її початку:
  // ранок (приблизно 05:00), денна (приблизно 11:00), нічна (приблизно 20:00).
  const startHour = typeof day.startTime === "string" ? Number(day.startTime.slice(0, 2)) : NaN;
  const shiftStyle = Number.isFinite(startHour)
    ? startHour >= 4 && startHour < 9
      ? "border-amber-300 bg-amber-50 text-gray-900" // ранок
      : startHour >= 10 && startHour < 19
        ? "border-yellow-300 bg-yellow-100 text-gray-900" // день
        : startHour >= 19 || startHour < 4
          ? "border-slate-700 bg-slate-900 text-slate-100" // ніч
          : "border-gray-300 bg-white text-gray-900"
    : "border-gray-300 bg-white text-gray-900";

  const secondaryTextStyle = shiftStyle.includes("bg-slate-900") ? "text-slate-300" : "text-gray-600";
  return (
    <article className={`flex flex-col justify-between gap-4 rounded-lg border p-4 sm:flex-row sm:items-start ${shiftStyle}`}>

      <div className="min-w-0 space-y-1">
        <p className="font-bold">{day.date}</p>
        <p>Склад: {day.warehouse ?? "Старий запис"}</p>
        <p>Статус: {day.student === undefined ? "Не збережено" : day.student ? "Студент" : "Не студент"}</p>
        <p>Упаковок: {formatNumber(day.packages)}</p><p>Годин: {formatNumber(day.hours)}</p>
        {day.norm !== undefined && <><p>Погодинна норма: {day.norm} упаковок/год</p><p>Виконання норми: {formatNumber(normPercent)}%</p><p>Поріг ставки: {day.rateTier}%</p><p>Ставка: {day.ratePerPackage?.toLocaleString("pl-PL")} zł/упаковку</p></>}
        <p>Продуктивність: {formatNumber(efficiency)} упаковок/год</p>
        <p>Заробіток за упаковки: {day.earnings === undefined ? "Немає даних" : `${formatMoney(day.earnings)} zł`}</p>
        <p>Додатки: {formatMoney(Number(day.bonus) || 0)} zł</p>
        <p className={`font-medium ${shiftStyle.includes("bg-slate-900") ? "text-green-300" : "text-green-700"}`}>Разом: {day.earnings === undefined ? "Немає даних" : `${formatMoney((Number(day.earnings) || 0) + (Number(day.bonus) || 0))} zł`}</p>
        <p className={`text-sm ${secondaryTextStyle}`}>Початок: {day.date ?? "—"} {day.startTime ?? "—"}</p>
        <p className={`text-sm ${secondaryTextStyle}`}>Завершення: {getDisplayedEndDate(day)} {day.endTime ?? "—"}</p>
        {day.entries && <p className={`break-words text-sm ${secondaryTextStyle}`}>Додані числа: {day.entries.map((entry, index) => index === 0 ? String(entry) : entry < 0 ? ` − ${Math.abs(entry)}` : ` + ${entry}`).join("")}</p>}
      </div>
      <div className="flex shrink-0 flex-row gap-4 sm:flex-col sm:gap-3">
        <button type="button" onClick={() => onEdit(day)} className={`text-sm ${shiftStyle.includes("bg-slate-900") ? "text-sky-300 hover:text-sky-200" : "text-blue-600 hover:text-blue-800"}`}>Редагувати</button>
        <button type="button" onClick={() => onDelete(day.id)} className={`text-sm ${shiftStyle.includes("bg-slate-900") ? "text-red-300 hover:text-red-200" : "text-red-600 hover:text-red-800"}`}>Видалити</button>
      </div>
    </article>
  );
}
