"use client";

import { useState } from "react";
import { useWorkContext } from "@/context/WorkContext";
import type { WorkDay } from "@/types/work";
import { WAREHOUSES } from "@/types/work";
import { calculateNormPercent, getRate, getRateTier } from "@/lib/workCalculations";

export function useWorkHistory() {
  const { records, updateRecord, deleteRecord } = useWorkContext();
  const [editingDayId, setEditingDayId] = useState<string | number | null>(null);

  const [editForm, setEditForm] = useState<WorkDay | null>(null);
  const [editPackagesInput, setEditPackagesInput] = useState("");
  const [editBonusInput, setEditBonusInput] = useState("");
  const [editError, setEditError] = useState("");

  function beginEditDay(day: WorkDay) {
    setEditingDayId(day.id);
    setEditForm({ ...day, bonus: Number(day.bonus) || 0 });
    setEditPackagesInput(String(day.packages ?? 0));
    setEditBonusInput(String(Number(day.bonus) || 0));
    setEditError("");
  }

  function saveEditedDay() {
    if (!editForm) {
      setEditError("Не вдалося знайти день для редагування. Закрий і відкрий форму ще раз.");
      return;
    }

    if (!editForm.warehouse || !WAREHOUSES[editForm.warehouse] || !editForm.date || !editForm.startTime || !editForm.endTime) {
      setEditError("Заповни дату, склад, час початку та час завершення.");
      return;
    }

    // Парсимо HH:mm вручну: Date(...T... ) може по-різному обробляти час
    // на різних мобільних браузерах та локалях.
    const parseTime = (value: string): number | null => {
      const match = value.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
      if (!match) return null;
      const hours = Number(match[1]);
      const minutes = Number(match[2]);
      if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
      return hours * 60 + minutes;
    };

    const startMinutes = parseTime(editForm.startTime);
    const endMinutes = parseTime(editForm.endTime);

    if (startMinutes === null || endMinutes === null) {
      setEditError("Не вдалося прочитати час. Вибери початок і кінець повторно.");
      return;
    }

    let durationMinutes = endMinutes - startMinutes;
    // Підтримка змін, що переходять через північ.
    if (durationMinutes < 0) durationMinutes += 24 * 60;

    if (durationMinutes <= 0) {
      setEditError("Час завершення має відрізнятися від часу початку.");
      return;
    }

    const hoursRaw = durationMinutes / 60;
    const parsedPackages = Number(editPackagesInput);
    const parsedBonus = Number(editBonusInput);

    if (
      editPackagesInput.trim() === "" ||
      !Number.isFinite(parsedPackages) ||
      parsedPackages < 0 ||
      editBonusInput.trim() === "" ||
      !Number.isFinite(parsedBonus) ||
      parsedBonus < 0
    ) {
      setEditError("Перевір кількість упаковок і додатки: введи числа не менші за 0.");
      return;
    }

    setEditError("");
    const packages = parsedPackages;

    const hours = Math.round(hoursRaw * 100) / 100;

    const efficient = Math.round((packages / hours) * 100) / 100;

    const norm = WAREHOUSES[editForm.warehouse].norm;

    const normPercent = calculateNormPercent(packages, hoursRaw, norm);

    const rateTier = getRateTier(normPercent);

    const ratePerPackage = getRate(editForm.warehouse, Boolean(editForm.student), rateTier);

    const earnings = Math.round(packages * ratePerPackage * 100) / 100;

    updateRecord(editForm.id, {

      ...editForm,

      packages,

      hours,

      efficient,

      norm,

      normPercent: Math.round(normPercent * 100) / 100,

      rateTier,

      ratePerPackage,

      earnings,

      bonus: parsedBonus,

      entries: packages === Number((records.find((r) => String(r.id) === String(editForm.id)) as WorkDay | undefined)?.packages)

        ? editForm.entries

        : [packages],

    } as any);

    setEditingDayId(null);
    setEditForm(null);
    setEditPackagesInput("");
    setEditBonusInput("");
  }

  const closeEdit = () => {
    setEditingDayId(null);
    setEditForm(null);
    setEditPackagesInput("");
    setEditBonusInput("");
    setEditError("");
  };

  return {
    deleteRecord,
    beginEditDay,
    editState: {
      form: editForm,
      dayId: editingDayId,
      packagesInput: editPackagesInput,
      bonusInput: editBonusInput,
      error: editError,
    },
    editActions: {
      setPackagesInput: setEditPackagesInput,
      setBonusInput: setEditBonusInput,
      setForm: setEditForm,
      save: saveEditedDay,
      close: closeEdit,
    },
  };
}
