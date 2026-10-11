
"use client";

import { useState } from "react";
import { useWorkContext } from "@/context/WorkContext";

type WorkDay = {
  id: string | number;
  packages: number;
  hours: number;
  efficient: number;
  date: string;
  startTime?: string;
  endTime?: string;
  entries?: number[];
};

function getLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getTime(date: Date) {
  return date.toLocaleTimeString("uk-UA", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Home() {
  const { records, addRecord, deleteRecord } = useWorkContext();

  const [inputValue, setInputValue] = useState("");
  const [currentTotal, setCurrentTotal] = useState(0);
  const [entries, setEntries] = useState<number[]>([]);
  const [startTime, setStartTime] = useState<Date | null>(null);

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

  function handleAdd() {
    const value = Number(inputValue);

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
    }

    setCurrentTotal((prev) => prev + value);
    setEntries((prev) => [...prev, value]);
    setInputValue("");
    setError("");
  }

  function handleEndDay() {
    if (!startTime || entries.length === 0) {
      setError("Спочатку додай хоча б одне число.");
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

    const completedDay: WorkDay = {
      id: `day-${Date.now()}`,
      packages: currentTotal,
      hours: roundedHours,
      efficient,
      date: getLocalDate(startTime),
      startTime: getTime(startTime),
      endTime: getTime(endTime),
      entries: [...entries],
    };

    // Зберігаємо день у WorkContext.
    // Контекст має підтримувати startTime та endTime,
    // якщо потрібно зберігати ці поля в історії.
    addRecord({
      packages: completedDay.packages,
      hours: completedDay.hours,
      efficient: completedDay.efficient,
      date: completedDay.date,
      startTime: completedDay.startTime,
      endTime: completedDay.endTime,
      entries: completedDay.entries,
    });

    setLastDay(completedDay);

    // Скидаємо поточний робочий день.
    setCurrentTotal(0);
    setEntries([]);
    setStartTime(null);
    setInputValue("");
    setShowEndConfirmation(false);
    setConfirmationAnswer("");
    setError("");

    // Генеруємо новий приклад для наступного завершення.
    const a = completedDay.hours;
    const b = Math.round(completedDay.efficient);

    setConfirmationNumbers({ a, b, answer: a + b });
  }

  function requestEndDay() {
    if (!startTime || entries.length === 0) {
      setError("Спочатку додай хоча б одне число.");
      return;
    }

    const a = Math.floor(Math.random() * 9) + 2;
    const b = Math.floor(Math.random() * 9) + 2;

    setConfirmationNumbers({ a, b, answer: a + b });
    setConfirmationAnswer("");
    setShowEndConfirmation(true);
    setError("");
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-2xl font-bold">
        Облік робочого дня
      </h1>

      {/* Поточний робочий день */}
      <section className="rounded-xl border p-5 shadow-sm">
        <p className="text-sm text-gray-500">
          Поточна сума упаковок
        </p>

        <p className="my-2 text-4xl font-bold text-blue-600">
          {currentTotal}
        </p>

        <p className="text-sm text-gray-600">
          Дата: {startTime ? getLocalDate(startTime) : "Ще не розпочато"}
        </p>

        <p className="text-sm text-gray-600">
          Початок роботи:{" "}
          {startTime ? getTime(startTime) : "Ще не розпочато"}
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
            onChange={(event) =>
              setInputValue(event.target.value)
            }
            placeholder="Кількість упаковок"
            disabled={showEndConfirmation}
            className="min-w-0 flex-1 rounded-lg border px-3 py-2 disabled:bg-gray-100"
          />

          <button
            type="submit"
            disabled={showEndConfirmation}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-40"
          >
            Додати
          </button>
        </form>

        {entries.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 font-medium">
              Додані числа
            </p>

            <div className="flex flex-wrap gap-2">
              {entries.map((entry, index) => (
                <span
                  key={index}
                  className="rounded bg-gray-100 px-3 py-1 text-sm"
                >
                  +{entry}
                </span>
              ))}
            </div>
          </div>
        )}

        {error && (
          <p className="mt-3 text-sm text-red-600">
            {error}
          </p>
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

        {/* Захист від випадкового завершення */}
        {showEndConfirmation && (
          <div className="mt-5 space-y-4 rounded-lg border border-orange-300 p-4">
            <h2 className="text-lg font-bold">
              Підтвердження завершення дня
            </h2>

            <p className="text-sm text-gray-600">
              Розв’яжи приклад, щоб завершити робочий день.
            </p>

            <p className="text-3xl font-bold">
              {confirmationNumbers.a} +{" "}
              {confirmationNumbers.b} = ?
            </p>

            <input
              type="number"
              value={confirmationAnswer}
              onChange={(event) =>
                setConfirmationAnswer(event.target.value)
              }
              placeholder="Введи відповідь"
              className="w-full rounded-lg border px-3 py-3 text-lg"
            />

            <button
              disabled={
                confirmationAnswer.trim() === "" ||
                Number(confirmationAnswer) !==
                confirmationNumbers.answer
              }
              onClick={handleEndDay}
              className="w-full rounded-lg bg-green-600 px-4 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Підтвердити завершення дня
            </button>

            <button
              onClick={() => {
                setShowEndConfirmation(false);
                setConfirmationAnswer("");
                setError("");
              }}
              className="w-full rounded-lg border px-4 py-2"
            >
              Скасувати
            </button>
          </div>
        )}
      </section>

      {/* Останній завершений день */}
      {lastDay && (
        <section className="rounded-xl border border-green-300 p-5">
          <h2 className="text-xl font-bold">
            Останній завершений день
          </h2>

          <div className="mt-3 space-y-2">
            <p>Дата: {lastDay.date}</p>
            <p>Початок: {lastDay.startTime}</p>
            <p>Кінець: {lastDay.endTime}</p>
            <p>Тривалість: {lastDay.hours} год.</p>
            <p>Усього упаковок: {lastDay.packages}</p>

            <p>
              Середня продуктивність:{" "}
              <strong>{lastDay.efficient} упаковок/год</strong>
            </p>

            <p>
              Додані числа: {lastDay.entries?.join(" + ")}
            </p>
          </div>
        </section>
      )}

      {/* Історія робочих днів */}
      <section>
        <h2 className="mb-4 text-xl font-bold">
          Історія роботи
        </h2>

        {records.length === 0 ? (
          <p className="text-gray-500">
            Завершених днів поки немає.
          </p>
        ) : (
          <div className="space-y-3">
            {[...records].reverse().map((record) => {
              const day = record as WorkDay;

              return (
                <div
                  key={record.id}
                  className="flex items-start justify-between gap-4 rounded-lg border p-4"
                >
                  <div className="space-y-1">
                    <p className="font-bold">{day.date}</p>

                    <p>Упаковок: {day.packages}</p>
                    <p>Годин: {day.hours}</p>

                    <p>
                      Середня продуктивність:{" "}
                      {day.efficient} упаковок/год
                    </p>

                    <p className="text-sm text-gray-600">
                      Початок: {day.startTime ?? "—"} · Кінець:{" "}
                      {day.endTime ?? "—"}
                    </p>

                    {day.entries && (
                      <p className="text-sm text-gray-600">
                        Додані числа: {day.entries.join(" + ")}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => deleteRecord(record.id)}
                    className="shrink-0 text-sm text-red-600"
                  >
                    Видалити
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
