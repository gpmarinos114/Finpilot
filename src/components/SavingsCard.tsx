"use client";

import { useState } from "react";

interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string | null;
  notes: string | null;
}

interface Props {
  items: SavingsGoal[];
  onRefresh: () => void;
}

const EMPTY_FORM = { name: "", targetAmount: "", currentAmount: "", targetDate: "", notes: "" };

export default function SavingsCard({ items, onRefresh }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const startEdit = (item: SavingsGoal) => {
    setEditingId(item.id);
    setAddingNew(false);
    setForm({ name: item.name, targetAmount: item.targetAmount.toString(), currentAmount: item.currentAmount.toString(), targetDate: item.targetDate || "", notes: item.notes || "" });
  };

  const startAdd = () => { setAddingNew(true); setEditingId(null); setForm(EMPTY_FORM); };
  const cancel = () => { setEditingId(null); setAddingNew(false); setForm(EMPTY_FORM); };

  const save = async () => {
    const method = editingId ? "PUT" : "POST";
    const body = editingId ? { ...form, id: editingId } : form;
    await fetch("/api/savings", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    cancel();
    onRefresh();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/savings?id=${id}`, { method: "DELETE" });
    onRefresh();
  };

  const input = "bg-base-100 border border-base-700 rounded px-2 py-1 text-sm txt-primary w-full";

  const renderCells = (f: typeof EMPTY_FORM, onChange: (v: typeof EMPTY_FORM) => void) => (
    <>
      <td className="py-2 pr-2"><input value={f.name} onChange={(e) => onChange({ ...f, name: e.target.value })} className={input} placeholder="Goal Name" /></td>
      <td className="py-2 pr-2"><input type="number" step="0.01" value={f.targetAmount} onChange={(e) => onChange({ ...f, targetAmount: e.target.value })} className={input} placeholder="0.00" /></td>
      <td className="py-2 pr-2"><input type="number" step="0.01" value={f.currentAmount} onChange={(e) => onChange({ ...f, currentAmount: e.target.value })} className={input} placeholder="0.00" /></td>
      <td className="py-2 pr-2"></td>
      <td className="py-2 pr-2"><input type="date" value={f.targetDate} onChange={(e) => onChange({ ...f, targetDate: e.target.value })} className={input} /></td>
      <td className="py-2 pr-2"><input value={f.notes} onChange={(e) => onChange({ ...f, notes: e.target.value })} className={input} placeholder="—" /></td>
    </>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="txt-muted text-left border-b border-base-500">
            <th className="pb-2 pr-2 font-medium">Name</th>
            <th className="pb-2 pr-2 font-medium">Target</th>
            <th className="pb-2 pr-2 font-medium">Current</th>
            <th className="pb-2 pr-2 font-medium">Progress</th>
            <th className="pb-2 pr-2 font-medium">Target Date</th>
            <th className="pb-2 pr-2 font-medium">Notes</th>
            <th className="pb-2 w-20"></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const pct = Math.min((item.currentAmount / item.targetAmount) * 100, 100);
            if (editingId === item.id) {
              return (
                <tr key={item.id} className="border-b border-base-500">
                  {renderCells(form, setForm)}
                  <td className="py-2">
                    <div className="flex gap-1">
                      <button onClick={save} className="text-ok hover:text-ok px-1" title="Save">✓</button>
                      <button onClick={cancel} className="txt-muted hover:txt-secondary px-1" title="Cancel">✕</button>
                    </div>
                  </td>
                </tr>
              );
            }
            return (
              <tr key={item.id} className="border-b border-base-500/50 hover:bg-base-50">
                <td className="py-2 pr-2 txt-primary">{item.name}</td>
                <td className="py-2 pr-2 txt-secondary">${item.targetAmount.toFixed(2)}</td>
                <td className="py-2 pr-2 txt-primary">${item.currentAmount.toFixed(2)}</td>
                <td className="py-2 pr-2">
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-base-100 rounded-full h-2">
                      <div className="bg-ok h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs txt-muted">{pct.toFixed(0)}%</span>
                  </div>
                </td>
                <td className="py-2 pr-2 txt-secondary">{item.targetDate || "—"}</td>
                <td className="py-2 pr-2 txt-muted">{item.notes || "—"}</td>
                <td className="py-2">
                  <div className="flex gap-1">
                    <button onClick={() => startEdit(item)} className="text-accent hover:text-accent-hover px-1" title="Edit">✎</button>
                    <button onClick={() => handleDelete(item.id)} className="text-err hover:text-err px-1" title="Delete">🗑</button>
                  </div>
                </td>
              </tr>
            );
          })}
          {addingNew && (
            <tr className="border-b border-base-500">
              {renderCells(form, setForm)}
              <td className="py-2">
                <div className="flex gap-1">
                  <button onClick={save} className="text-ok hover:text-ok px-1" title="Save">✓</button>
                  <button onClick={cancel} className="txt-muted hover:txt-secondary px-1" title="Cancel">✕</button>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {items.length === 0 && !addingNew && (
        <p className="txt-faint text-sm text-center py-4">No savings goals added yet.</p>
      )}
      <button onClick={startAdd} className="mt-2 text-accent hover:text-accent-hover text-sm flex items-center gap-1">
        + Add Row
      </button>
    </div>
  );
}
