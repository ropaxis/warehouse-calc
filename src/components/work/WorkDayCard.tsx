"use client";

import { useState } from "react";
import type { WorkDay } from "@/types/work";
import {
  calculateNormPercent,
  formatMoney,
  formatNumber,
} from "@/lib/workCalculations";
import { Modal } from "@/components/work/Modal";

type Props = {
  day: WorkDay;
  onEdit: (day: WorkDay) => void;
  onDelete: (id: string | number) => void;
};

export function WorkDayCard({ day, onEdit, onDelete }: Props) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const efficiency =
    Number(day.hours) > 0
      ? Number(day.packages) / Number(day.hours)
      : Number(day.efficient) || 0;

  const normPercent =
    typeof day.norm === "number" && day.norm > 0
      ? calculateNormPercent(
        Number(day.packages) || 0,
        Number(day.hours) || 0,
        day.norm,
      )
      : day.normPercent ?? 0;

  const handleDelete = () => {
    onDelete(day.id);
    setIsDeleteModalOpen(false);
  };

  return (
    <>
      <article className="flex flex-col justify-between gap-4 rounded-lg border border-gray-300 p-4 text-gray-900 sm:flex-row sm:items-start">
        <div className="min-w-0 space-y-1">
          <p className="font-bold">{day.date}</p>

          <p>Склад: {day.warehouse ?? "Старий запис"}</p>

          <p>
            Статус:{" "}
            {day.student === undefined
              ? "Не збережено"
              : day.student
                ? "Студент"
                : "Не студент"}
          </p>

          <p>Упаковок: {formatNumber(day.packages)}</p>
          <p>Годин: {formatNumber(day.hours)}</p>

          {day.norm !== undefined && (
            <>
              <p>Погодинна норма: {day.norm} упаковок/год</p>
              <p>Виконання норми: {formatNumber(normPercent)}%</p>
              <p>Поріг ставки: {day.rateTier}%</p>
              <p>
                Ставка: {day.ratePerPackage?.toLocaleString("pl-PL")} zł/упаковку
              </p>
            </>
          )}

          <p>Продуктивність: {formatNumber(efficiency)} упаковок/год</p>

          <p>
            Заробіток за упаковки:{" "}
            {day.earnings === undefined
              ? "Немає даних"
              : `${formatMoney(day.earnings)} zł`}
          </p>

          <p>Додатки: {formatMoney(Number(day.bonus) || 0)} zł</p>

          <p className="font-medium text-green-700">
            Разом:{" "}
            {day.earnings === undefined
              ? "Немає даних"
              : `${formatMoney(
                (Number(day.earnings) || 0) + (Number(day.bonus) || 0),
              )} zł`}
          </p>

          <p className="text-sm text-gray-600">
            Початок: {day.startTime ?? "—"} · Кінець: {day.endTime ?? "—"}
          </p>

          {day.entries && (
            <p className="break-words text-sm text-gray-600">
              Додані числа: {day.entries.join(" + ")}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-row gap-4 sm:flex-col sm:gap-3">
          <button
            type="button"
            onClick={() => onEdit(day)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Редагувати
          </button>

          <button
            type="button"
            onClick={() => setIsDeleteModalOpen(true)}
            className="text-sm text-red-600 hover:text-red-800"
          >
            Видалити
          </button>
        </div>
      </article>

      <Modal
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Підтвердження видалення"
        contentClassName="w-full max-w-md rounded-t-2xl bg-white p-5 text-gray-900 shadow-2xl sm:rounded-2xl"
      >
        <div className="space-y-4">
          <p>
            Ви дійсно хочете видалити робочий день за{" "}
            <strong>{day.date}</strong>?
          </p>

          <p className="text-sm text-gray-600">
            Цю дію може бути неможливо скасувати.
          </p>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100"
            >
              Скасувати
            </button>

            <button
              type="button"
              onClick={handleDelete}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Так, видалити
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}