"use client";

import { useState } from "react";

interface Loan {
  id: string;
  name: string;
  type: string;
  balance: number;
  interestRate: number;
  monthlyPayment: number;
  termMonths: number | null;
  notes: string | null;
}

interface Props {
  items: Loan[];
  onRefresh: () => void;
}

const EMPTY_FORM = { name: "", type: "auto", balance: "", interestRate: "", monthlyPayment: "", termMonths: "", notes: "" };

export default function LoanCard({ items, onRefresh }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const startEdit = (item: Loan) => {
    setEditingId(item.id);
    setAddingNew(false);
    setForm({ name: item.name, type: item.type, balance: item.balance.toString(), interestRate: item.interestRate.toString(), monthlyPayment: item.monthlyPayment.toString(), termMonths: item.termMonths?.toString() || "", notes: item.notes || "" });
  };

  const startAdd = () => { setAddingNew(true); setEditingId(null); setForm(EMPTY_FORM); };
  const cancel = () => { setEditingId(null); setAddingNew(false); setForm(EMPTY_FORM); };

  const save = async () => {
    const method = editingId ? "PUT" : "POST";
    const body = editingId ? { ...form, id: editingId } : form;
    await fetch("/api/loans", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    cancel();
    onRefresh();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/loans?id=${id}`, { method: "DELETE" });
    onRefresh();
  };

  const input = "bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white w-full";

  const renderCells = (f: typeof EMPTY_FORM, onChange: (v: typeof EMPTY_FORM) => void) => (
    <>
      <td className="py-2 pr-2"><input value={f.name} onChange={(e) => onChange({ ...f, name: e.target.value })} className={input} placeholder="Name" /></td>
      <td className="py-2 pr-2">
        <select value={f.type} onChange={(e) => onChange({ ...f, type: e.target.value })} className={input}>
          <option value="auto">Auto</option><option value="mortgage">Mortgage</option><option value="student">Student</option>
          <option value="personal">Personal</option><option value="other">Other</option>
        </select>
      </td>
      <td className="py-2 pr-2"><input type="number" step="0.01" value={f.balance} onChange={(e) => onChange({ ...f, balance: e.target.value })} className={input} placeholder="0.00" /></td>
      <td className="py-2 pr-2"><input type="number" step="0.01" value={f.interestRate} onChange={(e) => onChange({ ...f, interestRate: e.target.value })} className={input} placeholder="0.00" /></td>
      <td className="py-2 pr-2"><input type="number" step="0.01" value={f.monthlyPayment} onChange={(e) => onChange({ ...f, monthlyPayment: e.target.value })} className={input} placeholder="0.00" /></td>
      <td className="py-2 pr-2"><input type="number" value={f.termMonths} onChange={(e) => onChange({ ...f, termMonths: e.target.value })} className={input} placeholder="—" /></td>
      <td className="py-2 pr-2"><input value={f.notes} onChange={(e) => onChange({ ...f, notes: e.target.value })} className={input} placeholder="—" /></td>
    </>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-400 text-left border-b border-gray-700">
            <th className="pb-2 pr-2 font-medium">Name</th>
            <th className="pb-2 pr-2 font-medium">Type</th>
            <th className="pb-2 pr-2 font-medium">Balance</th>
            <th className="pb-2 pr-2 font-medium">Interest Rate</th>
            <th className="pb-2 pr-2 font-medium">Monthly Pmt</th>
            <th className="pb-2 pr-2 font-medium">Term</th>
            <th className="pb-2 pr-2 font-medium">Notes</th>
            <th className="pb-2 w-20"></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) =>
            editingId === item.id ? (
              <tr key={item.id} className="border-b border-gray-700">
                {renderCells(form, setForm)}
                <td className="py-2">
                  <div className="flex gap-1">
                    <button onClick={save} className="text-green-400 hover:text-green-300 px-1" title="Save">✓</button>
                    <button onClick={cancel} className="text-gray-400 hover:text-gray-300 px-1" title="Cancel">✕</button>
                  </div>
                </td>
              </tr>
            ) : (
              <tr key={item.id} className="border-b border-gray-700/50 hover:bg-gray-750">
                <td className="py-2 pr-2 text-white">{item.name}</td>
                <td className="py-2 pr-2 text-gray-300 uppercase text-xs">{item.type}</td>
                <td className="py-2 pr-2 text-white">${item.balance.toFixed(2)}</td>
                <td className="py-2 pr-2 text-gray-300">{item.interestRate}%</td>
                <td className="py-2 pr-2 text-gray-300">${item.monthlyPayment.toFixed(2)}/mo</td>
                <td className="py-2 pr-2 text-gray-300">{item.termMonths ? `${item.termMonths} mo` : "—"}</td>
                <td className="py-2 pr-2 text-gray-400">{item.notes || "—"}</td>
                <td className="py-2">
                  <div className="flex gap-1">
                    <button onClick={() => startEdit(item)} className="text-blue-400 hover:text-blue-300 px-1" title="Edit">✎</button>
                    <button onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-300 px-1" title="Delete">🗑</button>
                  </div>
                </td>
              </tr>
            )
          )}
          {addingNew && (
            <tr className="border-b border-gray-700">
              {renderCells(form, setForm)}
              <td className="py-2">
                <div className="flex gap-1">
                  <button onClick={save} className="text-green-400 hover:text-green-300 px-1" title="Save">✓</button>
                  <button onClick={cancel} className="text-gray-400 hover:text-gray-300 px-1" title="Cancel">✕</button>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {items.length === 0 && !addingNew && (
        <p className="text-gray-500 text-sm text-center py-4">No loans added yet.</p>
      )}
      <button onClick={startAdd} className="mt-2 text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1">
        + Add Row
      </button>
    </div>
  );
}
