"use client";

import { useState, useEffect, useCallback } from "react";
import FinancialSummary from "./FinancialSummary";
import CollapsibleCard from "./CollapsibleCard";
import IncomeCard from "./IncomeCard";
import InvestmentCard from "./InvestmentCard";
import CreditCardForm from "./CreditCardForm";
import LoanCard from "./LoanCard";
import BillCard from "./BillCard";
import SavingsCard from "./SavingsCard";
import SnapshotsPanel from "./SnapshotsPanel";
import MemoryPanel from "./MemoryPanel";
import { onDataChanged } from "@/lib/events";

export default function Dashboard() {
  const [data, setData] = useState({
    income: [] as unknown[],
    investments: [] as unknown[],
    creditCards: [] as unknown[],
    loans: [] as unknown[],
    bills: [] as unknown[],
    savings: [] as unknown[],
  });

  const fetchAll = useCallback(async () => {
    const [income, investments, creditCards, loans, bills, savings] = await Promise.all([
      fetch("/api/income").then((r) => r.json()),
      fetch("/api/investments").then((r) => r.json()),
      fetch("/api/credit-cards").then((r) => r.json()),
      fetch("/api/loans").then((r) => r.json()),
      fetch("/api/bills").then((r) => r.json()),
      fetch("/api/savings").then((r) => r.json()),
    ]);
    setData({ income, investments, creditCards, loans, bills, savings });
  }, []);

  const refreshAndSnapshot = useCallback(async () => {
    await fetchAll();
    fetch("/api/snapshots", { method: "POST" }).catch(() => {});
  }, [fetchAll]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAll();
  }, []);

  useEffect(() => {
    return onDataChanged(() => {
      fetchAll();
      fetch("/api/snapshots", { method: "POST" }).catch(() => {});
    });
  }, [fetchAll]);

  const summary = {
    totalIncome: (data.income as { amount: number; frequency: string }[])
      .filter((i) => i.frequency === "monthly")
      .reduce((s, i) => s + i.amount, 0),
    totalInvestments: (data.investments as { currentValue: number }[]).reduce((s, i) => s + i.currentValue, 0),
    totalCreditCardDebt: (data.creditCards as { balance: number }[]).reduce((s, c) => s + c.balance, 0),
    totalLoanDebt: (data.loans as { balance: number }[]).reduce((s, l) => s + l.balance, 0),
    totalMonthlyBills: (data.bills as { amount: number; frequency: string }[])
      .filter((b) => b.frequency === "monthly")
      .reduce((s, b) => s + b.amount, 0),
    totalSavings: (data.savings as { currentAmount: number }[]).reduce((s, g) => s + g.currentAmount, 0),
    netWorth:
      (data.investments as { currentValue: number }[]).reduce((s, i) => s + i.currentValue, 0) +
      (data.savings as { currentAmount: number }[]).reduce((s, g) => s + g.currentAmount, 0) -
      (data.creditCards as { balance: number }[]).reduce((s, c) => s + c.balance, 0) -
      (data.loans as { balance: number }[]).reduce((s, l) => s + l.balance, 0),
    monthlyCashFlow:
      (data.income as { amount: number; frequency: string }[])
        .filter((i) => i.frequency === "monthly")
        .reduce((s, i) => s + i.amount, 0) -
      (data.bills as { amount: number; frequency: string }[])
        .filter((b) => b.frequency === "monthly")
        .reduce((s, b) => s + b.amount, 0) -
      (data.loans as { monthlyPayment: number }[]).reduce((s, l) => s + l.monthlyPayment, 0) -
      (data.creditCards as { minPayment: number }[]).reduce((s, c) => s + c.minPayment, 0),
    debtToIncomeRatio: 0,
  };
  const totalDebt = summary.totalCreditCardDebt + summary.totalLoanDebt;
  summary.debtToIncomeRatio = summary.totalIncome > 0 ? (totalDebt / summary.totalIncome) * 100 : 0;

  return (
    <div className="flex flex-col gap-4 p-4">
      <FinancialSummary data={summary} />

      <CollapsibleCard title="Income" icon="💰">
        <IncomeCard items={data.income as never[]} onRefresh={refreshAndSnapshot} />
      </CollapsibleCard>

      <CollapsibleCard title="Investments" icon="📈">
        <InvestmentCard items={data.investments as never[]} onRefresh={refreshAndSnapshot} />
      </CollapsibleCard>

      <CollapsibleCard title="Credit Cards" icon="💳">
        <CreditCardForm items={data.creditCards as never[]} onRefresh={refreshAndSnapshot} />
      </CollapsibleCard>

      <CollapsibleCard title="Loans" icon="🏦">
        <LoanCard items={data.loans as never[]} onRefresh={refreshAndSnapshot} />
      </CollapsibleCard>

      <CollapsibleCard title="Bills" icon="📄">
        <BillCard items={data.bills as never[]} onRefresh={refreshAndSnapshot} />
      </CollapsibleCard>

      <CollapsibleCard title="Savings" icon="🎯">
        <SavingsCard items={data.savings as never[]} onRefresh={refreshAndSnapshot} />
      </CollapsibleCard>

      <CollapsibleCard title="Snapshots" icon="📸" defaultOpen={false}>
        <SnapshotsPanel />
      </CollapsibleCard>

      <CollapsibleCard title="Memory" icon="🧠" defaultOpen={false}>
        <MemoryPanel />
      </CollapsibleCard>
    </div>
  );
}
