"use client";

import type { WorkDay, Warehouse } from "@/types/work";
import { Modal } from "@/components/work/Modal";

const WAREHOUSE_CODES: Warehouse[] = ["P01", "P02", "P03", "P04", "P05", "P06", "P21", "P28"];

type EditState = {
  form: WorkDay | null;
  dayId: string | number | null;
  packagesInput: string;
  bonusInput: string;
  error: string;
};

type EditActions = {
  setPackagesInput: (value: string) => void;
  setBonusInput: (value: string) => void;
  setForm: (value: WorkDay | null) => void;
  save: () => void;
  close: () => void;
};

type Props = { state: EditState; actions: EditActions };

export function EditWorkModal({ state, actions }: Props) {
  const { form, dayId, packagesInput, bonusInput, error } = state;
  if (!form || dayId === null) return null;

  return (
    <Modal open={Boolean(form && dayId !== null)} onClose={actions.close} title="Редагування робочого дня">
      {error && <p role="alert" className="mb-3 rounded bg-red-100 p-3 text-sm text-red-800">{error}</p>}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="text-sm">Дата<input type="date" value={form.date ?? ""} onChange={(e) => actions.setForm({ ...form, date: e.target.value })} className="mt-1 w-full min-w-0 rounded border border-gray-300 bg-white p-3 text-base" /></label>
        <label className="text-sm">Склад<select value={form.warehouse ?? ""} onChange={(e) => actions.setForm({ ...form, warehouse: e.target.value as Warehouse })} className="mt-1 w-full rounded border border-gray-300 bg-white p-3 text-base">{WAREHOUSE_CODES.map((code) => <option key={code} value={code}>{code}</option>)}</select></label>
        <label className="text-sm">Початок<input type="time" value={form.startTime ?? ""} onChange={(e) => actions.setForm({ ...form, startTime: e.target.value })} className="mt-1 w-full rounded border border-gray-300 bg-white p-3 text-base" /></label>
        <label className="text-sm">Кінець<input type="time" value={form.endTime ?? ""} onChange={(e) => actions.setForm({ ...form, endTime: e.target.value })} className="mt-1 w-full rounded border border-gray-300 bg-white p-3 text-base" /></label>
        <label className="text-sm">Кількість упаковок<input type="number" min="0" step="1" inputMode="numeric" value={packagesInput} onChange={(e) => actions.setPackagesInput(e.target.value)} className="mt-1 w-full rounded border border-gray-300 bg-white p-3 text-base" /></label>
        <label className="text-sm">Додатки (zł)<input type="number" min="0" step="0.01" inputMode="decimal" value={bonusInput} onChange={(e) => actions.setBonusInput(e.target.value)} className="mt-1 w-full rounded border border-gray-300 bg-white p-3 text-base" /></label>
        <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" checked={Boolean(form.student)} onChange={(e) => actions.setForm({ ...form, student: e.target.checked })} /> Студент</label>
      </div>
      <div className="mt-5 flex flex-wrap gap-2"><button type="button" onClick={actions.save} className="rounded bg-blue-600 px-4 py-3 text-white">Зберегти зміни</button><button type="button" onClick={actions.close} className="rounded border border-gray-300 px-4 py-3">Скасувати</button></div>
    </Modal>
  );
}
