"use client";

import { useState } from "react";
import { useWorkContext } from "@/context/WorkContext";
import type { WorkDay } from "@/types/work";
import { WAREHOUSES } from "@/types/work";
import { calculateNormPercent, getRate, getRateTier } from "@/lib/workCalculations";

function addOneDay(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + 1));
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}-${String(next.getUTCDate()).padStart(2, "0")}`;
}

export function useWorkHistory() {
  const { records, updateRecord, deleteRecord } = useWorkContext();
  const [editingDayId, setEditingDayId] = useState<string | number | null>(null);
  const [editForm, setEditForm] = useState<WorkDay | null>(null);
  const [editPackagesInput, setEditPackagesInput] = useState("");
  const [editBonusInput, setEditBonusInput] = useState("");
  const [editError, setEditError] = useState("");

  function beginEditDay(day: WorkDay) {
    const startDate = day.date ?? "";
    const inferredEndDate = day.endDate ?? (
      day.startTime && day.endTime && day.endTime <= day.startTime ? addOneDay(startDate) : startDate
    );
    setEditingDayId(day.id);
    setEditForm({ ...day, endDate: inferredEndDate, bonus: Number(day.bonus) || 0 });
    setEditPackagesInput(String(day.packages ?? 0));
    setEditBonusInput(String(Number(day.bonus) || 0));
    setEditError("");
  }

  function saveEditedDay() {
    if (!editForm) {
      setEditError("Не вдалося знайти день для редагування. Закрий і відкрий форму ще раз.");
      return;
    }

    const startDate = editForm.date ?? "";
    const endDate = editForm.endDate || startDate;
    if (!editForm.warehouse || !WAREHOUSES[editForm.warehouse] || !startDate || !endDate || !editForm.startTime || !editForm.endTime) {
      setEditError("Заповни день і час початку, день і час завершення та склад.");
      return;
    }

    const startTimestamp = new Date(`${startDate}T${editForm.startTime}:00`).getTime();
    const endTimestamp = new Date(`${endDate}T${editForm.endTime}:00`).getTime();
    if (!Number.isFinite(startTimestamp) || !Number.isFinite(endTimestamp)) {
      setEditError("Не вдалося прочитати дату або час. Перевір усі чотири поля.");
      return;
    }
    if (endTimestamp <= startTimestamp) {
      setEditError("Дата й час завершення мають бути пізніше дати й часу початку.");
      return;
    }

    const parsedPackages = Number(editPackagesInput);
    const parsedBonus = Number(editBonusInput);
    if (
      editPackagesInput.trim() === "" || !Number.isFinite(parsedPackages) || parsedPackages < 0 ||
      !Number.isInteger(parsedPackages) || editBonusInput.trim() === "" || !Number.isFinite(parsedBonus) || parsedBonus < 0
    ) {
      setEditError("Перевір кількість упаковок і додатки: упаковки мають бути цілим числом від 0, додатки — числом від 0.");
      return;
    }

    const original = records.find((record) => String(record.id) === String(editForm.id));
    const oldPackages = Number(original?.packages) || 0;
    const previousEntries = Array.isArray(original?.entries) ? [...original.entries] : (oldPackages > 0 ? [oldPackages] : []);
    const entriesTotal = previousEntries.reduce((sum, entry) => sum + Number(entry || 0), 0);
    const adjustment = parsedPackages - entriesTotal;
    const updatedEntries = [...previousEntries];
    if (adjustment !== 0) updatedEntries.push(adjustment);

    setEditError("");
    const hoursRaw = (endTimestamp - startTimestamp) / 3_600_000;
    const hours = Math.round(hoursRaw * 100) / 100;
    const efficient = hoursRaw > 0 ? Math.round((parsedPackages / hoursRaw) * 100) / 100 : 0;
    const norm = WAREHOUSES[editForm.warehouse].norm;
    const normPercent = calculateNormPercent(parsedPackages, hoursRaw, norm);
    const rateTier = getRateTier(normPercent);
    const ratePerPackage = getRate(editForm.warehouse, Boolean(editForm.student), rateTier);
    const earnings = Math.round(parsedPackages * ratePerPackage * 100) / 100;

    updateRecord(editForm.id, {
      ...editForm,
      date: startDate,
      endDate,
      packages: parsedPackages,
      hours,
      efficient,
      norm,
      normPercent: Math.round(normPercent * 100) / 100,
      rateTier,
      ratePerPackage,
      earnings,
      bonus: parsedBonus,
      entries: updatedEntries,
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
