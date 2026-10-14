

"use client";

import { useEffect, useState } from "react";

import { useWorkContext } from "@/context/WorkContext";

type Warehouse =

  | "P01"

  | "P02"

  | "P03"

  | "P04"

  | "P05"

  | "P06"

  | "P21"

  | "P28";

type RateTier = 100 | 115 | 125;

type WorkDay = {

  id: string | number;

  packages: number;

  hours: number;

  efficient: number;

  date: string;

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

const STUDENT_STORAGE_KEY = "warehouse-calc-student";

const ACTIVE_SESSION_STORAGE_KEY = "warehouse-active-session";

const WAREHOUSES: Record<

  Warehouse,

  {

    norm: number;

    student: Record<RateTier, number>;

    nonStudent: Record<RateTier, number>;

  }

> = {

  P01: {

    norm: 225,

    student: { 100: 0.170, 115: 0.175, 125: 0.180 },

    nonStudent: { 100: 0.146, 115: 0.151, 125: 0.158 },

  },

  P02: {

    norm: 295,

    student: { 100: 0.130, 115: 0.133, 125: 0.137 },

    nonStudent: { 100: 0.111, 115: 0.115, 125: 0.120 },

  },

  P03: {

    norm: 325,

    student: { 100: 0.120, 115: 0.123, 125: 0.127 },

    nonStudent: { 100: 0.103, 115: 0.106, 125: 0.111 },

  },

  P04: {

    norm: 370,

    student: { 100: 0.104, 115: 0.107, 125: 0.110 },

    nonStudent: { 100: 0.089, 115: 0.092, 125: 0.096 },

  },

  P05: {

    norm: 225,

    student: { 100: 0.176, 115: 0.181, 125: 0.186 },

    nonStudent: { 100: 0.151, 115: 0.156, 125: 0.164 },

  },

  P06: {

    norm: 835,

    student: { 100: 0.0475, 115: 0.048, 125: 0.050 },

    nonStudent: { 100: 0.0405, 115: 0.041, 125: 0.0423 },

  },

  P21: {

    norm: 220,

    student: { 100: 0.174, 115: 0.179, 125: 0.184 },

    nonStudent: { 100: 0.149, 115: 0.154, 125: 0.161 },

  },

  P28: {

    norm: 210,

    student: { 100: 0.182, 115: 0.187, 125: 0.192 },

    nonStudent: { 100: 0.156, 115: 0.161, 125: 0.169 },

  },

};

function getLocalDate(date: Date): string {

  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;

}

function getLocalMonth(date: Date): string {

  return getLocalDate(date).slice(0, 7);

}

function getTime(date: Date): string {

  return date.toLocaleTimeString("uk-UA", {

    hour: "2-digit",

    minute: "2-digit",

  });

}

function formatNumber(value: number, decimals = 2): string {

  return value.toLocaleString("pl-PL", {

    maximumFractionDigits: decimals,

  });

}

function formatMoney(value: number): string {

  return value.toLocaleString("pl-PL", {

    minimumFractionDigits: 2,

    maximumFractionDigits: 2,

  });

}

function getRateTier(percent: number): RateTier {

  if (percent >= 125) return 125;

  if (percent >= 115) return 115;

  return 100;

}

function getRate(

  warehouse: Warehouse,

  student: boolean,

  tier: RateTier

): number {

  const config = WAREHOUSES[warehouse];

  return student

    ? config.student[tier]

    : config.nonStudent[tier];

}

/**

 * Виконання норми:

 * (кількість упаковок / відпрацьовані години) / норма за годину * 100.

 */

function calculateNormPercent(

  packages: number,

  hours: number,

  hourlyNorm: number

): number {

  if (hours <= 0 || hourlyNorm <= 0) return 0;

  const packagesPerHour = packages / hours;

  return (packagesPerHour / hourlyNorm) * 100;

}

export default function Home() {

  const { records, addRecord, updateRecord, deleteRecord } = useWorkContext();

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

  const [showHistory, setShowHistory] = useState(false);

  const [editingDayId, setEditingDayId] = useState<string | number | null>(null);

  const [editForm, setEditForm] = useState<WorkDay | null>(null);
  const [editPackagesInput, setEditPackagesInput] = useState("");
  const [editBonusInput, setEditBonusInput] = useState("");

  // Завантаження налаштувань після монтування.

  useEffect(() => {

    const timer = setTimeout(() => {

      const savedStudent = localStorage.getItem(STUDENT_STORAGE_KEY);

      setStudent(savedStudent === "true");

      setStudentLoaded(true);

      setCurrentMonth(getLocalMonth(new Date()));

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

  const monthlyRecords = records.filter((record) => {

    const day = record as WorkDay;

    return (

      currentMonth !== "" &&

      typeof day.date === "string" &&

      day.date.startsWith(currentMonth)

    );

  });

  const monthlyPackages = monthlyRecords.reduce(

    (total, record) =>

      total + (Number(record.packages) || 0),

    0

  );

  const monthlyHours = monthlyRecords.reduce(

    (total, record) =>

      total + (Number(record.hours) || 0),

    0

  );

  const monthlyEfficiency =

    monthlyHours > 0 ? monthlyPackages / monthlyHours : 0;

  // Перераховуємо виконання норми з упаковок, годин і погодинної норми.

  // Це також виправляє відображення старих записів, якщо в них є ці дані.

  const percentageRecords = monthlyRecords.filter((record) => {

    const day = record as WorkDay;

    return (

      typeof day.norm === "number" &&

      day.norm > 0 &&

      Number(day.hours) > 0 &&

      Number(day.packages) >= 0

    );

  });

  const monthlyAveragePercent =

    percentageRecords.length > 0

      ? percentageRecords.reduce((total, record) => {

        const day = record as WorkDay;

        return (

          total +

          calculateNormPercent(

            Number(day.packages) || 0,

            Number(day.hours) || 0,

            day.norm || 0

          )

        );

      }, 0) / percentageRecords.length

      : 0;

  // Заробіток за місяць: сума фактично збережених заробітків.

  const monthlyEarnings = monthlyRecords.reduce(

    (total, record) => {

      const day = record as WorkDay;

      return total + (typeof day.earnings === "number" ? day.earnings : 0) + (Number(day.bonus) || 0);

    },

    0

  );

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

  function beginEditDay(day: WorkDay) {
    setEditingDayId(day.id);
    setEditForm({ ...day, bonus: Number(day.bonus) || 0 });
    setEditPackagesInput(String(day.packages ?? 0));
    setEditBonusInput(String(Number(day.bonus) || 0));
  }

  function saveEditedDay() {

    if (!editForm || !editForm.warehouse || !editForm.date || !editForm.startTime || !editForm.endTime) return;

    const start = new Date(`${editForm.date}T${editForm.startTime}:00`);

    let end = new Date(`${editForm.date}T${editForm.endTime}:00`);

    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) return;

    // Підтримка змін, що переходять через північ.

    if (end.getTime() < start.getTime()) end = new Date(end.getTime() + 24 * 60 * 60 * 1000);

    const hoursRaw = (end.getTime() - start.getTime()) / 3600000;

    if (hoursRaw <= 0) return;

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
      return;
    }

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

  return (

    <main className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">

      <h1 className="text-2xl font-bold text-white">

        Облік робочого дня

      </h1>

      {/* Місячна статистика */}

      <section className="rounded-xl border border-blue-200 bg-blue-50 p-5 shadow-sm">

        <h2 className="text-xl font-bold text-blue-900">

          Статистика за місяць

        </h2>

        <p className="mt-1 text-sm text-gray-700">

          {currentMonth || "Завантаження статистики..."}

        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">

          <div className="rounded-lg bg-white p-4">

            <p className="text-sm text-gray-700">Усього упаковок</p>

            <p className="mt-1 text-2xl font-bold text-blue-700">

              {formatNumber(monthlyPackages)}

            </p>

          </div>

          <div className="rounded-lg bg-white p-4">

            <p className="text-sm text-gray-700">Загальний час роботи</p>

            <p className="mt-1 text-2xl font-bold text-gray-900">

              {formatNumber(monthlyHours)} год.

            </p>

          </div>

          <div className="rounded-lg bg-white p-4">

            <p className="text-sm text-gray-700">

              Продуктивність за місяць

            </p>

            <p className="mt-1 text-2xl font-bold text-gray-900">

              {formatNumber(monthlyEfficiency)} упаковок/год

            </p>

          </div>

          <div className="rounded-lg bg-white p-4">

            <p className="text-sm text-gray-700">

              Середнє виконання норми

            </p>

            <p className="mt-1 text-2xl font-bold text-gray-900">

              {formatNumber(monthlyAveragePercent)}%

            </p>

            <p className="mt-1 text-xs text-gray-600">

              Днів із даними для розрахунку: {percentageRecords.length}

            </p>

          </div>

          <div className="rounded-lg bg-white p-4 sm:col-span-2">

            <p className="text-sm text-gray-700">Заробіток за місяць</p>

            <p className="mt-1 text-3xl font-bold text-green-700">

              {formatMoney(monthlyEarnings)} zł

            </p>

            <p className="mt-1 text-xs text-gray-600">

              Сума збережених заробітків завершених днів

            </p>

          </div>

        </div>

        <p className="mt-4 text-sm text-gray-700">

          Завершених днів: {monthlyRecords.length}

        </p>

      </section>

      {/* Налаштування перед роботою */}

      <section className="space-y-4 rounded-xl border border-gray-300 bg-white p-5 text-gray-900 shadow-sm">

        <h2 className="text-xl font-bold">

          Налаштування робочого дня

        </h2>

        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-300 bg-white p-4 text-gray-900">

          <input

            type="checkbox"

            checked={student}

            disabled={!studentLoaded || startTime !== null}

            onChange={(event) =>

              handleStudentChange(event.target.checked)

            }

            className="h-5 w-5 shrink-0 accent-blue-600 disabled:cursor-not-allowed"

          />

          <span>

            <span className="block font-medium text-gray-900">

              Я студент

            </span>

            <span className="block text-sm text-gray-700">

              {studentLoaded

                ? student

                  ? "Застосовуються ставки для студента"

                  : "Застосовуються ставки для не студента"

                : "Завантаження налаштувань..."}

            </span>

          </span>

        </label>

        <div>

          <label

            htmlFor="warehouse"

            className="mb-2 block font-medium text-gray-900"

          >

            Обери склад

          </label>

          <select

            id="warehouse"

            value={warehouse}

            disabled={startTime !== null || !studentLoaded}

            onChange={(event) =>

              setWarehouse(event.target.value as Warehouse | "")

            }

            className="w-full rounded-lg border border-gray-400 bg-white px-3 py-3 text-gray-900 disabled:bg-gray-100"

          >

            <option value="">-- Вибери склад --</option>

            {Object.entries(WAREHOUSES).map(([code, config]) => (

              <option key={code} value={code}>

                {code} — норма {config.norm} упаковок/год

              </option>

            ))}

          </select>

        </div>

        {warehouse && (

          <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-900">

            <p>

              Погодинна норма:{" "}

              <strong>{currentNorm} упаковок/год</strong>

            </p>

            <p>

              Статус:{" "}

              <strong>{student ? "Студент" : "Не студент"}</strong>

            </p>

            <p>

              Фактична продуктивність:{" "}

              <strong>

                {formatNumber(currentEfficiency)} упаковок/год

              </strong>

            </p>

            <p>

              Виконання норми:{" "}

              <strong>{formatNumber(currentPercent)}%</strong>

            </p>

            <p>

              Поточний поріг ставки:{" "}

              <strong>{currentTier}%</strong>

            </p>

            <p>

              Ставка:{" "}

              <strong>

                {currentRate.toLocaleString("pl-PL")} zł/упаковку

              </strong>

            </p>

            <p>

              Орієнтовний заробіток:{" "}

              <strong>{formatMoney(estimatedEarnings)} zł</strong>

            </p>

            <p className="mt-2 text-xs text-gray-600">

              Виконання норми розраховується за кількістю упаковок

              за годину. Ставка переходить на наступний рівень при

              досягненні 115% або 125% погодинної норми.

            </p>

          </div>

        )}

      </section>

      {/* Поточний робочий день */}

      <section className="rounded-xl border border-gray-300 bg-white p-5 text-gray-900 shadow-sm">

        <h2 className="text-xl font-bold">Поточний робочий день</h2>

        <p className="mt-3 text-sm text-gray-700">

          Поточна сума упаковок

        </p>

        <p className="my-2 text-4xl font-bold text-blue-600">

          {formatNumber(currentTotal)}

        </p>

        <p className="text-sm text-gray-700">

          Дата: {startTime ? getLocalDate(startTime) : "Ще не розпочато"}

        </p>

        <p className="text-sm text-gray-700">

          Початок роботи: {startTime ? getTime(startTime) : "Ще не розпочато"}

        </p>

        <p className="text-sm text-gray-700">

          Час від початку: {formatNumber(currentElapsedHours)} год.

        </p>

        <form

          className="mt-5 flex gap-2"

          onSubmit={(event) => {

            event.preventDefault();

            handleAdd();

          }}

        >

          <input

            type="number"

            min="0.01"

            step="any"

            value={inputValue}

            onChange={(event) => setInputValue(event.target.value)}

            placeholder="Кількість упаковок"

            disabled={showEndConfirmation}

            className="min-w-0 flex-1 rounded-lg border border-gray-400 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-500 disabled:bg-gray-100"

          />

          <button

            type="submit"

            disabled={showEndConfirmation || !studentLoaded}

            className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-40"

          >

            Додати

          </button>

        </form>

        {entries.length > 0 && (

          <div className="mt-4">

            <p className="mb-2 font-medium">Додані числа</p>

            <div className="flex flex-wrap gap-2">

              {entries.map((entry, index) => (

                <span

                  key={index}

                  className="rounded bg-gray-100 px-3 py-1 text-sm text-gray-900"

                >

                  +{formatNumber(entry)}

                </span>

              ))}

            </div>

          </div>

        )}

        {error && (

          <p className="mt-3 text-sm text-red-600">{error}</p>

        )}

        {!showEndConfirmation && (

          <button

            onClick={requestEndDay}

            disabled={!startTime}

            className="mt-5 w-full rounded-lg bg-red-600 px-4 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"

          >

            Кінець дня

          </button>

        )}

        {showEndConfirmation && (

          <div className="mt-5 space-y-4 rounded-lg border border-orange-300 p-4">

            <h2 className="text-lg font-bold">

              Підтвердження завершення дня

            </h2>

            <p className="text-sm text-gray-700">

              Розв’яжи приклад, щоб завершити робочий день.

            </p>

            <p className="text-3xl font-bold">

              {confirmationNumbers.a} + {confirmationNumbers.b} = ?

            </p>

            <input

              type="number"

              value={confirmationAnswer}

              onChange={(event) =>

                setConfirmationAnswer(event.target.value)

              }

              placeholder="Введи відповідь"

              className="w-full rounded-lg border border-gray-400 px-3 py-3 text-lg text-gray-900"

            />

            <button

              disabled={

                confirmationAnswer.trim() === "" ||

                Number(confirmationAnswer) !== confirmationNumbers.answer

              }

              onClick={handleEndDay}

              className="w-full rounded-lg bg-green-600 px-4 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"

            >

              Підтвердити завершення дня

            </button>

            <button

              onClick={cancelEndDay}

              className="w-full rounded-lg border border-gray-400 px-4 py-2 text-gray-900"

            >

              Скасувати

            </button>

          </div>

        )}

      </section>

      {/* Останній завершений день */}

      {lastDay && (

        <section className="rounded-xl border border-green-300 p-5 text-gray-900 bg-white">

          <h2 className="text-xl font-bold">

            Останній завершений день

          </h2>

          <div className="mt-3 space-y-2">

            <p>Дата: {lastDay.date}</p>

            <p>Склад: {lastDay.warehouse}</p>

            <p>Статус: {lastDay.student ? "Студент" : "Не студент"}</p>

            <p>Початок: {lastDay.startTime}</p>

            <p>Кінець: {lastDay.endTime}</p>

            <p>Тривалість: {formatNumber(lastDay.hours)} год.</p>

            <p>Усього упаковок: {formatNumber(lastDay.packages)}</p>

            <p>Погодинна норма: {lastDay.norm} упаковок/год</p>

            <p>

              Продуктивність:{" "}

              {formatNumber(lastDay.efficient)} упаковок/год

            </p>

            <p>

              Виконання норми:{" "}

              <strong>{formatNumber(lastDay.normPercent ?? 0)}%</strong>

            </p>

            <p>Застосований поріг: {lastDay.rateTier}%</p>

            <p>

              Ставка:{" "}

              {lastDay.ratePerPackage?.toLocaleString("pl-PL")} zł/упаковку

            </p>

            <p>

              Заробіток за упаковки: <strong>{formatMoney(lastDay.earnings ?? 0)} zł</strong>

            </p>

            <p>Додатки: {formatMoney(lastDay.bonus ?? 0)} zł</p>

            <p>

              Разом: <strong className="text-green-700">{formatMoney((lastDay.earnings ?? 0) + (lastDay.bonus ?? 0))} zł</strong>

            </p>

            <p>Додані числа: {lastDay.entries?.join(" + ")}</p>

          </div>

        </section>

      )}

      {/* Історія робочих днів */}

      <section>

        <button

          type="button"

          onClick={() => setShowHistory((shown) => !shown)}

          className="mb-4 flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-4 py-3 text-left text-xl font-bold text-gray-900"

        >

          <span>Історія роботи ({records.length})</span>

          <span>{showHistory ? "− Згорнути" : "+ Розгорнути"}</span>

        </button>

        {showHistory && (records.length === 0 ? (

          <p className="text-gray-600">Завершених днів поки немає.</p>

        ) : (

          <div className="space-y-3 rounded-xl border border-gray-300 bg-white p-5 text-gray-900 shadow-sm">

            {[...records].reverse().map((record) => {

              const day = record as WorkDay;

              const dayEfficiency = Number(day.hours) > 0

                ? Number(day.packages) / Number(day.hours)

                : Number(day.efficient) || 0;

              const dayNormPercent = typeof day.norm === "number" && day.norm > 0

                ? calculateNormPercent(Number(day.packages) || 0, Number(day.hours) || 0, day.norm)

                : day.normPercent ?? 0;

              return (

                <div key={record.id} className="flex items-start justify-between gap-4 rounded-lg border border-gray-300 p-4 text-gray-900">

                  <div className="min-w-0 space-y-1">

                    <p className="font-bold">{day.date}</p>

                    <p>Склад: {day.warehouse ?? "Старий запис"}</p>

                    <p>Статус: {day.student === undefined ? "Не збережено" : day.student ? "Студент" : "Не студент"}</p>

                    <p>Упаковок: {formatNumber(day.packages)}</p>

                    <p>Годин: {formatNumber(day.hours)}</p>

                    {day.norm !== undefined && (

                      <>

                        <p>Погодинна норма: {day.norm} упаковок/год</p>

                        <p>Виконання норми: {formatNumber(dayNormPercent)}%</p>

                        <p>Поріг ставки: {day.rateTier}%</p>

                        <p>Ставка: {day.ratePerPackage?.toLocaleString("pl-PL")} zł/упаковку</p>

                      </>

                    )}

                    <p>Продуктивність: {formatNumber(dayEfficiency)} упаковок/год</p>

                    <p>Заробіток за упаковки: {day.earnings === undefined ? "Немає даних" : `${formatMoney(day.earnings)} zł`}</p>

                    <p>Додатки: {formatMoney(Number(day.bonus) || 0)} zł</p>

                    <p className="font-medium text-green-700">Разом: {day.earnings === undefined ? "Немає даних" : `${formatMoney((Number(day.earnings) || 0) + (Number(day.bonus) || 0))} zł`}</p>

                    <p className="text-sm text-gray-600">Початок: {day.startTime ?? "—"} · Кінець: {day.endTime ?? "—"}</p>

                    {day.entries && <p className="break-words text-sm text-gray-600">Додані числа: {day.entries.join(" + ")}</p>}

                  </div>

                  <div className="flex shrink-0 flex-col gap-3">

                    <button type="button" onClick={() => beginEditDay(day)} className="text-sm text-blue-600 hover:text-blue-800">Редагувати</button>

                    <button type="button" onClick={() => deleteRecord(record.id)} className="text-sm text-red-600 hover:text-red-800">Видалити</button>

                  </div>

                  {editForm && editingDayId !== null && String(editingDayId) === String(day.id) && (
                    <div className="mt-4 space-y-3 rounded-lg border border-blue-300 bg-blue-50 p-4 text-gray-900">
                      <h3 className="font-bold">Редагування робочого дня</h3>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <label className="text-sm">Дата
                          <input type="date" value={editForm.date ?? ""} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} className="mt-1 w-full min-w-0 rounded border border-gray-300 bg-white p-3 text-base text-gray-900" />
                        </label>
                        <label className="text-sm">Склад
                          <select value={editForm.warehouse ?? ""} onChange={(e) => setEditForm({ ...editForm, warehouse: e.target.value as Warehouse })} className="mt-1 w-full min-w-0 rounded border border-gray-300 bg-white p-3 text-base text-gray-900">
                            {Object.keys(WAREHOUSES).map((code) => <option key={code} value={code}>{code}</option>)}
                          </select>
                        </label>
                        <label className="text-sm">Початок
                          <input type="time" value={editForm.startTime ?? ""} onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })} className="mt-1 w-full min-w-0 rounded border border-gray-300 bg-white p-3 text-base text-gray-900" />
                        </label>
                        <label className="text-sm">Кінець
                          <input type="time" value={editForm.endTime ?? ""} onChange={(e) => setEditForm({ ...editForm, endTime: e.target.value })} className="mt-1 w-full min-w-0 rounded border border-gray-300 bg-white p-3 text-base text-gray-900" />
                        </label>
                        <label className="text-sm">Кількість упаковок
                          <input type="number" min="0" step="1" inputMode="numeric" value={editPackagesInput} onChange={(e) => setEditPackagesInput(e.target.value)} className="mt-1 w-full min-w-0 rounded border border-gray-300 bg-white p-3 text-base text-gray-900" />
                        </label>
                        <label className="text-sm">Додатки (zł)
                          <input type="number" min="0" step="0.01" inputMode="decimal" value={editBonusInput} onChange={(e) => setEditBonusInput(e.target.value)} className="mt-1 w-full min-w-0 rounded border border-gray-300 bg-white p-3 text-base text-gray-900" />
                        </label>
                        <label className="flex items-center gap-2 text-sm sm:col-span-2">
                          <input type="checkbox" checked={Boolean(editForm.student)} onChange={(e) => setEditForm({ ...editForm, student: e.target.checked })} /> Студент
                        </label>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={saveEditedDay} className="rounded bg-blue-600 px-4 py-3 text-white">Зберегти зміни</button>
                        <button type="button" onClick={() => {
                          setEditingDayId(null);
                          setEditForm(null);
                          setEditPackagesInput("");
                          setEditBonusInput("");
                        }} className="rounded border border-gray-300 px-4 py-3">Скасувати</button>
                      </div>
                    </div>
                  )}

                </div>

              );

            })}

          </div>

        ))}



      </section>

    </main>

  );

}
