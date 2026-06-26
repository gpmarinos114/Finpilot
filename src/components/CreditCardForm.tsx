"use client";

import { useState } from "react";

interface CreditCard {
  id: string;
  name: string;
  balance: number;
  limit: number;
  apr: number;
  minPayment: number;
  notes: string | null;
}

interface Props {
  items: CreditCard[];
  onRefresh: () => void;
}

const EMPTY_FORM = { name: "", balance: "", limit: "", apr: "", minPayment: "", notes: "" };

export default function CreditCardForm({ items, onRefresh }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const startEdit = (item: CreditCard) => {
    setEditingId(item.id);
    setAddingNew(false);
    setForm({ name: item.name, balance: item.balance.toString(), limit: item.limit.toString(), apr: item.apr.toString(), minPayment: item.minPayment.toString(), notes: item.notes || "" });
  };

  const startAdd = () => { setAddingNew(true); setEditingId(null); setForm(EMPTY_FORM); };
  const cancel = () => { setEditingId(null); setAddingNew(false); setForm(EMPTY_FORM); };

  const save = async () => {
    const method = editingId ? "PUT" : "POST";
    const body = editingId ? { ...form, id: editingId } : form;
    await fetch("/api/credit-cards", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    cancel();
    onRefresh();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/credit-cards?id=${id}`, { method: "DELETE" });
    onRefresh();
  };

  const input = "bg-base-100 border border-base-700 rounded px-2 py-1 text-sm txt-primary w-full";

  const renderCells = (f: typeof EMPTY_FORM, onChange: (v: typeof EMPTY_FORM) => void) => (
    <>
      <td className="py-2 pr-2"><input value={f.name} onChange={(e) => onChange({ ...f, name: e.target.value })} className={input} placeholder="Card Name" /></td>
      <td className="py-2 pr-2"><input type="number" step="0.01" value={f.balance} onChange={(e) => onChange({ ...f, balance: e.target.value })} className={input} placeholder="0.00" /></td>
      <td className="py-2 pr-2"><input type="number" step="0.01" value={f.limit} onChange={(e) => onChange({ ...f, limit: e.target.value })} className={input} placeholder="0.00" /></td>
      <td className="py-2 pr-2"><input type="number" step="0.01" value={f.apr} onChange={(e) => onChange({ ...f, apr: e.target.value })} className={input} placeholder="0.00" /></td>
      <td className="py-2 pr-2"><input type="number" step="0.01" value={f.minPayment} onChange={(e) => onChange({ ...f, minPayment: e.target.value })} className={input} placeholder="0.00" /></td>
      <td className="py-2 pr-2"></td>
      <td className="py-2 pr-2"><input value={f.notes} onChange={(e) => onChange({ ...f, notes: e.target.value })} className={input} placeholder="—" /></td>
    </>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="txt-muted text-left border-b border-base-500">
            <th className="pb-2 pr-2 font-medium">Name</th>
            <th className="pb-2 pr-2 font-medium">Balance</th>
            <th className="pb-2 pr-2 font-medium">Limit</th>
            <th className="pb-2 pr-2 font-medium">APR</th>
            <th className="pb-2 pr-2 font-medium">Min Payment</th>
            <th className="pb-2 pr-2 font-medium">Utilization</th>
            <th className="pb-2 pr-2 font-medium">Notes</th>
            <th className="pb-2 w-20"></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const util = Math.min((item.balance / item.limit) * 100, 100);
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
                <td className="py-2 pr-2 txt-primary">${item.balance.toFixed(2)}</td>
                <td className="py-2 pr-2 txt-secondary">${item.limit.toFixed(2)}</td>
                <td className="py-2 pr-2 txt-secondary">{item.apr}%</td>
                <td className="py-2 pr-2 txt-secondary">${item.minPayment.toFixed(2)}/mo</td>
                <td className="py-2 pr-2">
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-base-100 rounded-full h-2">
                      <div className="bg-err h-2 rounded-full" style={{ width: `${util}%` }} />
                    </div>
                    <span className="text-xs txt-muted">{util.toFixed(0)}%</span>
                  </div>
                </td>
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
        <p className="txt-faint text-sm text-center py-4">No credit cards added yet.</p>
      )}
      <button onClick={startAdd} className="mt-2 text-accent hover:text-accent-hover text-sm flex items-center gap-1">
        + Add Row
      </button>
    </div>
  );
}
