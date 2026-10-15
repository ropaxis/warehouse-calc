

"use client";

import { useWorkSession } from "@/hooks/useWorkSession";
import { useWorkHistory } from "@/hooks/useWorkHistory";
import type { Warehouse } from "@/types/work";
import { WAREHOUSES } from "@/types/work";
import { formatMoney, formatNumber, getTime, getLocalDate } from "@/lib/workCalculations";
import { WorkStatistics } from "@/components/work/WorkStatistics";
import { WorkArchive } from "@/components/work/WorkArchive";
import { EditWorkModal } from "@/components/work/EditWorkModal";

export default function Home() {

  const history = useWorkHistory();
  const session = useWorkSession();
  const {
    inputValue, setInputValue, currentTotal, entries, startTime, currentElapsedHours,
    student, studentLoaded, warehouse, setWarehouse, currentMonth,
    showEndConfirmation, confirmationAnswer, setConfirmationAnswer, confirmationNumbers,
    error, lastDay, handleStudentChange, currentNorm, currentEfficiency, currentPercent,
    currentTier, currentRate, estimatedEarnings, handleAdd, handleEndDay, requestEndDay, cancelEndDay,
  } = session;

  return (

    <main className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">

      <h1 className="text-2xl font-bold text-white">

        Облік робочого дня

      </h1>

      <WorkStatistics currentMonth={currentMonth} />

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

      <WorkArchive
        currentMonth={currentMonth}
        onEdit={history.beginEditDay}
        onDelete={history.deleteRecord}
      />

      <EditWorkModal state={history.editState} actions={history.editActions} />

    </main>

  );

}
