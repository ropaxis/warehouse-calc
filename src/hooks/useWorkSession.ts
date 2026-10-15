"use client";

import { useEffect, useState } from "react";
import { useWorkContext } from "@/context/WorkContext";
import type { Warehouse, WorkDay } from "@/types/work";
import { WAREHOUSES } from "@/types/work";
import { calculateNormPercent, getLocalDate, getLocalMonth, getRate, getRateTier, getTime } from "@/lib/workCalculations";

const STUDENT_STORAGE_KEY = "warehouse-calc-student";
const ACTIVE_SESSION_STORAGE_KEY = "warehouse-active-session";

export function useWorkSession() {
  const { addRecord } = useWorkContext();
  const [inputValue, setInputValue] = useState("");

  const [currentTotal, setCurrentTotal] = useState(0);

  const [entries, setEntries] = useState<number[]>([]);

  const [startTime, setStartTime] = useState<Date | null>(null);

  const [currentElapsedHours, setCurrentElapsedHours] = useState(0);

  const [student, setStudent] = useState(false);

  const [studentLoaded, setStudentLoaded] = useState(false);

  const [warehouse, setWarehouse] = useState<Warehouse | "">("");

  const [currentMonth, setCurrentMonth] = useState("");

  const [showEndConfirmation, setShowEndConfirmation] =

    useState(false);

  const [confirmationAnswer, setConfirmationAnswer] = useState("");

  const [confirmationNumbers, setConfirmationNumbers] = useState({

    a: 5,

    b: 11,

    answer: 16,

  });

  const [error, setError] = useState("");

  const [lastDay, setLastDay] = useState<WorkDay | null>(null);

  const [sessionLoaded, setSessionLoaded] = useState(false);

  // Завантаження налаштувань після монтування.

  useEffect(() => {

    const timer = setTimeout(() => {

      const savedStudent = localStorage.getItem(STUDENT_STORAGE_KEY);

      setStudent(savedStudent === "true");

      setStudentLoaded(true);

      const thisMonth = getLocalMonth(new Date());
      setCurrentMonth(thisMonth);

      // Відновлюємо незавершену сесію після перезавантаження сторінки.

      try {

        const rawSession = localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY);

        if (rawSession) {

          const saved = JSON.parse(rawSession) as {

            currentTotal?: number; entries?: number[]; startTime?: string;

            warehouse?: Warehouse | ""; student?: boolean; inputValue?: string;

          };

          if (saved.startTime) setStartTime(new Date(saved.startTime));

          setCurrentTotal(Number(saved.currentTotal) || 0);

          setEntries(Array.isArray(saved.entries) ? saved.entries : []);

          setWarehouse(saved.warehouse ?? "");

          if (typeof saved.student === "boolean") setStudent(saved.student);

          setInputValue(saved.inputValue ?? "");

        }

      } catch (restoreError) {

        console.error("Помилка відновлення поточної сесії:", restoreError);

      } finally {

        setSessionLoaded(true);

      }

    }, 0);

    return () => clearTimeout(timer);

  }, []);

  // Автозбереження незавершеної сесії. Запис видаляється лише після завершення дня.

  useEffect(() => {

    if (!sessionLoaded) return;

    try {

      if (startTime) {

        localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, JSON.stringify({

          currentTotal, entries, startTime: startTime.toISOString(),

          warehouse, student, inputValue,

        }));

      } else {

        localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);

      }

    } catch (saveError) {

      console.error("Помилка збереження поточної сесії:", saveError);

    }

  }, [sessionLoaded, startTime, currentTotal, entries, warehouse, student, inputValue]);

  // Оновлюємо тривалість поточного дня під час роботи.

  useEffect(() => {

    if (!startTime) return;

    const updateElapsedTime = () => {

      const elapsed =

        (Date.now() - startTime.getTime()) / 3600000;

      setCurrentElapsedHours(Math.max(0, elapsed));

    };

    const initialTimer = setTimeout(updateElapsedTime, 0);

    const interval = setInterval(updateElapsedTime, 1000);

    return () => {

      clearTimeout(initialTimer);

      clearInterval(interval);

    };

  }, [startTime]);

  function handleStudentChange(checked: boolean) {

    setStudent(checked);

    localStorage.setItem(STUDENT_STORAGE_KEY, String(checked));

  }

  const currentNorm =

    warehouse !== "" ? WAREHOUSES[warehouse].norm : 0;

  // Поточна продуктивність і виконання норми за фактичний час.

  const currentEfficiency =

    currentElapsedHours > 0

      ? currentTotal / currentElapsedHours

      : 0;

  const currentPercent =

    currentNorm > 0

      ? calculateNormPercent(

        currentTotal,

        currentElapsedHours,

        currentNorm

      )

      : 0;

  const currentTier = getRateTier(currentPercent);

  const currentRate =

    warehouse !== ""

      ? getRate(warehouse, student, currentTier)

      : 0;

  const estimatedEarnings = currentTotal * currentRate;

  function handleAdd() {

    const value = Number(inputValue);

    if (!studentLoaded) {

      setError("Зачекай, поки завантажаться налаштування.");

      return;

    }

    if (!warehouse) {

      setError("Перед початком роботи вибери склад.");

      return;

    }

    if (

      inputValue.trim() === "" ||

      !Number.isFinite(value) ||

      value <= 0

    ) {

      setError("Введи число більше нуля.");

      return;

    }

    if (showEndConfirmation) {

      setError("Спочатку підтвердь або скасуй завершення дня.");

      return;

    }

    const now = new Date();

    if (!startTime) {

      setStartTime(now);

      setCurrentElapsedHours(0);

    } else {

      setCurrentElapsedHours(

        Math.max(0, (now.getTime() - startTime.getTime()) / 3600000)

      );

    }

    setCurrentTotal((prev) => prev + value);

    setEntries((prev) => [...prev, value]);

    setInputValue("");

    setError("");

  }

  function handleEndDay() {

    if (!startTime || entries.length === 0 || !warehouse) {

      setError("Спочатку додай упаковки та вибери склад.");

      return;

    }

    const endTime = new Date();

    const hours =

      (endTime.getTime() - startTime.getTime()) / 3600000;

    const roundedHours = Math.round(hours * 100) / 100;

    const efficient =

      hours > 0

        ? Math.round((currentTotal / hours) * 100) / 100

        : 0;

    const norm = WAREHOUSES[warehouse].norm;

    // Важливо: норма порівнюється з продуктивністю за годину,

    // а не з загальною кількістю упаковок за день.

    const normPercent = calculateNormPercent(

      currentTotal,

      hours,

      norm

    );

    const rateTier = getRateTier(normPercent);

    const ratePerPackage = getRate(

      warehouse,

      student,

      rateTier

    );

    const earnings = Math.round(

      currentTotal * ratePerPackage * 100

    ) / 100;

    const completedDay: WorkDay = {

      id: `day-${Date.now()}`,

      packages: currentTotal,

      hours: roundedHours,

      efficient,

      date: getLocalDate(startTime),

      startTime: getTime(startTime),

      endTime: getTime(endTime),

      entries: [...entries],

      student,

      warehouse,

      norm,

      normPercent: Math.round(normPercent * 100) / 100,

      rateTier,

      ratePerPackage,

      earnings,

      bonus: 0,

    };

    addRecord({

      packages: completedDay.packages,

      hours: completedDay.hours,

      efficient: completedDay.efficient,

      date: completedDay.date,

      startTime: completedDay.startTime,

      endTime: completedDay.endTime,

      entries: completedDay.entries,

      student: completedDay.student,

      warehouse: completedDay.warehouse,

      norm: completedDay.norm,

      normPercent: completedDay.normPercent,

      rateTier: completedDay.rateTier,

      ratePerPackage: completedDay.ratePerPackage,

      earnings: completedDay.earnings,

      bonus: completedDay.bonus ?? 0,

    } as any);

    localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);

    setLastDay(completedDay);

    setCurrentTotal(0);

    setEntries([]);

    setStartTime(null);

    setCurrentElapsedHours(0);

    setInputValue("");

    setWarehouse("");

    setShowEndConfirmation(false);

    setConfirmationAnswer("");

    setError("");

  }

  function requestEndDay() {

    if (!startTime || entries.length === 0) {

      setError("Спочатку додай хоча б одне число.");

      return;

    }

    const a = Math.floor(Math.random() * 9) + 2;

    const b = Math.floor(Math.random() * 9) + 2;

    setConfirmationNumbers({

      a,

      b,

      answer: a + b,

    });

    setConfirmationAnswer("");

    setShowEndConfirmation(true);

    setError("");

  }

  function cancelEndDay() {

    setShowEndConfirmation(false);

    setConfirmationAnswer("");

    setError("");

  }

  return {
    inputValue, setInputValue, currentTotal, setCurrentTotal, entries, setEntries,
    startTime, setStartTime, currentElapsedHours, setCurrentElapsedHours,
    student, setStudent, studentLoaded, warehouse, setWarehouse, currentMonth,
    showEndConfirmation, setShowEndConfirmation, confirmationAnswer, setConfirmationAnswer,
    confirmationNumbers, setConfirmationNumbers, error, setError, lastDay, setLastDay,
    sessionLoaded, handleStudentChange, currentNorm, currentEfficiency, currentPercent,
    currentTier, currentRate, estimatedEarnings, handleAdd, handleEndDay, requestEndDay, cancelEndDay,
  };
}
