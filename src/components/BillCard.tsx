"use client";

import { useState } from "react";

interface Bill {
  id: string;
  name: string;
  amount: number;
  category: string;
  frequency: string;
  notes: string | null;
}

interface Props {
  items: Bill[];
  onRefresh: () => void;
}

const EMPTY_FORM = { name: "", amount: "", category: "housing", frequency: "monthly", notes: "" };

export default function BillCard({ items, onRefresh }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const startEdit = (item: Bill) => {
    setEditingId(item.id);
    setAddingNew(false);
    setForm({ name: item.name, amount: item.amount.toString(), category: item.category, frequency: item.frequency, notes: item.notes || "" });
  };

  const startAdd = () => { setAddingNew(true); setEditingId(null); setForm(EMPTY_FORM); };
  const cancel = () => { setEditingId(null); setAddingNew(false); setForm(EMPTY_FORM); };

  const save = async () => {
    const method = editingId ? "PUT" : "POST";
    const body = editingId ? { ...form, id: editingId } : form;
    await fetch("/api/bills", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    cancel();
    onRefresh();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/bills?id=${id}`, { method: "DELETE" });
    onRefresh();
  };

  const input = "bg-base-100 border border-base-700 rounded px-2 py-1 text-sm txt-primary w-full";

  const renderCells = (f: typeof EMPTY_FORM, onChange: (v: typeof EMPTY_FORM) => void) => (
    <>
      <td className="py-2 pr-2"><input value={f.name} onChange={(e) => onChange({ ...f, name: e.target.value })} className={input} placeholder="Name" /></td>
      <td className="py-2 pr-2"><input type="number" step="0.01" value={f.amount} onChange={(e) => onChange({ ...f, amount: e.target.value })} className={input} placeholder="0.00" /></td>
      <td className="py-2 pr-2">
        <select value={f.category} onChange={(e) => onChange({ ...f, category: e.target.value })} className={input}>
          <option value="housing">Housing</option><option value="utilities">Utilities</option><option value="insurance">Insurance</option>
          <option value="subscription">Subscription</option><option value="food">Food</option><option value="other">Other</option>
        </select>
      </td>
      <td className="py-2 pr-2">
        <select value={f.frequency} onChange={(e) => onChange({ ...f, frequency: e.target.value })} className={input}>
          <option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="annual">Annual</option>
        </select>
      </td>
      <td className="py-2 pr-2"><input value={f.notes} onChange={(e) => onChange({ ...f, notes: e.target.value })} className={input} placeholder="—" /></td>
    </>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="txt-muted text-left border-b border-base-500">
            <th className="pb-2 pr-2 font-medium">Name</th>
            <th className="pb-2 pr-2 font-medium">Amount</th>
            <th className="pb-2 pr-2 font-medium">Category</th>
            <th className="pb-2 pr-2 font-medium">Frequency</th>
            <th className="pb-2 pr-2 font-medium">Notes</th>
            <th className="pb-2 w-20"></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) =>
            editingId === item.id ? (
              <tr key={item.id} className="border-b border-base-500">
                {renderCells(form, setForm)}
                <td className="py-2">
                  <div className="flex gap-1">
                    <button onClick={save} className="text-ok hover:text-ok px-1" title="Save">✓</button>
                    <button onClick={cancel} className="txt-muted hover:txt-secondary px-1" title="Cancel">✕</button>
                  </div>
                </td>
              </tr>
            ) : (
              <tr key={item.id} className="border-b border-base-500/50 hover:bg-base-50">
                <td className="py-2 pr-2 txt-primary">{item.name}</td>
                <td className="py-2 pr-2 txt-primary">${item.amount.toFixed(2)}</td>
                <td className="py-2 pr-2 txt-secondary capitalize">{item.category}</td>
                <td className="py-2 pr-2 txt-secondary capitalize">{item.frequency}</td>
                <td className="py-2 pr-2 txt-muted">{item.notes || "—"}</td>
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
        <p className="txt-faint text-sm text-center py-4">No bills added yet.</p>
      )}
      <button onClick={startAdd} className="mt-2 text-accent hover:text-accent-hover text-sm flex items-center gap-1">
        + Add Row
      </button>
    </div>
  );
}
