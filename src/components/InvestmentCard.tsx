"use client";

import { useState } from "react";

interface Investment {
  id: string;
  name: string;
  type: string;
  ticker: string | null;
  shares: number | null;
  costBasis: number | null;
  currentValue: number;
  notes: string | null;
}

interface Props {
  items: Investment[];
  onRefresh: () => void;
}

const EMPTY_FORM = { name: "", type: "stock", ticker: "", shares: "", costBasis: "", currentValue: "", notes: "" };

export default function InvestmentCard({ items, onRefresh }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const startEdit = (item: Investment) => {
    setEditingId(item.id);
    setAddingNew(false);
    setForm({
      name: item.name, type: item.type, ticker: item.ticker || "",
      shares: item.shares?.toString() || "", costBasis: item.costBasis?.toString() || "",
      currentValue: item.currentValue.toString(), notes: item.notes || "",
    });
  };

  const startAdd = () => { setAddingNew(true); setEditingId(null); setForm(EMPTY_FORM); };
  const cancel = () => { setEditingId(null); setAddingNew(false); setForm(EMPTY_FORM); };

  const save = async () => {
    const method = editingId ? "PUT" : "POST";
    const body = editingId ? { ...form, id: editingId } : form;
    await fetch("/api/investments", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    cancel();
    onRefresh();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/investments?id=${id}`, { method: "DELETE" });
    onRefresh();
  };

  const input = "bg-base-100 border border-base-700 rounded px-2 py-1 text-sm txt-primary w-full";

  const renderCells = (formVals: typeof EMPTY_FORM, onChange: (f: typeof EMPTY_FORM) => void) => (
    <>
      <td className="py-2 pr-2"><input value={formVals.name} onChange={(e) => onChange({ ...formVals, name: e.target.value })} className={input} placeholder="Name" /></td>
      <td className="py-2 pr-2">
        <select value={formVals.type} onChange={(e) => onChange({ ...formVals, type: e.target.value })} className={input}>
          <option value="stock">Stock</option><option value="bond">Bond</option><option value="etf">ETF</option>
          <option value="crypto">Crypto</option><option value="retirement">Retirement</option><option value="other">Other</option>
        </select>
      </td>
      <td className="py-2 pr-2"><input value={formVals.ticker} onChange={(e) => onChange({ ...formVals, ticker: e.target.value })} className={input} placeholder="—" /></td>
      <td className="py-2 pr-2"><input type="number" step="0.0001" value={formVals.shares} onChange={(e) => onChange({ ...formVals, shares: e.target.value })} className={input} placeholder="—" /></td>
      <td className="py-2 pr-2"><input type="number" step="0.01" value={formVals.costBasis} onChange={(e) => onChange({ ...formVals, costBasis: e.target.value })} className={input} placeholder="—" /></td>
      <td className="py-2 pr-2"><input type="number" step="0.01" value={formVals.currentValue} onChange={(e) => onChange({ ...formVals, currentValue: e.target.value })} className={input} placeholder="0.00" /></td>
      <td className="py-2 pr-2"><input value={formVals.notes} onChange={(e) => onChange({ ...formVals, notes: e.target.value })} className={input} placeholder="—" /></td>
    </>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="txt-muted text-left border-b border-base-500">
            <th className="pb-2 pr-2 font-medium">Name</th>
            <th className="pb-2 pr-2 font-medium">Type</th>
            <th className="pb-2 pr-2 font-medium">Ticker</th>
            <th className="pb-2 pr-2 font-medium">Shares</th>
            <th className="pb-2 pr-2 font-medium">Cost Basis</th>
            <th className="pb-2 pr-2 font-medium">Current Value</th>
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
                <td className="py-2 pr-2 txt-secondary uppercase text-xs">{item.type}</td>
                <td className="py-2 pr-2 txt-secondary">{item.ticker || "—"}</td>
                <td className="py-2 pr-2 txt-secondary">{item.shares?.toLocaleString() ?? "—"}</td>
                <td className="py-2 pr-2 txt-secondary">{item.costBasis != null ? `$${item.costBasis.toFixed(2)}` : "—"}</td>
                <td className="py-2 pr-2 txt-primary">${item.currentValue.toFixed(2)}</td>
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
        <p className="txt-faint text-sm text-center py-4">No investments added yet.</p>
      )}
      <button onClick={startAdd} className="mt-2 text-accent hover:text-accent-hover text-sm flex items-center gap-1">
        + Add Row
      </button>
    </div>
  );
}
