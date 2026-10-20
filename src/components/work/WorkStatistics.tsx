"use client";

import { useEffect, useState } from "react";
import { useWorkContext } from "@/context/WorkContext";
import { useWorkStatistics } from "@/hooks/useWorkStatistics";
import { formatMoney, formatNumber } from "@/lib/workCalculations";
import { Modal } from "@/components/work/Modal";

type Props = { currentMonth: string };

const MONTHLY_BLENDS_STORAGE_KEY = "warehouse-monthly-blends";
type MonthlyBlends = Record<string, number>;

/** Returns the salary percentage according to the monthly packages-per-blend ratio. */
export function getBlendSalaryPercentage(packages: number, blends: number): number {
  if (blends <= 0) return 100;

  const packagesPerBlend = packages / blends;
  if (packagesPerBlend < 1000) return 82;
  if (packagesPerBlend < 1450) return 85;
  if (packagesPerBlend < 1750) return 88;
  if (packagesPerBlend < 2200) return 91;
  if (packagesPerBlend < 2650) return 94;
  if (packagesPerBlend < 2950) return 97;
  return 100;
}

function readMonthlyBlends(): MonthlyBlends {
  try {
    const stored = localStorage.getItem(MONTHLY_BLENDS_STORAGE_KEY);
    const parsed: unknown = stored ? JSON.parse(stored) : {};
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as MonthlyBlends
      : {};
  } catch (error) {
    console.error("Не вдалося завантажити кількість блендів:", error);
    return {};
  }
}

export function WorkStatistics({ currentMonth }: Props) {
  const { records } = useWorkContext();
  const stats = useWorkStatistics(records, currentMonth);
  const [blends, setBlends] = useState(0);
  const [loadedMonth, setLoadedMonth] = useState("");
  const [isBlendModalOpen, setIsBlendModalOpen] = useState(false);
  const [blendModalMode, setBlendModalMode] = useState<"add" | "edit">("add");
  const [blendsToAdd, setBlendsToAdd] = useState("");
  const [blendsTotalInput, setBlendsTotalInput] = useState("");
  const [showEditConfirmation, setShowEditConfirmation] = useState(false);
  const [blendError, setBlendError] = useState("");

  // Load each month's saved count; the total is never edited directly.
  useEffect(() => {
    if (!currentMonth) return;
    const monthlyBlends = readMonthlyBlends();
    const count = Number(monthlyBlends[currentMonth]);
    setBlends(Number.isFinite(count) && count >= 0 ? Math.floor(count) : 0);
    setLoadedMonth(currentMonth);
  }, [currentMonth]);

  function openAddBlendModal() {
    setBlendModalMode("add");
    setBlendsToAdd("");
    setBlendError("");
    setIsBlendModalOpen(true);
  }

  function openEditBlendModal() {
    setBlendModalMode("edit");
    setBlendsTotalInput(String(blends));
    setBlendError("");
    setShowEditConfirmation(false);
    setIsBlendModalOpen(true);
  }

  function saveMonthlyBlendCount(updatedCount: number) {
    if (!currentMonth || loadedMonth !== currentMonth) {
      setBlendError("Зачекай, поки завантажаться дані місяця.");
      return false;
    }

    const monthlyBlends = readMonthlyBlends();
    try {
      localStorage.setItem(MONTHLY_BLENDS_STORAGE_KEY, JSON.stringify({
        ...monthlyBlends,
        [currentMonth]: updatedCount,
      }));
      setBlends(updatedCount);
      setBlendError("");
      setIsBlendModalOpen(false);
      setShowEditConfirmation(false);
      return true;
    } catch (error) {
      console.error("Не вдалося зберегти кількість блендів:", error);
      setBlendError("Не вдалося зберегти зміни. Спробуй ще раз.");
      return false;
    }
  }

  function handleConfirmEditBlends() {
    const updatedCount = Number(blendsTotalInput);
    if (blendsTotalInput.trim() === "" || !Number.isInteger(updatedCount) || updatedCount < 0) {
      setBlendError("Введи ціле невід’ємне число блендів.");
      setShowEditConfirmation(false);
      return;
    }
    saveMonthlyBlendCount(updatedCount);
  }

  function handleAddBlends() {
    const addition = Number(blendsToAdd);
    if (!Number.isInteger(addition) || addition <= 0) {
      setBlendError("Введи ціле число блендів, яке потрібно додати (мінімум 1).");
      return;
    }
    if (!currentMonth || loadedMonth !== currentMonth) {
      setBlendError("Зачекай, поки завантажаться дані місяця.");
      return;
    }

    // Read the latest stored value and add to it, rather than replacing the previous total.
    const monthlyBlends = readMonthlyBlends();
    const storedCount = Number(monthlyBlends[currentMonth]);
    const currentCount = Number.isFinite(storedCount) && storedCount >= 0
      ? Math.floor(storedCount)
      : blends;
    const updatedCount = currentCount + addition;

    if (saveMonthlyBlendCount(updatedCount)) setBlendsToAdd("");
  }

  const salaryPercentage = getBlendSalaryPercentage(stats.packages, blends);
  const adjustedEarnings = stats.earnings * salaryPercentage / 100;
  const packagesPerBlend = blends > 0 ? stats.packages / blends : null;

  return (
    <section className="rounded-xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
      <h2 className="text-xl font-bold text-blue-900">Статистика за місяць</h2>
      <p className="mt-1 text-sm text-gray-700">{currentMonth || "Завантаження статистики..."}</p>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-lg bg-white p-4"><p className="text-sm text-gray-700">Усього упаковок</p><p className="mt-1 text-2xl font-bold text-blue-700">{formatNumber(stats.packages)}</p></div>
        <div className="rounded-lg bg-white p-4"><p className="text-sm text-gray-700">Загальний час роботи</p><p className="mt-1 text-2xl font-bold text-gray-900">{formatNumber(stats.hours)} год.</p></div>
        <div className="rounded-lg bg-white p-4"><p className="text-sm text-gray-700">Продуктивність за місяць</p><p className="mt-1 text-2xl font-bold text-gray-900">{formatNumber(stats.efficiency)} упаковок/год</p></div>
        <div className="rounded-lg bg-white p-4"><p className="text-sm text-gray-700">Середнє виконання норми</p><p className="mt-1 text-2xl font-bold text-gray-900">{formatNumber(stats.averagePercent)}%</p><p className="mt-1 text-xs text-gray-600">Днів із даними для розрахунку: {stats.recordsWithNorm}</p></div>

        <div className="rounded-lg bg-white p-4 sm:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-gray-700">Кількість блендів за місяць</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{loadedMonth === currentMonth ? formatNumber(blends) : "…"}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={openAddBlendModal}
                disabled={!currentMonth || loadedMonth !== currentMonth}
                className="rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Додати
              </button>
              <button
                type="button"
                onClick={openEditBlendModal}
                disabled={!currentMonth || loadedMonth !== currentMonth}
                className="rounded-lg border border-blue-700 bg-white px-4 py-2 font-semibold text-blue-800 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Редагувати
              </button>
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-600">«Додати» збільшує збережену кількість. «Редагувати» дозволяє змінити загальну кількість і перед збереженням просить підтвердження.</p>
          <div className="mt-3 rounded-lg bg-blue-50 p-3 text-sm text-gray-800">
            <p>Упаковок на один бленд: <strong>{packagesPerBlend === null ? "— (блендів немає)" : formatNumber(packagesPerBlend)}</strong></p>
            <p className="mt-1">Відсоток зарплати за блендами: <strong>{salaryPercentage}%</strong></p>
          </div>
        </div>

        <div className="rounded-lg bg-white p-4 sm:col-span-2">
          <p className="text-sm text-gray-700">Заробіток за місяць з урахуванням блендів</p>
          <p className="mt-1 text-3xl font-bold text-green-700">{formatMoney(adjustedEarnings)} zł</p>
          <p className="mt-1 text-xs text-gray-600">До корекції: {formatMoney(stats.earnings)} zł · застосовано {salaryPercentage}%</p>
        </div>
      </div>
      <p className="mt-4 text-sm text-gray-700">Завершених днів: {stats.records.length}</p>

      <Modal
        open={isBlendModalOpen}
        onClose={() => {
          setIsBlendModalOpen(false);
          setShowEditConfirmation(false);
        }}
        title={blendModalMode === "add" ? "Додати бленди" : "Редагувати загальну кількість"}
        contentClassName="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-5 text-gray-900 shadow-2xl sm:rounded-2xl"
      >
        <div className="space-y-4">
          <div className="rounded-lg bg-gray-100 p-3">
            <p className="text-sm text-gray-600">Зараз записано за {currentMonth}</p>
            <p className="text-2xl font-bold">{formatNumber(blends)} блендів</p>
          </div>

          {blendModalMode === "add" ? (
            <>
              <div>
                <label htmlFor="blends-to-add" className="mb-2 block font-semibold">Скільки нових блендів додати?</label>
                <input
                  id="blends-to-add"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="off"
                  value={blendsToAdd}
                  onChange={(event) => {
                    setBlendsToAdd(event.target.value.replace(/[^0-9]/g, ""));
                    setBlendError("");
                  }}
                  placeholder="Наприклад, 2"
                  className="w-full rounded-lg border border-gray-300 px-3 py-3 text-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
              {blendsToAdd !== "" && Number(blendsToAdd) > 0 && (
                <p className="text-sm text-gray-700">Після додавання буде: <strong>{formatNumber(blends + Number(blendsToAdd))} блендів</strong></p>
              )}
            </>
          ) : (
            <>
              <div>
                <label htmlFor="blends-total-edit" className="mb-2 block font-semibold">Нова загальна кількість блендів</label>
                <input
                  id="blends-total-edit"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="off"
                  value={blendsTotalInput}
                  onChange={(event) => {
                    setBlendsTotalInput(event.target.value.replace(/[^0-9]/g, ""));
                    setBlendError("");
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-3 text-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <p className="text-sm text-amber-800">Увага: редагування замінить попередню загальну кількість блендів за цей місяць.</p>
            </>
          )}

          {blendError && <p role="alert" className="text-sm font-medium text-red-700">{blendError}</p>}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setIsBlendModalOpen(false)} className="rounded-lg border border-gray-300 px-4 py-3 font-semibold text-gray-700 hover:bg-gray-100">Скасувати</button>
            {blendModalMode === "add" ? (
              <button type="button" onClick={handleAddBlends} className="rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white hover:bg-blue-800">Додати до суми</button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  const value = Number(blendsTotalInput);
                  if (blendsTotalInput.trim() === "" || !Number.isInteger(value) || value < 0) {
                    setBlendError("Введи ціле невід’ємне число блендів.");
                    return;
                  }
                  setBlendError("");
                  setShowEditConfirmation(true);
                }}
                className="rounded-lg bg-amber-600 px-4 py-3 font-semibold text-white hover:bg-amber-700"
              >
                Зберегти зміни
              </button>
            )}
          </div>
        </div>
      </Modal>

      <Modal
        open={showEditConfirmation}
        onClose={() => setShowEditConfirmation(false)}
        title="Підтвердження зміни"
        contentClassName="w-full max-w-md rounded-t-2xl bg-white p-5 text-gray-900 shadow-2xl sm:rounded-2xl"
      >
        <div className="space-y-4">
          <p>Ти впевнений, що хочеш змінити загальну кількість блендів за <strong>{currentMonth}</strong> з <strong>{formatNumber(blends)}</strong> на <strong>{formatNumber(Number(blendsTotalInput))}</strong>?</p>
          <p className="text-sm text-amber-800">Ця дія замінить попереднє значення та змінить відсоток зарплати в місячній статистиці.</p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setShowEditConfirmation(false)} className="rounded-lg border border-gray-300 px-4 py-3 font-semibold text-gray-700 hover:bg-gray-100">Ні, повернутися</button>
            <button type="button" onClick={handleConfirmEditBlends} className="rounded-lg bg-red-700 px-4 py-3 font-semibold text-white hover:bg-red-800">Так, змінити кількість</button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
