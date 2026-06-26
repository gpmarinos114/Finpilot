"use client";

import { useState, useEffect, Fragment } from "react";

interface SnapshotDetails {
  income: { source: string; amount: number; frequency: string }[];
  investments: { name: string; type: string; currentValue: number }[];
  creditCards: { name: string; balance: number; limit: number }[];
  loans: { name: string; type: string; balance: number; monthlyPayment: number }[];
  bills: { name: string; amount: number; frequency: string }[];
  savings: { name: string; currentAmount: number; targetAmount: number }[];
}

interface Snapshot {
  id: string;
  date: string;
  totalIncome: number;
  totalInvestments: number;
  totalCreditCardDebt: number;
  totalLoanDebt: number;
  totalMonthlyBills: number;
  totalSavings: number;
  netWorth: number;
  monthlyCashFlow: number;
  details: SnapshotDetails;
  createdAt: string;
}

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function ChangeBadge({ current, previous }: { current: number; previous: number }) {
  const diff = current - previous;
  if (diff === 0) return <span className="text-xs text-gray-500">—</span>;
  const positive = diff > 0;
  return (
    <span className={`text-xs ${positive ? "text-green-400" : "text-red-400"}`}>
      {positive ? "+" : ""}${fmt(diff)}
    </span>
  );
}

export default function SnapshotsPanel() {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const fetchSnapshots = async () => {
    const res = await fetch("/api/snapshots?limit=60");
    const data = await res.json();
    setSnapshots(data);
  };

  useEffect(() => {
    fetchSnapshots();
  }, []);

  const createManual = async () => {
    setCreating(true);
    await fetch("/api/snapshots", { method: "POST" });
    await fetchSnapshots();
    setCreating(false);
  };

  return (
    <div className="overflow-x-auto">
      {snapshots.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-4">No snapshots yet. They are created automatically when you update your financial data.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 text-left border-b border-gray-700">
              <th className="pb-2 pr-3 font-medium">Date</th>
              <th className="pb-2 pr-3 font-medium text-right">Net Worth</th>
              <th className="pb-2 pr-3 font-medium text-right">Cash Flow</th>
              <th className="pb-2 pr-3 font-medium text-right">Investments</th>
              <th className="pb-2 pr-3 font-medium text-right">Savings</th>
              <th className="pb-2 pr-3 font-medium text-right">Debt</th>
              <th className="pb-2 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {snapshots.map((s, i) => {
              const prev = snapshots[i + 1];
              const totalDebt = s.totalCreditCardDebt + s.totalLoanDebt;
              const isOpen = expanded === s.id;
              return (
                <Fragment key={s.id}>
                  <tr
                    className="border-b border-gray-700/50 hover:bg-gray-750 cursor-pointer"
                    onClick={() => setExpanded(isOpen ? null : s.id)}
                  >
                    <td className="py-2 pr-3 text-white">{s.date}</td>
                    <td className="py-2 pr-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {prev && <ChangeBadge current={s.netWorth} previous={prev.netWorth} />}
                        <span className={s.netWorth >= 0 ? "text-green-400" : "text-red-400"}>${fmt(s.netWorth)}</span>
                      </div>
                    </td>
                    <td className="py-2 pr-3 text-right">
                      <span className={s.monthlyCashFlow >= 0 ? "text-green-400" : "text-red-400"}>${fmt(s.monthlyCashFlow)}</span>
                    </td>
                    <td className="py-2 pr-3 text-right text-blue-400">${fmt(s.totalInvestments)}</td>
                    <td className="py-2 pr-3 text-right text-emerald-400">${fmt(s.totalSavings)}</td>
                    <td className="py-2 pr-3 text-right text-red-400">${fmt(totalDebt)}</td>
                    <td className="py-2 text-gray-400 text-xs">{isOpen ? "▼" : "▶"}</td>
                  </tr>
                  {isOpen && (
                    <tr>
                      <td colSpan={7} className="bg-gray-900 px-4 py-3">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                          <div>
                            <p className="text-gray-400 font-medium mb-1">Income</p>
                            {s.details.income.map((item, j) => (
                              <p key={j} className="text-gray-300">{item.source}: ${fmt(item.amount)}/{item.frequency}</p>
                            ))}
                            {s.details.income.length === 0 && <p className="text-gray-500">None</p>}
                          </div>
                          <div>
                            <p className="text-gray-400 font-medium mb-1">Investments</p>
                            {s.details.investments.map((item, j) => (
                              <p key={j} className="text-gray-300">{item.name}: ${fmt(item.currentValue)}</p>
                            ))}
                            {s.details.investments.length === 0 && <p className="text-gray-500">None</p>}
                          </div>
                          <div>
                            <p className="text-gray-400 font-medium mb-1">Credit Cards</p>
                            {s.details.creditCards.map((item, j) => (
                              <p key={j} className="text-gray-300">{item.name}: ${fmt(item.balance)} / ${fmt(item.limit)}</p>
                            ))}
                            {s.details.creditCards.length === 0 && <p className="text-gray-500">None</p>}
                          </div>
                          <div>
                            <p className="text-gray-400 font-medium mb-1">Loans</p>
                            {s.details.loans.map((item, j) => (
                              <p key={j} className="text-gray-300">{item.name}: ${fmt(item.balance)} (${fmt(item.monthlyPayment)}/mo)</p>
                            ))}
                            {s.details.loans.length === 0 && <p className="text-gray-500">None</p>}
                          </div>
                          <div>
                            <p className="text-gray-400 font-medium mb-1">Savings</p>
                            {s.details.savings.map((item, j) => (
                              <p key={j} className="text-gray-300">{item.name}: ${fmt(item.currentAmount)} / ${fmt(item.targetAmount)}</p>
                            ))}
                            {s.details.savings.length === 0 && <p className="text-gray-500">None</p>}
                          </div>
                          <div>
                            <p className="text-gray-400 font-medium mb-1">Bills</p>
                            {s.details.bills.map((item, j) => (
                              <p key={j} className="text-gray-300">{item.name}: ${fmt(item.amount)}/{item.frequency}</p>
                            ))}
                            {s.details.bills.length === 0 && <p className="text-gray-500">None</p>}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      )}
      <button onClick={createManual} disabled={creating} className="mt-2 text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 disabled:text-gray-500">
        {creating ? "Creating..." : "📸 Take Snapshot Now"}
      </button>
    </div>
  );
}
