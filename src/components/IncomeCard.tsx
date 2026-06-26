"use client";

import { useState } from "react";

interface Income {
  id: string;
  source: string;
  amount: number;
  frequency: string;
  notes: string | null;
}

interface Props {
  items: Income[];
  onRefresh: () => void;
}

const EMPTY_FORM = { source: "", amount: "", frequency: "monthly", notes: "" };

export default function IncomeCard({ items, onRefresh }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const startEdit = (item: Income) => {
    setEditingId(item.id);
    setAddingNew(false);
    setForm({ source: item.source, amount: item.amount.toString(), frequency: item.frequency, notes: item.notes || "" });
  };

  const startAdd = () => {
    setAddingNew(true);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const cancel = () => {
    setEditingId(null);
    setAddingNew(false);
    setForm(EMPTY_FORM);
  };

  const save = async () => {
    const method = editingId ? "PUT" : "POST";
    const body = editingId ? { ...form, id: editingId } : form;
    await fetch("/api/income", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    cancel();
    onRefresh();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/income?id=${id}`, { method: "DELETE" });
    onRefresh();
  };

  const input = "bg-base-100 border border-base-700 rounded px-2 py-1 text-sm txt-primary w-full";

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="txt-muted text-left border-b border-base-500">
            <th className="pb-2 pr-3 font-medium">Source</th>
            <th className="pb-2 pr-3 font-medium">Amount</th>
            <th className="pb-2 pr-3 font-medium">Frequency</th>
            <th className="pb-2 pr-3 font-medium">Notes</th>
            <th className="pb-2 w-20"></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) =>
            editingId === item.id ? (
              <tr key={item.id} className="border-b border-base-500">
                <td className="py-2 pr-3"><input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className={input} /></td>
                <td className="py-2 pr-3"><input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className={input} /></td>
                <td className="py-2 pr-3">
                  <select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })} className={input}>
                    <option value="monthly">Monthly</option>
                    <option value="biweekly">Biweekly</option>
                    <option value="annual">Annual</option>
                  </select>
                </td>
                <td className="py-2 pr-3"><input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={input} placeholder="—" /></td>
                <td className="py-2">
                  <div className="flex gap-1">
                    <button onClick={save} className="text-ok hover:text-ok px-1" title="Save">✓</button>
                    <button onClick={cancel} className="txt-muted hover:txt-secondary px-1" title="Cancel">✕</button>
                  </div>
                </td>
              </tr>
            ) : (
              <tr key={item.id} className="border-b border-base-500/50 hover:bg-base-50">
                <td className="py-2 pr-3 txt-primary">{item.source}</td>
                <td className="py-2 pr-3 txt-primary">${item.amount.toFixed(2)}</td>
                <td className="py-2 pr-3 txt-secondary capitalize">{item.frequency}</td>
                <td className="py-2 pr-3 txt-muted">{item.notes || "—"}</td>
                <td className="py-2">
                  <div className="flex gap-1">
                    <button onClick={() => startEdit(item)} className="text-accent hover:text-accent-hover px-1" title="Edit">✎</button>
                    <button onClick={() => handleDelete(item.id)} className="text-err hover:text-err px-1" title="Delete">🗑</button>
                  </div>
                </td>
              </tr>
            )
          )}
          {addingNew && (
            <tr className="border-b border-base-500">
              <td className="py-2 pr-3"><input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className={input} placeholder="Source" autoFocus /></td>
              <td className="py-2 pr-3"><input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className={input} placeholder="0.00" /></td>
              <td className="py-2 pr-3">
                <select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })} className={input}>
                  <option value="monthly">Monthly</option>
                  <option value="biweekly">Biweekly</option>
                  <option value="annual">Annual</option>
                </select>
              </td>
              <td className="py-2 pr-3"><input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={input} placeholder="Notes" /></td>
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
        <p className="txt-faint text-sm text-center py-4">No income sources added yet.</p>
      )}
      <button onClick={startAdd} className="mt-2 text-accent hover:text-accent-hover text-sm flex items-center gap-1">
        + Add Row
      </button>
    </div>
  );
}
